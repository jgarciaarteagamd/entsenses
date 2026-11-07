// Registry of Spanish translation variants per questionnaire.
//
// Every questionnaire has at least the "generico" variant — the plain
// Spanish translation that is NOT officially validated. Slugs with a
// documented validated translation also expose those variants (Argentine,
// Spain, paediatric...). When we don't yet have the verbatim text of a
// validated instrument we still register the variant with `pending: true`
// so the UI can render the button (disabled) and it's obvious to the
// clinician which validations exist for that questionnaire.
//
// English interface never shows variants: the original instrument is used.

import type { LocalisedItem, LocalisedOption } from "./questionnaire-i18n";

export interface QuestionnaireVariant {
  /** Stable id used in URL (?v=) and analytics. */
  id: string;
  /** Label shown on the ES variant button. */
  labelEs: string;
  /** True when this variant comes from an officially validated translation. */
  validated: boolean;
  /** True while we don't yet have the verbatim item text of the validation. */
  pending?: boolean;
  /** External URL to the validation study (used when pending — opens in new tab). */
  studyUrl?: string;
  /** Index into QUESTIONNAIRE_STUDIES[slug].spanishValidations for the citation. */
  validationIndex?: number;
  /** Localised item text; when absent, falls back to the DB structure. */
  items?: LocalisedItem[];
}

export const GENERIC_VARIANT_ID = "generico";

// ---------------------------------------------------------------------------
// Option sets (match the values used in the DB structures so scoring is
// consistent regardless of which variant the clinician picks).
// ---------------------------------------------------------------------------

const SI_AVECES_NO: LocalisedOption[] = [
  { label: "Sí", value: 4 },
  { label: "A veces", value: 2 },
  { label: "No", value: 0 },
];

const EAT10_OPTS: LocalisedOption[] = [
  { label: "Ningún problema", value: 0 },
  { label: "Problema leve", value: 1 },
  { label: "Problema moderado", value: 2 },
  { label: "Problema grave", value: 3 },
];

const SNOT22_OPTS: LocalisedOption[] = [
  { label: "Ningún problema", value: 0 },
  { label: "Problema muy leve", value: 1 },
  { label: "Problema leve", value: 2 },
  { label: "Problema moderado", value: 3 },
  { label: "Problema grave", value: 4 },
  { label: "Problema tan grave como puede ser", value: 5 },
];

const ETDQ7_OPTS: LocalisedOption[] = [
  { label: "1 (Nunca)", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
  { label: "6", value: 6 },
  { label: "7 (Siempre)", value: 7 },
];

const VHI30_OPTS: LocalisedOption[] = [
  { label: "Nunca", value: 0 },
  { label: "Casi nunca", value: 1 },
  { label: "A veces", value: 2 },
  { label: "Casi siempre", value: 3 },
  { label: "Siempre", value: 4 },
];

const mkItems = (texts: string[], opts: LocalisedOption[]): LocalisedItem[] =>
  texts.map((text) => ({ text, options: opts }));

// ---------------------------------------------------------------------------
// Verbatim items of the validated Spanish adaptations.
// ---------------------------------------------------------------------------

const THI25_ES = mkItems(
  [
    "1. ¿Le resulta difícil concentrarse por culpa de su acúfeno?",
    "2. Debido a la intensidad del acúfeno ¿le cuesta oír a los demás?",
    "3. ¿Se enoja a causa de su acúfeno?",
    "4. ¿Le produce confusión su acúfeno?",
    "5. ¿Se encuentra desesperado por tener el acúfeno?",
    "6. ¿Se queja mucho por tener su acúfeno?",
    "7. ¿Tiene problemas para conciliar el sueño por su acúfeno?",
    "8. ¿Cree que su problema de acúfenos es insolucionable?",
    "9. ¿Interfiere su acúfeno en su vida social (salir a cenar, al cine)?",
    "10. ¿Se siente frustrado por su acúfeno?",
    "11. ¿Cree que tiene una enfermedad incurable?",
    "12. ¿Su acúfeno le impide disfrutar de la vida?",
    "13. ¿Interfiere su acúfeno en su trabajo o tareas del hogar?",
    "14. ¿Se siente a menudo irritable por culpa de su acúfeno?",
    "15. ¿Tiene dificultades para leer por culpa de su acúfeno?",
    "16. ¿Se encuentra usted triste debido a su acúfeno?",
    "17. ¿Cree que su acúfeno le crea tensiones o interfiere en su relación con la familia o amigos?",
    "18. ¿Es difícil, para usted, fijar su atención en cosas distintas a su acúfeno?",
    "19. ¿Cree que su acúfeno es incontrolable?",
    "20. ¿Se siente a menudo cansado por culpa de su acúfeno?",
    "21. ¿Se siente deprimido por culpa de su acúfeno?",
    "22. ¿Se siente ansioso por culpa de su acúfeno?",
    "23. ¿Cree que su problema de acúfenos le desborda?",
    "24. ¿Empeora su acúfeno cuando tiene estrés?",
    "25. ¿Se siente usted inseguro por culpa de su acúfeno?",
  ],
  SI_AVECES_NO,
);

const DHI25_AR = mkItems(
  [
    "1. ¿Levantar la cabeza aumenta su problema?",
    "2. ¿Caminar por el pasillo de un supermercado aumenta su problema?",
    "3. ¿Aumenta su problema realizar actividades más exigentes, tales como hacer deporte, bailar o realizar tareas domésticas (por ejemplo barrer o levantar los platos)?",
    "4. ¿Los movimientos rápidos de cabeza aumentan su problema?",
    "5. ¿Aumenta su problema al girar en la cama?",
    "6. ¿Caminar por la vereda aumenta su problema?",
    "7. ¿Aumenta su problema al agacharse?",
    "8. ¿Se siente frustrado a causa de su problema?",
    "9. A causa de su problema ¿tiene miedo a salir de su casa sin que alguien lo acompañe?",
    "10. A causa de su problema ¿ha sentido vergüenza delante de otros?",
    "11. A causa de su problema ¿tiene miedo a que la gente piense que está ebrio?",
    "12. A causa de su problema ¿le resulta difícil concentrarse?",
    "13. A causa de su problema ¿tiene miedo a quedarse solo en su casa?",
    "14. A causa de su problema ¿se siente incapacitado?",
    "15. ¿Su problema le dificulta relacionarse con sus familiares o amigos?",
    "16. A causa de su problema ¿se siente deprimido?",
    "17. A causa de su problema ¿decide limitar sus viajes de negocio o de ocio?",
    "18. A causa de su problema ¿siente dificultades al acostarse o levantarse de la cama?",
    "19. ¿Su problema limita de forma significativa su participación en actividades de ocio (tales como cenar fuera de casa, ir al cine, ir a bailar, ir a fiestas)?",
    "20. A causa de su problema ¿tiene dificultades cuando lee?",
    "21. A causa de su problema ¿evita las alturas?",
    "22. A causa del problema ¿le resulta difícil realizar tareas domésticas agotadoras?",
    "23. A causa de su problema ¿le resulta difícil pasear solo?",
    "24. A causa de su problema ¿le resulta difícil caminar por su casa a oscuras?",
    "25. ¿Su problema influye de manera negativa en sus responsabilidades domésticas o laborales?",
  ],
  SI_AVECES_NO,
);

const DHI25_PED = mkItems(
  [
    "1. ¿Girar la cabeza para arriba te empeora los mareos?",
    "2. ¿Caminar por el supermercado mirando las góndolas o estanterías te empeora el mareo?",
    "3. ¿Los juegos, los deportes, andar en bicicleta, subir a la calesita o a juegos que giran te empeoran los mareos?",
    "4. ¿Los movimientos rápidos de la cabeza te empeoran los mareos?",
    "5. Si te das la vuelta en la cama cuando estás acostado/a, ¿te empeora el mareo?",
    "6. ¿Caminar por la vereda o un terreno irregular, como el pasto o piso con desniveles te empeora los mareos?",
    "7. Cuando bajás la cabeza o te agachás, ¿te empeoran los mareos?",
    "8. Por los mareos, ¿te sentís frustrado/a o incómodo/a?",
    "9. Por los mareos, ¿tenés miedo de salir de tu casa?",
    "10. Por los mareos, ¿te sentís avergonzado/a delante de otras personas?",
    "11. Por los mareos, ¿tenés miedo que la gente piense que estás desorientado/a o enfermo/a?",
    "12. Por los mareos, ¿tenés dificultad para concentrarte en las actividades de la escuela?",
    "13. Por los mareos, ¿tenés miedo de quedarte solo/a en casa?",
    "14. Por los mareos, ¿te sentís en desventaja frente a tus compañeros?",
    "15. Por los mareos, ¿te enojás con amigos, compañeros o personas de tu familia?",
    "16. Por los mareos, ¿estás triste, molesto/a sin ganas de hacer nada?",
    "17. Por los mareos, ¿faltás a la escuela?",
    "18. Por los mareos, ¿tenés dificultad para acostarte o levantarte de la cama?",
    "19. ¿Dejás de ir a cumpleaños, fiestas, cine, locales de videojuegos, por los mareos?",
    "20. Por los mareos, ¿tenés problemas para leer, dibujar o pintar?",
    "21. Por los mareos, ¿dejás de subir a lugares altos?",
    "22. Por los mareos, ¿te resulta difícil saltar, correr, jugar a la pelota, andar en bicicleta?",
    "23. Por los mareos, ¿te resulta difícil caminar solo/a, sin ayuda?",
    "24. Por los mareos, ¿te resulta difícil caminar en la oscuridad?",
    "25. ¿Los mareos dificultan o entorpecen tus estudios (rendimiento escolar)?",
  ],
  SI_AVECES_NO,
);

const VHI30_ES = mkItems(
  [
    "1. La gente me oye con dificultad debido a mi voz",
    "2. La gente no me entiende en sitios ruidosos",
    "3. Mi familia no me oye si la llamo desde el otro lado de la casa",
    "4. Uso el teléfono menos de lo que desearía",
    "5. Tiendo a evitar las tertulias debido a mi voz",
    "6. Hablo menos con mis amigos, vecinos y familiares",
    "7. La gente me pide que repita lo que les digo",
    "8. Mis problemas con la voz alteran mi vida personal y social",
    "9. Me siento desplazado de las conversaciones por mi voz",
    "10. Mi problema con la voz afecta al rendimiento laboral",
    "11. Noto perder aire cuando hablo",
    "12. Mi voz suena distinto a lo largo del día",
    "13. La gente me pregunta: ¿qué te pasa con la voz?",
    "14. Mi voz suena quebrada y seca",
    "15. Siento que necesito tensar la garganta para producir la voz",
    "16. La calidad de mi voz es impredecible",
    "17. Trato de cambiar mi voz para que suene diferente",
    "18. Me esfuerzo mucho para hablar",
    "19. Mi voz empeora por la tarde",
    "20. Mi voz se altera en mitad de una frase",
    "21. Estoy tenso en las conversaciones por mi voz",
    "22. La gente parece irritada por mi voz",
    "23. Creo que la gente no comprende mi problema con la voz",
    "24. Mi voz me molesta",
    "25. Progreso menos debido a mi voz",
    "26. Mi voz me hace sentir cierta minusvalía",
    "27. Me siento contrariado cuando me piden que repita lo dicho",
    "28. Me siento avergonzado cuando me piden que repita lo dicho",
    "29. Mi voz me hace sentir incompetente",
    "30. Estoy avergonzado de mi problema con la voz",
  ],
  VHI30_OPTS,
);

const VHI10_ES = mkItems(
  [
    "1. La gente me oye con dificultad debido a mi voz",
    "2. La gente no me entiende en sitios ruidosos",
    "3. Mis problemas con la voz alteran mi vida personal y social",
    "4. Me siento desplazado de las conversaciones por mi voz",
    "5. Mi problema con la voz afecta al rendimiento laboral",
    "6. Siento que necesito tensar la garganta para producir la voz",
    "7. La calidad de mi voz es impredecible",
    "8. Mi voz me molesta",
    "9. Mi voz me hace sentir cierta minusvalía",
    "10. La gente me pregunta: ¿qué te pasa con la voz?",
  ],
  VHI30_OPTS,
);

const SNOT22_ES = mkItems(
  [
    "1. Necesidad de sonarse la nariz",
    "2. Estornudos",
    "3. Secreción nasal continua",
    "4. Tos",
    "5. Sensación de moco que cae por la parte posterior de la garganta",
    "6. Secreción nasal espesa",
    "7. Sensación de oído taponado",
    "8. Mareo",
    "9. Dolor de oído",
    "10. Dolor/Presión facial",
    "11. Dificultad para quedarse dormido",
    "12. Se despierta durante la noche",
    "13. Dormir mal por la noche",
    "14. Se despierta cansado",
    "15. Fatiga o cansancio",
    "16. Disminución en el rendimiento/productividad",
    "17. Disminución en la concentración",
    "18. Frustrado/inquieto/irritable",
    "19. Triste",
    "20. Avergonzado",
    "21. Alteraciones del gusto/olfato",
    "22. Congestión / Obstrucción nasal",
  ],
  SNOT22_OPTS,
);

const ETDQ7_ES = mkItems(
  [
    "1. ¿Presión en el oído?",
    "2. ¿Dolor en el oído?",
    "3. ¿Tiene sensación de taponamiento?",
    "4. ¿Síntomas en el oído cuando tiene catarro o sinusitis?",
    "5. ¿Chasquido de apertura en el oído?",
    "6. ¿Zumbido en el oído?",
    "7. ¿Disminución de la audición?",
  ],
  ETDQ7_OPTS,
);

const EAT10_ES = mkItems(
  [
    "1. Mi problema para tragar me ha llevado a perder peso",
    "2. Mi problema para tragar interfiere con mi capacidad de comer fuera de casa",
    "3. Tragar líquidos me supone un esfuerzo extra",
    "4. Tragar sólidos me supone un esfuerzo extra",
    "5. Tragar pastillas me supone un esfuerzo extra",
    "6. Tragar es doloroso",
    "7. El placer de comer se ve afectado por mi problema para tragar",
    "8. Cuando trago, la comida se pega en mi garganta",
    "9. Toso cuando como",
    "10. Tragar es estresante",
  ],
  EAT10_OPTS,
);

const VARIANTS: Record<string, QuestionnaireVariant[]> = {
  "dhi-25": [
    {
      id: "ar",
      labelEs: "Argentino",
      validated: true,
      studyUrl: "https://doi.org/10.1016/j.otorri.2011.09.006",
      validationIndex: 0,
      items: DHI25_AR,
    },
    {
      id: "pediatrica",
      labelEs: "Pediátrico",
      validated: true,
      studyUrl: "https://doi.org/10.1016/j.otorri.2021.11.003",
      validationIndex: 1,
      items: DHI25_PED,
    },
    { id: GENERIC_VARIANT_ID, labelEs: "Traducción Genérica", validated: false },
  ],
  "thi-25": [
    {
      id: "es",
      labelEs: "Castellano",
      validated: true,
      studyUrl: "https://doi.org/10.1016/S0001-6519(01)78247-7",
      validationIndex: 0,
      items: THI25_ES,
    },
    { id: GENERIC_VARIANT_ID, labelEs: "Traducción Genérica", validated: false },
  ],
  "etdq-7": [
    {
      id: "es",
      labelEs: "Castellano",
      validated: true,
      studyUrl: "https://doi.org/10.1016/j.otorri.2018.05.005",
      validationIndex: 0,
      items: ETDQ7_ES,
    },
    { id: GENERIC_VARIANT_ID, labelEs: "Traducción Genérica", validated: false },
  ],
  "snot-22": [
    {
      id: "es",
      labelEs: "Castellano",
      validated: true,
      studyUrl: "https://doi.org/10.1007/s00405-014-3437-0",
      validationIndex: 0,
      items: SNOT22_ES,
    },
    { id: GENERIC_VARIANT_ID, labelEs: "Traducción Genérica", validated: false },
  ],
  "eat-10": [
    {
      id: "es",
      labelEs: "Castellano",
      validated: true,
      studyUrl: "https://doi.org/10.3305/nh.2012.27.6.6100",
      validationIndex: 0,
      items: EAT10_ES,
    },
    { id: GENERIC_VARIANT_ID, labelEs: "Traducción Genérica", validated: false },
  ],
  "vhi-30": [
    {
      id: "es",
      labelEs: "Castellano",
      validated: true,
      studyUrl: "https://doi.org/10.1016/S2173-5735(07)70376-9",
      validationIndex: 0,
      items: VHI30_ES,
    },
    {
      id: "es-acortado",
      labelEs: "Castellano Acortado",
      validated: true,
      studyUrl: "https://doi.org/10.1016/S2173-5735(07)70376-9",
      validationIndex: 1,
      items: VHI10_ES,
    },
    { id: GENERIC_VARIANT_ID, labelEs: "Traducción Genérica", validated: false },
  ],
};


/** Variants offered for a given questionnaire slug (always non-empty). */
export function getVariantsForSlug(slug: string): QuestionnaireVariant[] {
  return VARIANTS[slug] ?? [{ id: GENERIC_VARIANT_ID, labelEs: "Traducción Genérica", validated: false }];
}

/** Resolve a requested variant id, falling back to the generic variant. */
export function resolveVariant(slug: string, requestedId: string | undefined): QuestionnaireVariant {
  const list = getVariantsForSlug(slug);
  const match = requestedId ? list.find((v) => v.id === requestedId && !v.pending) : undefined;
  return match ?? list.find((v) => v.id === GENERIC_VARIANT_ID) ?? list[0];
}

/** Sanitise a search-param variant id (empty / unknown → undefined). */
export function normaliseVariantId(raw: string | undefined | null): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  if (!/^[a-z0-9-]{1,20}$/i.test(raw)) return undefined;
  return raw;
}
