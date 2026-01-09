const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
            if (!supabaseKey && key.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = val.trim().replace(/"/g, '');
        }
    });
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Helpers ---

// Helper to fetch all rows (auto-pagination)
async function fetchAll(table, select = '*', queryFn = (q) => q) {
    let allData = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        let query = supabase.from(table).select(select).range(page * pageSize, (page + 1) * pageSize - 1);
        query = queryFn(query);
        const { data, error } = await query;

        if (error) throw error;
        if (!data || data.length === 0) break;

        allData = allData.concat(data);
        if (data.length < pageSize) break;
        page++;
    }
    return allData;
}

// --- Main ---

async function main() {
    console.log('Starting batch certificate check...');

    // 1. Load Metadata (Modules, Courses, Lessons, Quizzes)
    console.log('Loading metadata...');

    const modules = await fetchAll('modules', 'id, title, order');
    const courses = await fetchAll('courses', 'id, title, module_id');
    const lessons = await fetchAll('lessons', 'id, title, course_id, sort_order');
    const quizzes = await fetchAll('enhanced_quizzes', 'id, title, course_id, lesson_id');

    // Map hierarchical structure
    // Module -> Courses
    const moduleCoursesMap = new Map();
    modules.forEach(m => moduleCoursesMap.set(m.id, []));
    courses.forEach(c => {
        if (moduleCoursesMap.has(c.module_id)) {
            moduleCoursesMap.get(c.module_id).push(c);
        }
    });

    // Course -> Lessons
    const courseLessonsMap = new Map();
    courses.forEach(c => courseLessonsMap.set(c.id, []));
    lessons.forEach(l => {
        if (courseLessonsMap.has(l.course_id)) {
            courseLessonsMap.get(l.course_id).push(l);
        }
    });

    // Course -> Quizzes
    const courseQuizzesMap = new Map();
    courses.forEach(c => courseQuizzesMap.set(c.id, []));
    quizzes.forEach(q => {
        if (q.course_id && courseQuizzesMap.has(q.course_id)) {
            courseQuizzesMap.get(q.course_id).push(q);
        }
    });

    // 2. Load Profiles
    console.log('Loading profiles...');
    const profiles = await fetchAll('profiles', 'id, email, full_name');
    console.log(`Found ${profiles.length} profiles.`);

    // 3. Load Certificates
    console.log('Loading existing certificates...');
    const certificates = await fetchAll('certificates', 'id, user_id, module_id');
    const certMap = new Set(); // Set of "userId:moduleId"
    certificates.forEach(c => certMap.add(`${c.user_id}:${c.module_id}`));

    const missingCertificates = [];

    // 4. Iterate Users
    console.log('Checking progress for all users...');

    for (const [index, user] of profiles.entries()) {
        if (index % 10 === 0) process.stdout.write('.');

        // Fetch user progress
        // Note: Fetching per user to avoid massive memory usage if we loaded ALL progress
        // But we could optimize by fetching all progress if DB isn't huge.
        // Let's stick to per-user but maybe parallelize slightly or just accept it might take a minute.

        // Optimizing: fetch all progress for this user in one go
        const { data: userLessonProgress } = await supabase
            .from('lesson_progress')
            .select('lesson_id')
            .eq('student_id', user.id);

        const completedLessonIds = new Set((userLessonProgress || []).map(lp => lp.lesson_id));

        const { data: userQuizAttempts } = await supabase
            .from('enhanced_quiz_attempts')
            .select('quiz_id, passed')
            .eq('user_id', user.id)
            .eq('passed', true);

        const passedQuizIds = new Set((userQuizAttempts || []).map(qa => qa.quiz_id));

        // Check each module
        for (const module of modules) {
            // Skip check if cert already exists?
            // No, maybe we want to know if they completed it even if they have cert (for validation),
            // but for now we only care if they are missing cert.
            if (certMap.has(`${user.id}:${module.id}`)) continue;

            const modCourses = moduleCoursesMap.get(module.id) || [];
            if (modCourses.length === 0) continue;

            let isModuleComplete = true;

            for (const course of modCourses) {
                const crsLessons = courseLessonsMap.get(course.id) || [];
                const crsQuizzes = courseQuizzesMap.get(course.id) || [];

                // Check Lessons
                const lessonsComplete = crsLessons.every(l => completedLessonIds.has(l.id));
                if (!lessonsComplete) {
                    isModuleComplete = false;
                    break;
                }

                // Check Quizzes
                const quizzesPassed = crsQuizzes.every(q => passedQuizIds.has(q.id));
                if (!quizzesPassed) {
                    isModuleComplete = false;
                    break;
                }
            }

            if (isModuleComplete) {
                missingCertificates.push({
                    userId: user.id,
                    userEmail: user.email,
                    userName: user.full_name,
                    moduleId: module.id,
                    moduleTitle: module.title
                });
            }
        }
    }

    console.log('\n\nAnalysis Complete.');
    console.log(`Found ${missingCertificates.length} missing certificates.`);

    if (missingCertificates.length > 0) {
        console.log('Writing results to missing_certificates.json...');
        fs.writeFileSync('missing_certificates.json', JSON.stringify(missingCertificates, null, 2));

        console.log('\nPreview of missing:');
        missingCertificates.slice(0, 5).forEach(m => {
            console.log(`- User: ${m.userName} (${m.userEmail}) | Module: ${m.moduleTitle}`);
        });
        if (missingCertificates.length > 5) console.log(`... and ${missingCertificates.length - 5} more.`);
    }
}

main().catch(console.error);
