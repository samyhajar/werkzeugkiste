-- Create static_pages table to manage CMS-like static content
-- RLS: public can read, only admins can insert/update/delete

BEGIN;

CREATE TABLE IF NOT EXISTS public.static_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content_html text NULL,
  content_json jsonb NULL,
  meta jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_static_pages ON public.static_pages;
CREATE TRIGGER set_timestamp_static_pages
BEFORE UPDATE ON public.static_pages
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();

ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anon) to read static pages
DROP POLICY IF EXISTS "Allow public read of static_pages" ON public.static_pages;
CREATE POLICY "Allow public read of static_pages"
  ON public.static_pages FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admins may insert/update/delete
DROP POLICY IF EXISTS "Admins manage static_pages" ON public.static_pages;
CREATE POLICY "Admins manage static_pages"
  ON public.static_pages FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Seed initial content from existing pages
-- 1) Über uns: store as HTML
INSERT INTO public.static_pages (slug, title, content_html)
VALUES (
  'ueber-uns',
  'Über uns',
  $$
  <main>
    <div class="text-center mb-16">
      <h1 class="text-4xl font-bold text-[#de0449] mb-8">Digi +</h1>
      <div class="flex flex-col md:flex-row gap-8 items-start">
        <div class="md:w-2/3">
          <p><strong>arbeit plus – Soziale Unternehmen Niederösterreich</strong> entwickelte gemeinsam mit der <strong>FH St. Pölten</strong> (Ilse Arlt Institut für Soziale Inklusionsforschung) im Rahmen des Projektfonds Arbeit 4.0 der <strong>Arbeiterkammer Niederösterreich</strong> das Projekt <strong>Digi +</strong> für Soziale Unternehmen.</p>
          <p>Die Mitarbeiter:innen, also <strong>Schlüsselarbeitskräfte</strong> (Berater:innen, Arbeitsanleiter:innen) und deren <strong>Klient:innen</strong> (Transitmitarbeiter:innen, Teilnehmer:innen, zu Beratende), treten dabei in einen Lernprozess, der den (Wieder-)Einstieg in den Arbeitsmarkt erleichtert. Im Zuge dessen werden selbst erarbeitete, digitale Kenntnisse erlernt und vertieft und voneinander gelernt. Dadurch leistet Digi + einen wertvollen Beitrag zu <strong>(digitaler) Inklusion</strong> und <strong>gesellschaftlicher Teilhabe</strong>.</p>
        </div>
        <div class="md:w-1/3">
          <img src="/Modul-1-Digitalisierung-e1655816152674.png" alt="Digitale Werkzeugkiste" width="400" height="250" />
        </div>
      </div>
    </div>

    <div class="mb-16">
      <p>Zu Beginn des Projekts wurden vorhandene technischen Ressourcen analysiert. Die Ergebnisse kombinierten wir dann mit den Ergebnissen einer Nutzer:innenbefragung und vorhandenem Wissen aus der Literatur. Auf diesen Faktoren basierend wurden Konzepte zur <strong>Steigerung der digitalen Grundkompetenzen</strong> bei den Schlüsselarbeitskräften und Klient:innen entwickelt.</p>
      <div class="flex flex-col md:flex-row gap-8 items-center">
        <div class="md:w-1/2">
          <img src="/Modul-1-Digitalisierung-e1655816152674.png" alt="Digitalisierung Module" width="400" height="200" />
        </div>
        <div class="md:w-1/2">
          <p>Im Rahmen von Digi + erhielten Klient:innen der Sozialen Unternehmen in regionalen Workshops die Möglichkeit, ihre digitalen Kompetenzen zu steigern und eventuell vorhandene Abwehrhaltungen zu hinterfragen. Darüber hinaus wurden auch <strong>Weiterbildungsseminare (train-the-trainer)</strong> für Schlüsselarbeitskräfte angeboten.</p>
          <p>Im Sinne der Nachhaltigkeit wurde die <strong>digitale Werkzeugkiste</strong> erarbeitet. Die <strong>online Lernplattform</strong> ist <strong>kostenfrei zugänglich</strong>. Den Kern bilden die Lernmodule, die sowohl im individuellen Selbststudium als auch unter Anleitung von Schlüsselarbeitskräften erarbeitet werden können. Darüber hinaus bietet die Werkzeugkiste eine Sammlung nützlicher Links, Hintergrundinformationen, Hinweise zu Fördermöglichkeiten, zu Weiterbildungsanbietern u.v.m. rund um das Thema Digitalisierung.</p>
        </div>
      </div>
      <div class="mt-8 text-center">
        <p class="text-gray-600 italic">Florian Zahorka, Johannes Pflegerl, Maria Nirnsee, Alois Huber</p>
      </div>
    </div>

    <div class="bg-gray-50 rounded-lg p-8 mb-16">
      <h2 class="text-2xl font-bold text-[#de0449] mb-4">Ziel</h2>
      <p>Alle Arbeitsschritte und Angebote sollen der Steigerung der Wiedereinstiegschancen in den Arbeitsmarkt dienen.</p>
    </div>

    <div class="mb-16">
      <h2 class="text-2xl font-bold text-[#de0449] mb-6">Services</h2>
      <div class="space-y-4">
        <div class="flex items-center gap-2"><span>Folder &quot;Werkzeugkiste&quot; </span><strong>als PDF</strong><span class="text-gray-500 ml-2">(in Vorbereitung)</span></div>
        <div class="flex items-center gap-2"><span>Digi + Logo als </span><strong>JPG</strong><span class="text-gray-500 ml-2">(in Vorbereitung)</span></div>
        <p>Bei Fragen, Anregungen oder Beschwerden wenden Sie sich bitte an <strong>digiplus@arbeitplus.at</strong>.</p>
      </div>
    </div>
  </main>
  $$
)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html;

-- 2) Fragen (FAQ): store as simplified HTML (structure preserved for rendering)
INSERT INTO public.static_pages (slug, title, content_html)
VALUES (
  'fragen',
  'Fragen',
  $$
  <main>
    <div class="mb-12">
      <h1 class="text-4xl font-bold text-[#de0449] mb-6">Ungeklärte Fragen?</h1>
      <p>Schreib eine E-Mail an <a href="mailto:digiplus@arbeitplus.at" class="underline">digiplus@arbeitplus.at</a>!</p>
    </div>
    <section class="mb-12">
      <h2 class="text-3xl font-bold text-[#de0449] mb-8">Neu hier? Einführung!</h2>
      <div class="space-y-4">
        <details><summary>Muss ich mich registrieren?</summary><div><p>Nein, du kannst die gesamte Werkzeugkiste auch ohne Konto benutzen.</p><p>Möchtest du am Kursende Zertifikate erhalten? Soll dein Lernfortschritt gespeichert werden? Dann lege hier ein Konto an.</p></div></details>
        <details><summary>Wie starte ich den Kurs?</summary><div>Klicke/Tippe einfach auf eines der Module auf der Startseite.</div></details>
        <details><summary>Für wen ist der Kurs?</summary><div>Für alle, die Computer, Smartphones und das Internet privat oder beruflich nutzen wollen.</div></details>
        <details><summary>Ist der Kurs kostenlos?</summary><div>Ja. Alle Inhalte sind kostenlos! Das Projekt wurde von der Arbeiterkammer im Rahmen von Arbeit 4.0 finanziert.</div></details>
        <details><summary>Ich habe noch nie Computer/Smartphones benutzt. Kann ich den Kurs trotzdem machen?</summary><div>Ja, jeder und jede können den Kurs machen. Du benötigst für den Kurs kein Vorwissen.</div></details>
      </div>
    </section>
  </main>
  $$
)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html;

-- 3) Digi-Sammlung: categories/items as JSON
INSERT INTO public.static_pages (slug, title, content_json)
VALUES (
  'digi-sammlung',
  'Digi-Sammlung',
  '{
    "categories": [
      {
        "title": "Erwerbsarbeit",
        "icon": "Briefcase",
        "color": "text-pink-600",
        "items": [
          "Jobsuche / Berufsorientierung",
          "Bewerbungsvideos erstellen",
          "Rechner für Gehalt & Lohn",
          "Weiterbildung: Anbieter",
          "Weiterbildungen: Förderungen",
          "Einstufung Digi-Kompetenz"
        ]
      },
      {
        "title": "Kommunikation, Medien & Technisches",
        "icon": "MessageSquare",
        "color": "text-pink-600",
        "items": [
          "Einfache Sprache Infos",
          "Einfache Sprache Nachrichten",
          "Videotelefonie / Videokonferenzen",
          "Alternative Messenger",
          "Alternative Suchmaschinen",
          "Medien - Bücher, Musik",
          "Technische Tipps & Tricks",
          "Werkzeuge für Online Umfragen",
          "Sicherheit im Internet",
          "Beratungs-App"
        ]
      },
      {
        "title": "Alltägliches & Verschiedenes",
        "icon": "LifeBuoy",
        "color": "text-pink-600",
        "items": [
          "ID-Austria und eGov",
          "Fitness für das Gehirn",
          "Entspannung & Achtsamkeit",
          "Digitale Helfer im Alltag",
          "Mobilität & Unterwegs",
          "Lernen mit dem Handy",
          "Freizeit & Spaß im Digitalen",
          "Gesund werden & bleiben",
          "Studien zum Digitalen",
          "Diverse Unterlagen"
        ]
      }
    ]
  }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content_json = EXCLUDED.content_json;

COMMIT;
