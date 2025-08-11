-- Seed digi_resources based on hardcoded defaults from the app page

BEGIN;

-- Helper: insert resource if not exists for category slug and title
CREATE OR REPLACE FUNCTION public.insert_resource_if_absent(p_category_slug text, p_title text, p_sort int)
RETURNS void AS $$
DECLARE
  cat_id uuid;
  exists_count int;
  anchor text;
BEGIN
  SELECT id INTO cat_id FROM public.digi_categories WHERE slug = p_category_slug LIMIT 1;
  IF cat_id IS NULL THEN
    RETURN;
  END IF;
  SELECT COUNT(*) INTO exists_count FROM public.digi_resources WHERE category_id = cat_id AND title = p_title;
  IF exists_count = 0 THEN
    anchor := '#' || regexp_replace(lower(p_title), '[^a-z0-9]+', '-', 'g');
    anchor := regexp_replace(anchor, '^(-)+|(-)+$', '', 'g');
    INSERT INTO public.digi_resources (category_id, title, url, sort_order)
    VALUES (cat_id, p_title, anchor, p_sort);
  END IF;
END; $$ LANGUAGE plpgsql;

-- Erwerbsarbeit
SELECT public.insert_resource_if_absent('erwerbsarbeit', 'Jobsuche / Berufsorientierung', 1);
SELECT public.insert_resource_if_absent('erwerbsarbeit', 'Bewerbungsvideos erstellen', 2);
SELECT public.insert_resource_if_absent('erwerbsarbeit', 'Rechner für Gehalt & Lohn', 3);
SELECT public.insert_resource_if_absent('erwerbsarbeit', 'Weiterbildung: Anbieter', 4);
SELECT public.insert_resource_if_absent('erwerbsarbeit', 'Weiterbildungen: Förderungen', 5);
SELECT public.insert_resource_if_absent('erwerbsarbeit', 'Einstufung Digi-Kompetenz', 6);

-- Kommunikation, Medien & Technisches
SELECT public.insert_resource_if_absent('kommunikation-medien-technisches', 'Einfache Sprache Infos', 1);
SELECT public.insert_resource_if_absent('kommunikation-medien-technisches', 'Einfache Sprache Nachrichten', 2);
SELECT public.insert_resource_if_absent('kommunikation-medien-technisches', 'Videotelefonie / Videokonferenzen', 3);
SELECT public.insert_resource_if_absent('kommunikation-medien-technisches', 'Alternative Messenger', 4);
SELECT public.insert_resource_if_absent('kommunikation-medien-technisches', 'Alternative Suchmaschinen', 5);
SELECT public.insert_resource_if_absent('kommunikation-medien-technisches', 'Medien - Bücher, Musik', 6);
SELECT public.insert_resource_if_absent('kommunikation-medien-technisches', 'Technische Tipps & Tricks', 7);
SELECT public.insert_resource_if_absent('kommunikation-medien-technisches', 'Werkzeuge für Online Umfragen', 8);
SELECT public.insert_resource_if_absent('kommunikation-medien-technisches', 'Sicherheit im Internet', 9);
SELECT public.insert_resource_if_absent('kommunikation-medien-technisches', 'Beratungs-App', 10);

-- Alltägliches & Verschiedenes
SELECT public.insert_resource_if_absent('alltaegliches-verschiedenes', 'ID-Austria und eGov', 1);
SELECT public.insert_resource_if_absent('alltaegliches-verschiedenes', 'Fitness für das Gehirn', 2);
SELECT public.insert_resource_if_absent('alltaegliches-verschiedenes', 'Entspannung & Achtsamkeit', 3);
SELECT public.insert_resource_if_absent('alltaegliches-verschiedenes', 'Digitale Helfer im Alltag', 4);
SELECT public.insert_resource_if_absent('alltaegliches-verschiedenes', 'Mobilität & Unterwegs', 5);
SELECT public.insert_resource_if_absent('alltaegliches-verschiedenes', 'Lernen mit dem Handy', 6);
SELECT public.insert_resource_if_absent('alltaegliches-verschiedenes', 'Freizeit & Spaß im Digitalen', 7);
SELECT public.insert_resource_if_absent('alltaegliches-verschiedenes', 'Gesund werden & bleiben', 8);
SELECT public.insert_resource_if_absent('alltaegliches-verschiedenes', 'Studien zum Digitalen', 9);
SELECT public.insert_resource_if_absent('alltaegliches-verschiedenes', 'Diverse Unterlagen', 10);

DROP FUNCTION IF EXISTS public.insert_resource_if_absent(text, text, int);

COMMIT;
