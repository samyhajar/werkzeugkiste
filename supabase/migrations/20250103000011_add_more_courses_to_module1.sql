-- Add more courses to Module 1: Einstieg in die digitale Welt
DO $$
DECLARE
    module_id UUID;
    course_id UUID;
    lesson_id UUID;
    quiz_id UUID;
    question_id UUID;
BEGIN
    -- Get the German module ID
    SELECT id INTO module_id FROM courses WHERE title = 'Modul 1: Einstieg in die digitale Welt' LIMIT 1;

    IF module_id IS NOT NULL THEN
        -- Course 2: Internet & E-Mail
        INSERT INTO courses (id, title, description, hero_image, status, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Kurs 2: Internet & E-Mail', 'Lernen Sie die Grundlagen des Internets und der E-Mail-Kommunikation kennen.', 'Modul-1-Digitalisierung-e1655816152674.png', 'published', NOW(), NOW())
        RETURNING id INTO course_id;

        -- Add lessons for Course 2
        INSERT INTO lessons (id, course_id, sort_order, title, content, created_at, updated_at) VALUES
        (gen_random_uuid(), course_id, 1, 'Was ist das Internet?',
         '<h2>Das Internet verstehen</h2>
          <p>Das Internet ist ein weltweites Netzwerk von Computern, die miteinander verbunden sind. Es ermöglicht uns:</p>
          <ul>
            <li>Informationen zu suchen und zu finden</li>
            <li>Mit anderen Menschen zu kommunizieren</li>
            <li>Online einzukaufen</li>
            <li>Unterhaltung zu genießen</li>
          </ul>
          <p>Stellen Sie sich das Internet wie ein riesiges Straßennetz vor, über das Informationen reisen.</p>',
         NOW(), NOW()),

        (gen_random_uuid(), course_id, 2, 'Webbrowser verwenden',
         '<h2>Mit dem Browser durchs Internet</h2>
          <p>Ein Webbrowser ist Ihr Fenster zum Internet. Die bekanntesten Browser sind:</p>
          <ul>
            <li>Google Chrome</li>
            <li>Mozilla Firefox</li>
            <li>Microsoft Edge</li>
            <li>Safari (auf Apple-Geräten)</li>
          </ul>
          <p><strong>Grundfunktionen:</strong></p>
          <ul>
            <li>Adressleiste: Hier geben Sie Internetadressen ein</li>
            <li>Zurück/Vor-Buttons: Zum Navigieren zwischen Seiten</li>
            <li>Lesezeichen: Zum Speichern wichtiger Seiten</li>
          </ul>',
         NOW(), NOW()),

        (gen_random_uuid(), course_id, 3, 'E-Mail-Grundlagen',
         '<h2>Elektronische Post verstehen</h2>
          <p>E-Mail (Electronic Mail) ist wie ein digitaler Brief. Sie können:</p>
          <ul>
            <li>Nachrichten an eine oder mehrere Personen senden</li>
            <li>Dateien als Anhang mitschicken</li>
            <li>Nachrichten in Ordnern organisieren</li>
          </ul>
          <p><strong>E-Mail-Adresse aufbau:</strong></p>
          <p>name@anbieter.de</p>
          <ul>
            <li>name = Ihr gewählter Benutzername</li>
            <li>@ = "bei" (sprich: "ät")</li>
            <li>anbieter.de = E-Mail-Provider</li>
          </ul>',
         NOW(), NOW()),

        (gen_random_uuid(), course_id, 4, 'E-Mail sicher verwenden',
         '<h2>Sicherheit bei E-Mails</h2>
          <p>Wichtige Sicherheitsregeln:</p>
          <ul>
            <li><strong>Vorsicht bei unbekannten Absendern:</strong> Öffnen Sie keine Anhänge von fremden Personen</li>
            <li><strong>Phishing erkennen:</strong> Banken fragen niemals per E-Mail nach Passwörtern</li>
            <li><strong>Starke Passwörter:</strong> Verwenden Sie sichere Passwörter für Ihr E-Mail-Konto</li>
            <li><strong>Regelmäßige Updates:</strong> Halten Sie Ihr E-Mail-Programm aktuell</li>
          </ul>
          <p>Bei verdächtigen E-Mails: Im Zweifelsfall löschen!</p>',
         NOW(), NOW());

        -- Course 3: Sicherheit im Internet
        INSERT INTO courses (id, title, description, hero_image, status, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Kurs 3: Sicherheit im Internet', 'Lernen Sie, wie Sie sich sicher im Internet bewegen und Ihre Daten schützen.', 'Modul-1-Digitalisierung-e1655816152674.png', 'published', NOW(), NOW())
        RETURNING id INTO course_id;

        -- Add lessons for Course 3
        INSERT INTO lessons (id, course_id, sort_order, title, content, created_at, updated_at) VALUES
        (gen_random_uuid(), course_id, 1, 'Passwörter richtig wählen',
         '<h2>Sichere Passwörter erstellen</h2>
          <p>Ein gutes Passwort ist wie ein starkes Schloss für Ihre digitalen Daten.</p>
          <p><strong>Regeln für sichere Passwörter:</strong></p>
          <ul>
            <li>Mindestens 8 Zeichen lang</li>
            <li>Groß- und Kleinbuchstaben verwenden</li>
            <li>Zahlen einbauen</li>
            <li>Sonderzeichen verwenden (!, ?, #, etc.)</li>
            <li>Keine persönlichen Daten (Geburtsdatum, Name)</li>
          </ul>
          <p><strong>Beispiel eines sicheren Passworts:</strong> Mein1.Hund!ist7Jahre</p>',
         NOW(), NOW()),

        (gen_random_uuid(), course_id, 2, 'Online-Betrug erkennen',
         '<h2>Betrugsversuche im Internet</h2>
          <p>Seien Sie vorsichtig bei:</p>
          <ul>
            <li><strong>Phishing-E-Mails:</strong> Gefälschte E-Mails, die nach Passwörtern fragen</li>
            <li><strong>Fake-Shops:</strong> Betrügerische Online-Shops mit unrealistisch günstigen Preisen</li>
            <li><strong>Gewinnspiel-Betrug:</strong> Sie haben angeblich gewonnen, müssen aber erst Geld zahlen</li>
            <li><strong>Liebesbetrug:</strong> Unbekannte Personen, die schnell um Geld bitten</li>
          </ul>
          <p><strong>Grundregel:</strong> Wenn etwas zu gut klingt, um wahr zu sein, ist es das wahrscheinlich auch!</p>',
         NOW(), NOW()),

        (gen_random_uuid(), course_id, 3, 'Datenschutz verstehen',
         '<h2>Ihre Daten schützen</h2>
          <p>Ihre persönlichen Daten sind wertvoll. Schützen Sie sie durch:</p>
          <ul>
            <li><strong>Sparsam mit Daten umgehen:</strong> Geben Sie nur nötige Informationen preis</li>
            <li><strong>Datenschutzerklärungen lesen:</strong> Verstehen Sie, was mit Ihren Daten passiert</li>
            <li><strong>Sichere Verbindungen:</strong> Achten Sie auf "https://" in der Adressleiste</li>
            <li><strong>Cookies verwalten:</strong> Löschen Sie regelmäßig Cookies und Verlauf</li>
          </ul>
          <p>Denken Sie daran: Einmal im Internet veröffentlichte Daten können schwer wieder gelöscht werden.</p>',
         NOW(), NOW());

        -- Course 4: Online-Dienste nutzen
        INSERT INTO courses (id, title, description, hero_image, status, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Kurs 4: Online-Dienste nutzen', 'Entdecken Sie nützliche Online-Dienste für den Alltag und lernen Sie deren sichere Nutzung.', 'Modul-1-Digitalisierung-e1655816152674.png', 'published', NOW(), NOW())
        RETURNING id INTO course_id;

        -- Add lessons for Course 4
        INSERT INTO lessons (id, course_id, sort_order, title, content, created_at, updated_at) VALUES
        (gen_random_uuid(), course_id, 1, 'Online-Banking verstehen',
         '<h2>Sicher Bankgeschäfte online erledigen</h2>
          <p>Online-Banking ermöglicht es Ihnen, Bankgeschäfte von zu Hause aus zu erledigen:</p>
          <ul>
            <li>Kontostand prüfen</li>
            <li>Überweisungen tätigen</li>
            <li>Daueraufträge einrichten</li>
            <li>Kontoauszüge einsehen</li>
          </ul>
          <p><strong>Sicherheitstipps:</strong></p>
          <ul>
            <li>Nur über die offizielle Bank-Website einloggen</li>
            <li>Niemals Zugangsdaten per E-Mail preisgeben</li>
            <li>Nach dem Banking immer ausloggen</li>
            <li>Sichere Internetverbindung verwenden</li>
          </ul>',
         NOW(), NOW()),

        (gen_random_uuid(), course_id, 2, 'Online einkaufen',
         '<h2>Sicher im Internet shoppen</h2>
          <p>Online-Shopping bietet viele Vorteile: Bequemlichkeit, große Auswahl, oft günstigere Preise.</p>
          <p><strong>Worauf Sie achten sollten:</strong></p>
          <ul>
            <li><strong>Seriöse Shops:</strong> Impressum, Kontaktdaten, Bewertungen prüfen</li>
            <li><strong>Sichere Bezahlung:</strong> PayPal, Kauf auf Rechnung bevorzugen</li>
            <li><strong>Verschlüsselung:</strong> "https://" und Schloss-Symbol in der Adressleiste</li>
            <li><strong>AGB lesen:</strong> Besonders Rückgabe- und Widerrufsbedingungen</li>
          </ul>
          <p>Tipp: Bewahren Sie alle Kaufbelege und E-Mails auf!</p>',
         NOW(), NOW()),

        (gen_random_uuid(), course_id, 3, 'Soziale Medien nutzen',
         '<h2>Facebook, WhatsApp & Co. verstehen</h2>
          <p>Soziale Medien helfen dabei, mit Familie und Freunden in Kontakt zu bleiben.</p>
          <p><strong>Beliebte Plattformen:</strong></p>
          <ul>
            <li><strong>WhatsApp:</strong> Nachrichten und Telefonate</li>
            <li><strong>Facebook:</strong> Neuigkeiten teilen und Gruppen beitreten</li>
            <li><strong>Instagram:</strong> Fotos und Videos teilen</li>
            <li><strong>YouTube:</strong> Videos ansehen und lernen</li>
          </ul>
          <p><strong>Privatsphäre-Einstellungen:</strong></p>
          <ul>
            <li>Wer kann Ihre Beiträge sehen?</li>
            <li>Wer kann Sie finden und kontaktieren?</li>
            <li>Welche Daten werden geteilt?</li>
          </ul>',
         NOW(), NOW());

        -- Add some quizzes for the new courses
        -- Quiz for Course 2 (Internet & E-Mail)
        SELECT id INTO course_id FROM courses WHERE title = 'Kurs 2: Internet & E-Mail' ORDER BY created_at DESC LIMIT 1;
        INSERT INTO quizzes (id, title, course_id, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Quiz: Internet & E-Mail Grundlagen', course_id, NOW(), NOW())
        RETURNING id INTO quiz_id;

        INSERT INTO questions (id, quiz_id, question, type, created_at, updated_at) VALUES
        (gen_random_uuid(), quiz_id, 'Was bedeutet das @ in einer E-Mail-Adresse?', 'single', NOW(), NOW())
        RETURNING id INTO question_id;

        INSERT INTO options (question_id, option_text, is_correct) VALUES
        (question_id, 'Es bedeutet "bei"', true),
        (question_id, 'Es ist nur Dekoration', false),
        (question_id, 'Es bedeutet "und"', false);

        -- Quiz for Course 3 (Sicherheit)
        SELECT id INTO course_id FROM courses WHERE title = 'Kurs 3: Sicherheit im Internet' ORDER BY created_at DESC LIMIT 1;
        INSERT INTO quizzes (id, title, course_id, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Quiz: Internet-Sicherheit', course_id, NOW(), NOW())
        RETURNING id INTO quiz_id;

        INSERT INTO questions (id, quiz_id, question, type, created_at, updated_at) VALUES
        (gen_random_uuid(), quiz_id, 'Was macht ein sicheres Passwort aus?', 'single', NOW(), NOW())
        RETURNING id INTO question_id;

        INSERT INTO options (question_id, option_text, is_correct) VALUES
        (question_id, 'Mindestens 8 Zeichen mit Groß-, Kleinbuchstaben, Zahlen und Sonderzeichen', true),
        (question_id, 'Nur der eigene Name', false),
        (question_id, 'Das Geburtsdatum', false);

        RAISE NOTICE 'Added 3 more courses to Module 1 with lessons and quizzes';
    ELSE
        RAISE NOTICE 'German Digital Module not found';
    END IF;
END $$;