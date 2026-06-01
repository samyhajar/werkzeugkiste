# Accessibility-Quickcheck 2026-06

Stand: 2026-06-01

## Ziel und Umfang

Dieser Quickcheck verbessert die Barrierearmut der oeffentlichen Seiten, Auth-Flows
und Lernbereiche der Werkzeugkiste. Er ist keine vollstaendige WCAG- oder
BITV-Zertifizierung. Das interne Admin-Backend ist ausdruecklich nicht Teil des
Umfangs.

## Umgesetzte Verbesserungen

- Nutzerseiten besitzen genau ein `main`-Landmark und einen sichtbaren Skip-Link
  "Zum Inhalt springen".
- Startseite, Digi-Sammlung, Auth-Seiten, Module und Quiz verwenden logischere
  Ueberschriften-Hierarchien.
- Globale `:focus-visible`-Stile und reduzierte Animationen fuer
  `prefers-reduced-motion` wurden ergaenzt.
- Desktop- und Mobile-Navigation besitzen deutsche Beschriftungen,
  `aria-expanded`, `aria-controls`, Escape-Schliessen und Fokus-Rueckgabe.
- Moduldetails werden ueber einen echten Button geoeffnet. Das Modul-Overlay nutzt
  den vorhandenen Radix-Dialog mit Fokusfalle, Escape-Schliessen und
  beschriftetem Schliessen-Button.
- Overlay-Tabs und Kurs-Akkordeons besitzen passende Rollen, Zustandsattribute
  und Tastatursteuerung.
- Icon-only Buttons, dekorative Icons und Fortschrittsanzeigen wurden fuer
  Screenreader nachgezogen.
- Login, Registrierung, Passwort-Flows und Quiz geben Pflichtfelder,
  Feldfehler und Statusmeldungen verstaendlicher aus.
- Schwache Hilfs- und Platzhalterfarben wurden an relevanten Nutzerstellen
  angehoben.
- Die vorhandene Cloudinary-ALT-Unterstuetzung bleibt erhalten. Es wurden keine
  Datenbank-, Schema- oder API-Aenderungen eingefuehrt.

## Automatische Pruefungen

| Pruefung | Ergebnis |
| --- | --- |
| `node node_modules/typescript/bin/tsc --noEmit` | Erfolgreich |
| `npm.cmd run lint` | Erfolgreich; Next.js meldet weiterhin den bestehenden Konfigurationshinweis, dass das Next.js-ESLint-Plugin nicht erkannt wurde |
| `node node_modules/next/dist/bin/next build` | Anwendung kompiliert erfolgreich; die anschliessende Seitendatenerhebung ist lokal durch die fehlende Umgebungsvariable `SUPABASE_SERVICE_ROLE_KEY` blockiert |

Das zuvor fehlende optionale Windows-Modul
`lightningcss.win32-x64-msvc.node` wurde lokal ueber die optionalen
Abhaengigkeiten repariert. Das betrifft nur die lokale Installation unter
`node_modules`.

## Lighthouse Accessibility

Gemessen mit Lighthouse `13.3.0` und Headless Chrome gegen den lokalen
Entwicklungsserver unter `http://127.0.0.1:3000`.

| Route | Score |
| --- | ---: |
| `/` | 93 |
| `/digi-sammlung` | 93 |
| `/modules/f1f3a0b7-fd90-4d1b-baad-2b4074601795` | 93 |
| `/quizzes/d562b7cb-67b7-43d7-abee-946be8dc1445` | 93 |
| `/dashboard` | 93 |
| `/certificates` | 93 |
| `/auth/login` | 94 |
| `/auth/forgot-password` | 93 |
| `/signup` | 93 |
| `/sogehts` | 93 |

## Verbleibende Lighthouse-Befunde

Alle gemessenen Seiten enthalten noch zwei Befunde aus dem extern geladenen
DataReporter-Cookie-Banner:

- Der Link "Einstellungen uebernehmen" besitzt im Banner nicht ausreichend
  Farbkontrast.
- Der Banner erzeugt positive `tabindex`-Werte, unter anderem fuer
  Datenschutzerklaerung, Impressum, Kategorieauswahl und Cookie-Aktionen.

Diese Elemente werden durch das externe CMP-Skript injiziert und liegen nicht in
den React-Komponenten der Werkzeugkiste. Die Nachbesserung sollte in der
DataReporter-Konfiguration oder durch den Anbieter erfolgen.

## Manuelle Freigabepruefung

Vor dem Release ist ein Tastatur- und Screenreader-naher Durchlauf in der
Zielumgebung erforderlich:

- Skip-Link, Navbar und mobiles Menue ohne Maus bedienen; Escape und
  Fokus-Rueckgabe pruefen.
- Login, Registrierung und Passwort-Flows mit Pflichtfeld- und Fehlerfaellen
  pruefen.
- Modulkarte, Dialog, Tabs, Kurs-Akkordeons, Lektionen und Quiz vollstaendig mit
  Tastatur bedienen.
- Dashboard und Zertifikate im angemeldeten Zustand pruefen.
- Landmark-Reihenfolge, Ueberschriften, Statusmeldungen, Icon-Buttons,
  Fortschrittswerte und gepflegte Cloudinary-ALT-Texte stichprobenartig mit
  Screenreader pruefen.

## Grenzen

Der Quickcheck ersetzt kein vollstaendiges Audit mit mehreren Browsern,
Hilfstechnologien und realen Nutzer:innen. Inhaltlich gepflegte ALT-Texte und
eingebettete Lerninhalte bleiben redaktionell zu pruefen.
