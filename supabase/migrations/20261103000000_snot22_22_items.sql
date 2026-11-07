-- SNOT-22: the generic Spanish text stored in the catalogue had 23 items (item 23 repeated
-- "productividad") and its item set did not match the instrument (it had "aclarar los senos
-- paranasales" instead of "secreción nasal espesa" / "despertarse cansado").
-- Replace it with the 22 items of the SNOT-22 (SNOT-20 + nasal obstruction + taste/smell), in
-- the same order as the validated Spanish version (de los Santos et al. 2015), so every variant
-- shares item order. Answer options (0–5) are kept as they were. Idempotent.
UPDATE public.questionnaires q
SET structure = jsonb_set(
  q.structure,
  '{items}',
  (
    SELECT jsonb_agg(jsonb_build_object('text', t.text, 'options', q.structure #> '{items,0,options}') ORDER BY t.n)
    FROM unnest(ARRAY[
      '1. Necesidad de sonarse la nariz',
      '2. Estornudos',
      '3. Goteo nasal',
      '4. Tos',
      '5. Moco que cae hacia la garganta (goteo posterior)',
      '6. Secreción nasal espesa',
      '7. Sensación de oído tapado',
      '8. Mareo',
      '9. Dolor de oído',
      '10. Dolor o presión en la cara',
      '11. Dificultad para conciliar el sueño',
      '12. Despertarse durante la noche',
      '13. No descansar bien por la noche',
      '14. Despertarse cansado',
      '15. Fatiga',
      '16. Disminución de la productividad',
      '17. Disminución de la concentración',
      '18. Sentirse frustrado, inquieto o irritable',
      '19. Sentirse triste',
      '20. Sentirse avergonzado',
      '21. Alteración del gusto o del olfato',
      '22. Congestión u obstrucción nasal'
    ]) WITH ORDINALITY AS t(text, n)
  )
)
WHERE q.slug = 'snot-22';
