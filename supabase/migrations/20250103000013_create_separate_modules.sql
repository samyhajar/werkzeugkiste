-- Create separate modules for each course
DO $$
DECLARE
    module_id UUID;
    course_id UUID;
BEGIN
    -- Module 2: SEO Mastery
    INSERT INTO modules (id, title, description, hero_image, status, created_at, updated_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Modul 2: SEO Mastery', 'Lernen Sie die Grundlagen der Suchmaschinenoptimierung und verbessern Sie Ihre Online-Sichtbarkeit.', '/header-full-computer-final.jpg', 'published', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Update SEO Mastery course to belong to this module
    UPDATE courses
    SET module_id = '550e8400-e29b-41d4-a716-446655440001',
        hero_image = '/header-full-computer-final.jpg'
    WHERE title = 'SEO Mastery';

    -- Module 3: Social Media Marketing
    INSERT INTO modules (id, title, description, hero_image, status, created_at, updated_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440002', 'Modul 3: Social Media Marketing', 'Entdecken Sie effektive Strategien für Marketing in sozialen Medien und erreichen Sie Ihre Zielgruppe.', '/header-full-computer-final.jpg', 'published', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Update Social Media Marketing course to belong to this module
    UPDATE courses
    SET module_id = '550e8400-e29b-41d4-a716-446655440002',
        hero_image = '/header-full-computer-final.jpg'
    WHERE title = 'Social Media Marketing';

    -- Module 4: HTML & CSS Basics
    INSERT INTO modules (id, title, description, hero_image, status, created_at, updated_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440003', 'Modul 4: HTML & CSS Basics', 'Bauen Sie Ihre erste Website mit HTML und CSS. Perfekt für Anfänger ohne Vorkenntnisse.', '/header-full-computer-final.jpg', 'published', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Update HTML & CSS Basics course to belong to this module
    UPDATE courses
    SET module_id = '550e8400-e29b-41d4-a716-446655440003',
        hero_image = '/header-full-computer-final.jpg'
    WHERE title = 'HTML & CSS Basics';

    -- Module 5: JavaScript Fundamentals
    INSERT INTO modules (id, title, description, hero_image, status, created_at, updated_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440004', 'Modul 5: JavaScript Fundamentals', 'Lernen Sie Programmieren mit JavaScript. Von den Grundlagen bis zu praktischen Anwendungen.', '/header-full-computer-final.jpg', 'published', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Update JavaScript Fundamentals course to belong to this module
    UPDATE courses
    SET module_id = '550e8400-e29b-41d4-a716-446655440004',
        hero_image = '/header-full-computer-final.jpg'
    WHERE title = 'JavaScript Fundamentals';

    -- Add some basic lessons to each of these modules to make them functional

    -- SEO Mastery lessons
    SELECT id INTO course_id FROM courses WHERE title = 'SEO Mastery' LIMIT 1;
    IF course_id IS NOT NULL THEN
        INSERT INTO lessons (id, course_id, sort_order, title, content, created_at, updated_at) VALUES
        (gen_random_uuid(), course_id, 1, 'Was ist SEO?',
         '<h2>Suchmaschinenoptimierung verstehen</h2>
          <p>SEO (Search Engine Optimization) hilft dabei, dass Ihre Website in Suchmaschinen besser gefunden wird.</p>
          <ul>
            <li>Mehr Besucher auf Ihrer Website</li>
            <li>Bessere Sichtbarkeit in Google</li>
            <li>Kostenlose organische Reichweite</li>
          </ul>',
         NOW(), NOW()),
        (gen_random_uuid(), course_id, 2, 'Keywords finden',
         '<h2>Die richtigen Suchbegriffe finden</h2>
          <p>Keywords sind die Wörter, nach denen Menschen in Google suchen.</p>
          <p>Wichtige Schritte:</p>
          <ul>
            <li>Zielgruppe verstehen</li>
            <li>Keyword-Tools nutzen</li>
            <li>Konkurrenz analysieren</li>
          </ul>',
         NOW(), NOW());
    END IF;

    -- Social Media Marketing lessons
    SELECT id INTO course_id FROM courses WHERE title = 'Social Media Marketing' LIMIT 1;
    IF course_id IS NOT NULL THEN
        INSERT INTO lessons (id, course_id, sort_order, title, content, created_at, updated_at) VALUES
        (gen_random_uuid(), course_id, 1, 'Social Media Grundlagen',
         '<h2>Erfolgreich in sozialen Medien</h2>
          <p>Lernen Sie die wichtigsten Plattformen und deren Besonderheiten kennen.</p>
          <ul>
            <li>Facebook für Unternehmen</li>
            <li>Instagram Marketing</li>
            <li>LinkedIn für B2B</li>
          </ul>',
         NOW(), NOW()),
        (gen_random_uuid(), course_id, 2, 'Content erstellen',
         '<h2>Inhalte die begeistern</h2>
          <p>Erstellen Sie Inhalte, die Ihre Zielgruppe ansprechen und zum Teilen animieren.</p>
          <ul>
            <li>Visueller Content</li>
            <li>Storytelling</li>
            <li>Community Building</li>
          </ul>',
         NOW(), NOW());
    END IF;

    -- HTML & CSS lessons
    SELECT id INTO course_id FROM courses WHERE title = 'HTML & CSS Basics' LIMIT 1;
    IF course_id IS NOT NULL THEN
        INSERT INTO lessons (id, course_id, sort_order, title, content, created_at, updated_at) VALUES
        (gen_random_uuid(), course_id, 1, 'HTML Grundlagen',
         '<h2>Ihre erste Webseite</h2>
          <p>HTML ist die Grundlage jeder Webseite. Lernen Sie die wichtigsten Tags kennen.</p>
          <ul>
            <li>&lt;h1&gt; für Überschriften</li>
            <li>&lt;p&gt; für Textabsätze</li>
            <li>&lt;a&gt; für Links</li>
          </ul>',
         NOW(), NOW()),
        (gen_random_uuid(), course_id, 2, 'CSS Styling',
         '<h2>Webseiten schön gestalten</h2>
          <p>Mit CSS verleihen Sie Ihrer Webseite das gewünschte Aussehen.</p>
          <ul>
            <li>Farben und Schriften</li>
            <li>Layout und Positioning</li>
            <li>Responsive Design</li>
          </ul>',
         NOW(), NOW());
    END IF;

    -- JavaScript lessons
    SELECT id INTO course_id FROM courses WHERE title = 'JavaScript Fundamentals' LIMIT 1;
    IF course_id IS NOT NULL THEN
        INSERT INTO lessons (id, course_id, sort_order, title, content, created_at, updated_at) VALUES
        (gen_random_uuid(), course_id, 1, 'JavaScript Einführung',
         '<h2>Programmieren lernen</h2>
          <p>JavaScript macht Webseiten interaktiv und dynamisch.</p>
          <ul>
            <li>Variablen und Datentypen</li>
            <li>Funktionen</li>
            <li>Event-Handling</li>
          </ul>',
         NOW(), NOW()),
        (gen_random_uuid(), course_id, 2, 'DOM Manipulation',
         '<h2>Webseiten interaktiv machen</h2>
          <p>Lernen Sie, wie Sie HTML-Elemente mit JavaScript verändern können.</p>
          <ul>
            <li>Elemente auswählen</li>
            <li>Inhalte ändern</li>
            <li>Event-Listener</li>
          </ul>',
         NOW(), NOW());
    END IF;

    RAISE NOTICE 'Created 4 additional modules with basic content';
END $$;