
-- 1. Insert new specialties (slug is unique)
INSERT INTO public.specialties (slug, name) VALUES
  ('otologia-audiologia', 'Otología y Audiología'),
  ('rinologia-base-craneo', 'Rinología y Base de Cráneo'),
  ('faringolaringologia-funcionalidad', 'Faringolaringología y Funcionalidad'),
  ('cabeza-cuello-facial', 'Cabeza, Cuello y Facial')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- 2. Detach questionnaires temporarily
UPDATE public.questionnaires SET specialty_id = NULL, subspecialty_id = NULL;

-- 3. Wipe old subspecialties and old specialties
DELETE FROM public.subspecialties;
DELETE FROM public.specialties WHERE slug NOT IN (
  'otologia-audiologia','rinologia-base-craneo','faringolaringologia-funcionalidad','cabeza-cuello-facial'
);

-- 4. Insert new subspecialties
INSERT INTO public.subspecialties (slug, name, specialty_id)
SELECT v.slug, v.name, sp.id FROM (VALUES
  ('otologia-general', 'Otología General', 'otologia-audiologia'),
  ('otoneurologia', 'Otoneurología', 'otologia-audiologia'),
  ('audiologia', 'Audiología', 'otologia-audiologia'),
  ('rinologia-senos-paranasales', 'Rinología y Senos Paranasales', 'rinologia-base-craneo'),
  ('olfato-gusto', 'Olfato y Gusto', 'rinologia-base-craneo'),
  ('laringologia-voz', 'Laringología y Voz', 'faringolaringologia-funcionalidad'),
  ('deglucion-disfagia', 'Deglución y Disfagia', 'faringolaringologia-funcionalidad'),
  ('lenguaje-habla', 'Trastornos del Lenguaje y Habla', 'faringolaringologia-funcionalidad'),
  ('medicina-sueno', 'Medicina del Sueño', 'faringolaringologia-funcionalidad'),
  ('oncologia-cabeza-cuello', 'Oncología de Cabeza y Cuello', 'cabeza-cuello-facial'),
  ('cervical-glandulas-salivales', 'Patología Cervical y Glándulas Salivales', 'cabeza-cuello-facial'),
  ('cavidad-oral', 'Cavidad Oral', 'cabeza-cuello-facial'),
  ('cirugia-plastica-facial', 'Cirugía Plástica y Reconstructiva Facial', 'cabeza-cuello-facial')
) AS v(slug, name, sp_slug)
JOIN public.specialties sp ON sp.slug = v.sp_slug;

-- 5. Reassign questionnaires to new taxonomy
UPDATE public.questionnaires q SET
  specialty_id = (SELECT id FROM public.specialties WHERE slug = m.sp),
  subspecialty_id = (SELECT ss.id FROM public.subspecialties ss JOIN public.specialties s ON s.id=ss.specialty_id WHERE ss.slug = m.ss AND s.slug = m.sp)
FROM (VALUES
  ('etdq-7', 'otologia-audiologia', 'otologia-general'),
  ('dhi-25', 'otologia-audiologia', 'otoneurologia'),
  ('thi-25', 'otologia-audiologia', 'audiologia'),
  ('snot-22', 'rinologia-base-craneo', 'rinologia-senos-paranasales'),
  ('vhi-30', 'faringolaringologia-funcionalidad', 'laringologia-voz'),
  ('eat-10', 'faringolaringologia-funcionalidad', 'deglucion-disfagia')
) AS m(slug, sp, ss)
WHERE q.slug = m.slug;
