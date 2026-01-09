const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to load env vars from .env.local
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
            if (!supabaseKey && key.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = val.trim().replace(/"/g, '');
        }
    });
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Make sure .env.local exists with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON KEY).');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_EMAIL = 'monika.kerschbaumer@gmail.com';

async function main() {
    console.log(`Searching for user: ${TARGET_EMAIL}...`);

    let { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .ilike('email', TARGET_EMAIL);

    if (userError || !users || users.length === 0) {
        const { data: allProfiles } = await supabase.from('profiles').select('id, email, full_name');
        const found = allProfiles.find(p => p.email && p.email.toLowerCase().includes('monika'));
        if (found) {
            console.log(`Found potential match: ${found.email} (${found.full_name})`);
            users = [found];
        } else {
            console.error('User not found.');
            return;
        }
    }

    const user = users[0];
    console.log(`Found user: ${user.full_name} (${user.id})`);

    // 2. Fetch all modules
    const { data: modules } = await supabase
        .from('modules')
        .select('id, title, order')
        .order('order');

    console.log(`\nChecking progress for ${modules.length} modules...`);

    for (const module of modules) {
        console.log(`\n--- Module: ${module.title} ---`);

        // Check Courses
        const { data: courses } = await supabase
            .from('courses')
            .select('id, title')
            .eq('module_id', module.id);

        if (!courses || courses.length === 0) {
            console.log('  (No courses in this module)');
            continue;
        }

        let moduleComplete = true;

        for (const course of courses) {
            // Check Lessons
            const { data: lessons } = await supabase
                .from('lessons')
                .select('id, title, sort_order')
                .eq('course_id', course.id)
                .order('sort_order');

            const { data: completedLessons } = await supabase
                .from('lesson_progress')
                .select('lesson_id')
                .eq('student_id', user.id)
                .in('lesson_id', lessons.map(l => l.id));

            const completedLessonIds = new Set(completedLessons.map(l => l.lesson_id));
            const missingLessons = lessons.filter(l => !completedLessonIds.has(l.id));

            if (missingLessons.length > 0) {
                console.log(`  Course: ${course.title} - MISSING LESSONS:`);
                missingLessons.forEach(l => console.log(`    [ ] ${l.title} (${l.id})`));
                moduleComplete = false;
            }
        }

        // Check Quizzes
        const courseIds = courses.map(c => c.id);
        const { data: quizzes } = await supabase
            .from('enhanced_quizzes')
            .select('id, title, course_id')
            .in('course_id', courseIds);

        if (quizzes && quizzes.length > 0) {
            const { data: attempts } = await supabase
                .from('enhanced_quiz_attempts')
                .select('quiz_id, passed, score_percent')
                .eq('user_id', user.id)
                .in('quiz_id', quizzes.map(q => q.id));

            const passedQuizIds = new Set(attempts.filter(a => a.passed).map(a => a.quiz_id));
            const missingQuizzes = quizzes.filter(q => !passedQuizIds.has(q.id));

            if (missingQuizzes.length > 0) {
                console.log(`  MISSING QUIZZES:`);
                for (const q of missingQuizzes) {
                    const { data: failedAttempts } = await supabase
                        .from('enhanced_quiz_attempts')
                        .select('id, score_percent, finished_at')
                        .eq('user_id', user.id)
                        .eq('quiz_id', q.id);

                    if (failedAttempts && failedAttempts.length > 0) {
                        console.log(`    [ ] ${q.title} (${q.id}) - ${failedAttempts.length} FAILED ATTEMPTS (Best: ${Math.max(...failedAttempts.map(a => a.score_percent))}%)`);
                    } else {
                        console.log(`    [ ] ${q.title} (${q.id}) - NO ATTEMPTS`);
                    }
                }
                moduleComplete = false;
            }
        }

        // Check Certificate
        const { data: cert } = await supabase
            .from('certificates')
            .select('id, issued_at')
            .eq('user_id', user.id)
            .eq('module_id', module.id)
            .maybeSingle();

        if (cert) {
            console.log(`  [x] Certificate issued on ${new Date(cert.issued_at).toLocaleString()}`);
        } else {
            console.log(`  [ ] NO CERTIFICATE`);
            if (moduleComplete) {
                console.log(`  !!! ANALYSE: Module seems complete but no certificate !!!`);
                console.log(`  (Should be fixed)`);
            }
        }
    }
}

main().catch(console.error);
