const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// --- Configuration ---
const envPath = path.resolve(__dirname, '.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
        const [key, val] = line.split('=');
        if (key && val) {
            if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val.trim().replace(/"/g, '');
            if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = val.trim().replace(/"/g, '');
        }
    });
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Constants ---
// From templates.ts
const CERTIFICATE_TEMPLATE_PATH = 'templates/zertifikat digi plus (A4).pdf';
const CERTIFICATE_TEMPLATE_VERSION = 'a4-2025-10-13';

// --- Generation Logic (Adapted from generate-module-certificate.ts) ---

async function generateAndStoreCertificate(user, module) {
    const userId = user.id;
    const moduleId = module.id;
    // Construct user name: prefer full_name, fallback to email if empty
    const userName = user.full_name && user.full_name.trim().length > 0 ? user.full_name.trim() : (user.email || 'Unbekannt');
    const moduleTitle = module.title;

    const issuedAt = new Date();
    const certificateNumber = `ZERT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    // Added random suffix to avoid collision if running fast

    const formattedDate = issuedAt.toLocaleDateString('de-AT');
    const issuedAtIso = issuedAt.toISOString();

    // 1. Load Template
    let pdfDoc;
    let page;
    let templateLoaded = false;
    let templateSource = 'fallback';

    // Try Storage Download
    try {
        const { data, error } = await supabase.storage
            .from('certificates')
            .download(CERTIFICATE_TEMPLATE_PATH);

        if (data) {
            const bytes = await data.arrayBuffer();
            pdfDoc = await PDFDocument.load(bytes);
            templateLoaded = true;
            templateSource = 'storage';
        } else {
            console.warn(`Failed to download template: ${error?.message}`);
        }
    } catch (e) {
        console.warn(`Exception downloading template: ${e.message}`);
    }

    if (!templateLoaded) {
        // Fallback: create blank if missing (should not happen if system is healthy)
        // or try public URL?
        // Since we are running as a script, we probably want to fail if template is missing to avoid bad certs.
        console.error('CRITICAL: Could not load certificate template. Aborting for this user.');
        return null;
    }

    page = pdfDoc.getPage(0);
    const { width, height } = page.getSize();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const centerX = width / 2;

    const drawCenteredText = (text, y, size, font) => {
        const textWidth = font.widthOfTextAtSize(text, size);
        page.drawText(text, {
            x: centerX - textWidth / 2,
            y,
            size,
            font,
            color: rgb(0, 0, 0),
        });
    };

    const drawText = (text, x, y, size, font) => {
        page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
    };

    // Coordinates from original file
    const yModule = height - 375;
    const yName = height - 290;
    const yDate = 190;
    const dateX = 470;

    if (userName) drawCenteredText(userName, yName, 14, fontRegular);
    if (moduleTitle) drawCenteredText(moduleTitle, yModule, 18, fontBold);
    drawText(formattedDate, dateX, yDate, 12, fontRegular);

    const pdfBytes = await pdfDoc.save();
    const certificatePath = `certificates/${userId}/${moduleId}.pdf`;

    // 2. Upload
    const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(certificatePath, pdfBytes, {
            contentType: 'application/pdf',
            upsert: true,
        });

    if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 3. Upsert Record
    const { error: upsertError } = await supabase.from('certificates').upsert(
        {
            user_id: userId,
            module_id: moduleId,
            pdf_url: certificatePath,
            issued_at: issuedAtIso,
            name_used: userName,
            show_name: true,
            meta: {
                certificateNumber,
                userEmail: user.email,
                templateVersion: CERTIFICATE_TEMPLATE_VERSION,
                templatePath: CERTIFICATE_TEMPLATE_PATH,
                templateSource,
                templateLoaded,
                displayDate: true,
                generatedBy: 'batch_script'
            },
        },
        { onConflict: 'user_id,module_id' },
    );

    if (upsertError) {
        throw new Error(`Record save failed: ${upsertError.message}`);
    }

    return { certificatePath, certificateNumber };
}


// --- Main ---

async function main() {
    if (!fs.existsSync('missing_certificates.json')) {
        console.log('No missing_certificates.json found. Run check script first.');
        return;
    }

    const missing = JSON.parse(fs.readFileSync('missing_certificates.json', 'utf8'));
    console.log(`Loaded ${missing.length} missing certificates to process.`);

    let successCount = 0;
    let failCount = 0;

    for (const [index, item] of missing.entries()) {
        console.log(`[${index + 1}/${missing.length}] Processing ${item.userEmail} for ${item.moduleTitle}...`);

        try {
            // Construct minimal user/module objects
            const userObj = { id: item.userId, full_name: item.userName, email: item.userEmail };
            const moduleObj = { id: item.moduleId, title: item.moduleTitle };

            const result = await generateAndStoreCertificate(userObj, moduleObj);

            if (result) {
                console.log(`  -> Success! Cert: ${result.certificateNumber}`);
                successCount++;
            } else {
                console.log(`  -> Failed (Null result)`);
                failCount++;
            }
        } catch (err) {
            console.error(`  -> Error: ${err.message}`);
            failCount++;
        }

        // Slight delay to be nice to API
        await new Promise(r => setTimeout(r, 200));
    }

    console.log('\nBatch processing complete.');
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
}

main().catch(console.error);
