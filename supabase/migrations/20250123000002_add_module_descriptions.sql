-- Add descriptions to existing modules
UPDATE modules
SET description = 'Lernen Sie die Grundlagen der digitalen Welt kennen. Von der Bedienung von Computern und Smartphones bis hin zu den ersten Schritten im Internet - hier finden Sie alles, was Sie für den Einstieg in die digitale Welt benötigen.'
WHERE title = 'Modul 1: Einstieg in die digitale Welt';

UPDATE modules
SET description = 'Entdecken Sie die Möglichkeiten des Internets und lernen Sie, wie Sie sicher und effektiv mit E-Mails kommunizieren. Von der Suche im Internet bis hin zur sicheren Online-Kommunikation.'
WHERE title = 'Modul 2: Internet & E-Mails';

UPDATE modules
SET description = 'Sicherheit im digitalen Zeitalter ist entscheidend. Lernen Sie, wie Sie sich und Ihre Daten im Internet schützen, sicher einkaufen und Ihre Kinder im digitalen Raum begleiten.'
WHERE title = 'Modul 3: Digitale Sicherheit';

UPDATE modules
SET description = 'Die digitale Arbeitswelt bietet neue Möglichkeiten. Lernen Sie, wie Sie online nach Jobs suchen, sich digital bewerben und Ihre beruflichen Chancen im digitalen Zeitalter nutzen.'
WHERE title = 'Modul 4: Jobs digital finden';