-- Add German Digital Module with all lessons and content
DO $$
DECLARE
    module_id UUID;
    admin_user_id UUID;
    lesson_id UUID;
    quiz_id UUID;
    question_id UUID;
BEGIN
    -- Get the first admin user
    SELECT id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;

    -- Create the main module
    INSERT INTO courses (id, title, description, status, admin_id, created_at, updated_at) VALUES
    (gen_random_uuid(), 'Modul 1: Einstieg in die digitale Welt', 'Grundlegende Informationen zur digitalen Welt, Smartphones, Computer und Windows-Bedienung', 'published', admin_user_id, NOW(), NOW())
    RETURNING id INTO module_id;

    -- Create Kurs 1: Digitalisierung Basis lessons
    INSERT INTO lessons (id, title, content, course_id, sort_order, created_at, updated_at) VALUES
    (gen_random_uuid(), 'Digital & Analog',
     '<h2>Was bedeutet digital eigentlich?</h2>
      <p>Das lässt sich am besten im Vergleich zum Gegenteil erklären:</p>
      <div class="comparison-grid">
        <div class="digital-section">
          <h3>Digitale Stoppuhr</h3>
          <ul>
            <li>– kann hundertstel Sekunden messen</li>
            <li>– benötigt Strom (Batterien)</li>
          </ul>
        </div>
        <div class="analog-section">
          <h3>Analoge Stoppuhr</h3>
          <ul>
            <li>– zeigt das Ergebnis ungefähr</li>
            <li>– funktioniert ohne Strom</li>
          </ul>
        </div>
      </div>
      <p><strong>Digitalisierung</strong> bedeutet, dass immer mehr im Internet auf Computern und Smartphones passiert. Ob uns das nun gefällt oder nicht, diese Veränderungen sind schon da. Damit wir analogen Menschen die digitalen Geräte verwenden können brauchen wir:</p>
      <ul>
        <li>ein bisschen Wissen,</li>
        <li>ein bisschen Erfahrung und</li>
        <li>manchmal gute Nerven.</li>
      </ul>',
     module_id, 1, NOW(), NOW()),

    (gen_random_uuid(), 'Dein Digitaler Nutzen',
     '<h2>Warum digital werden?</h2>
      <p>Die Digitalisierung bringt viele Vorteile mit sich:</p>
      <ul>
        <li>Schnellere Kommunikation mit Familie und Freunden</li>
        <li>Einfacher Zugang zu Informationen</li>
        <li>Online-Banking und -Shopping</li>
        <li>Unterhaltung und Bildung</li>
      </ul>
      <p>Mit den richtigen Grundkenntnissen können Sie diese Vorteile sicher nutzen.</p>',
     module_id, 2, NOW(), NOW()),

    (gen_random_uuid(), 'Elektronische Geräte',
     '<h2>Die wichtigsten digitalen Geräte</h2>
      <p>Lernen Sie die grundlegenden elektronischen Geräte kennen:</p>
      <h3>Smartphone</h3>
      <p>Ein kleiner Computer für die Hosentasche mit Telefonfunktion.</p>
      <h3>Tablet</h3>
      <p>Größer als ein Smartphone, ideal zum Lesen und Surfen.</p>
      <h3>Computer/Laptop</h3>
      <p>Für umfangreichere Arbeiten und komplexe Anwendungen.</p>',
     module_id, 3, NOW(), NOW()),

    (gen_random_uuid(), 'Hardware & Software',
     '<h2>Hardware vs. Software</h2>
      <p><strong>Hardware</strong> ist alles, was Sie anfassen können:</p>
      <ul>
        <li>Bildschirm</li>
        <li>Tastatur</li>
        <li>Maus</li>
        <li>Gehäuse</li>
      </ul>
      <p><strong>Software</strong> sind die Programme:</p>
      <ul>
        <li>Betriebssystem (Windows, Android, iOS)</li>
        <li>Apps und Programme</li>
        <li>Browser</li>
      </ul>',
     module_id, 4, NOW(), NOW()),

    (gen_random_uuid(), 'Geräte vor Gefahren schützen',
     '<h2>Sicherheit für Ihre Geräte</h2>
      <p>Wichtige Schutzmaßnahmen:</p>
      <ul>
        <li>Regelmäßige Updates installieren</li>
        <li>Starke Passwörter verwenden</li>
        <li>Vorsicht bei unbekannten E-Mails</li>
        <li>Nur aus vertrauenswürdigen Quellen herunterladen</li>
      </ul>
      <p>Ein geschütztes Gerät ist ein sicheres Gerät!</p>',
     module_id, 5, NOW(), NOW()),

    (gen_random_uuid(), 'Das Smartphone vor fremden Fingern schützen',
     '<h2>Smartphone-Sicherheit</h2>
      <p>So schützen Sie Ihr Smartphone:</p>
      <ul>
        <li>Bildschirmsperre einrichten (PIN, Muster, Fingerabdruck)</li>
        <li>Automatische Sperre nach kurzer Zeit</li>
        <li>Apps aus offiziellen Stores laden</li>
        <li>Berechtigungen von Apps prüfen</li>
      </ul>',
     module_id, 6, NOW(), NOW()),

    (gen_random_uuid(), 'Das Internet',
     '<h2>Was ist das Internet?</h2>
      <p>Das Internet ist ein weltweites Netzwerk von Computern, die miteinander verbunden sind.</p>
      <h3>Wichtige Begriffe:</h3>
      <ul>
        <li><strong>Browser:</strong> Programm zum Surfen (Chrome, Firefox, Safari)</li>
        <li><strong>Website:</strong> Eine Internetseite</li>
        <li><strong>URL:</strong> Die Adresse einer Website</li>
        <li><strong>Link:</strong> Verweis auf andere Seiten</li>
      </ul>',
     module_id, 7, NOW(), NOW()),

    (gen_random_uuid(), 'Smartphone mit einem WLAN verbinden',
     '<h2>WLAN-Verbindung einrichten</h2>
      <p>Schritt-für-Schritt Anleitung:</p>
      <ol>
        <li>Einstellungen öffnen</li>
        <li>WLAN oder WiFi auswählen</li>
        <li>Verfügbare Netzwerke anzeigen</li>
        <li>Ihr Netzwerk auswählen</li>
        <li>Passwort eingeben</li>
        <li>Verbinden</li>
      </ol>
      <p>Tipp: Das WLAN-Passwort steht oft auf dem Router!</p>',
     module_id, 8, NOW(), NOW()),

    (gen_random_uuid(), 'Computer mit WLAN verbinden',
     '<h2>Computer ins WLAN</h2>
      <p>So verbinden Sie Ihren Computer:</p>
      <ol>
        <li>WLAN-Symbol in der Taskleiste anklicken</li>
        <li>Verfügbare Netzwerke anzeigen</li>
        <li>Ihr Netzwerk auswählen</li>
        <li>Passwort eingeben</li>
        <li>Automatisch verbinden anhaken</li>
      </ol>',
     module_id, 9, NOW(), NOW()),

    (gen_random_uuid(), 'Zu viel des Guten?',
     '<h2>Gesunder Umgang mit digitalen Medien</h2>
      <p>Tipps für eine ausgewogene Nutzung:</p>
      <ul>
        <li>Regelmäßige Pausen einlegen</li>
        <li>Bildschirmzeit begrenzen</li>
        <li>Nicht beim Essen oder vor dem Schlafen</li>
        <li>Reale Kontakte pflegen</li>
      </ul>
      <p>Digital ist toll, aber das echte Leben auch!</p>',
     module_id, 10, NOW(), NOW());

    -- Add quizzes for some lessons
    -- Quiz 1: Elektronische Geräte
    SELECT id INTO lesson_id FROM lessons WHERE title = 'Elektronische Geräte' AND course_id = module_id LIMIT 1;
    INSERT INTO quizzes (id, title, lesson_id, created_at, updated_at) VALUES
    (gen_random_uuid(), 'Elektronische Geräte', lesson_id, NOW(), NOW())
    RETURNING id INTO quiz_id;

    -- Add questions for Quiz 1
    INSERT INTO questions (id, quiz_id, question, type, created_at, updated_at) VALUES
    (gen_random_uuid(), quiz_id, 'Was ist ein Smartphone?', 'single', NOW(), NOW())
    RETURNING id INTO question_id;

    INSERT INTO options (question_id, option_text, is_correct) VALUES
    (question_id, 'Ein kleiner Computer mit Telefonfunktion', true),
    (question_id, 'Nur ein Telefon', false),
    (question_id, 'Ein großer Bildschirm', false);

    -- Quiz 2: Hardware & Software
    SELECT id INTO lesson_id FROM lessons WHERE title = 'Hardware & Software' AND course_id = module_id LIMIT 1;
    INSERT INTO quizzes (id, title, lesson_id, created_at, updated_at) VALUES
    (gen_random_uuid(), 'Hardware & Software', lesson_id, NOW(), NOW())
    RETURNING id INTO quiz_id;

    INSERT INTO questions (id, quiz_id, question, type, created_at, updated_at) VALUES
    (gen_random_uuid(), quiz_id, 'Was ist Hardware?', 'single', NOW(), NOW())
    RETURNING id INTO question_id;

    INSERT INTO options (question_id, option_text, is_correct) VALUES
    (question_id, 'Alles was man anfassen kann', true),
    (question_id, 'Nur Programme', false),
    (question_id, 'Das Internet', false);

    RAISE NOTICE 'Added German Digital Module with all lessons and quizzes successfully';
END $$;