// Bibliographic metadata for each questionnaire. Used by the info dialog on
// the catalog. Kept as static content — this is public bibliographic data
// with no clinical interpretation, aligned with the "office tool" positioning
// (AEMPS Class I). All narrative text is bilingual (es / en).

import type { Lang } from "@/modules/quest/i18n";

export interface ValidationStudy {
  citation: { es: string; en: string };
  doi?: string;
  summary: { es: string; en: string };
  language?: string; // e.g. "es-AR", "es-ES"
  variantLabel?: { es: string; en: string }; // e.g. "Argentina (adultos)", "Pediátrica"
}

export interface QuestionnaireStudy {
  /** ISO language of the ORIGINAL study (defaults to "en"). */
  originalLanguage?: string;
  study: { es: string; en: string };
  doi?: string;
  rationale: { es: string; en: string };
  objective: { es: string; en: string };
  methodology: { es: string; en: string };
  results: { es: string; en: string };
  sensitivity?: { es: string; en: string };
  observations?: { es: string; en: string };
  spanishValidations?: ValidationStudy[];
}

export const QUESTIONNAIRE_STUDIES: Record<string, QuestionnaireStudy> = {
  "dhi-25": {
    study: {
      es: "«The Development of the Dizziness Handicap Inventory». Gary P. Jacobson y Craig W. Newman. Archives of Otolaryngology–Head and Neck Surgery. Estados Unidos, 1990.",
      en: "\"The Development of the Dizziness Handicap Inventory\". Gary P. Jacobson and Craig W. Newman. Archives of Otolaryngology–Head and Neck Surgery. United States, 1990.",
    },
    rationale: {
      es: "Cuestionario diseñado para evaluar los efectos discapacitantes autopercibidos impuestos por las enfermedades del sistema vestibular.",
      en: "Questionnaire designed to assess the self-perceived disabling effects imposed by vestibular system disorders.",
    },
    objective: {
      es: "Cuantificar las consecuencias funcionales, emocionales y físicas del mareo y la inestabilidad, así como los factores físicos que precipitan estos síntomas. También sirve para medir los beneficios o cambios derivados de una intervención médica, quirúrgica o de rehabilitación a lo largo del tiempo.",
      en: "Quantify the functional, emotional and physical consequences of dizziness and imbalance, as well as the physical factors that trigger these symptoms. It also measures the benefits or changes derived from a medical, surgical or rehabilitation intervention over time.",
    },
    methodology: {
      es: "25 ítems distribuidos en tres dominios: funcional (9), emocional (9) y físico (7). Cada respuesta se puntúa como «sí» (4), «a veces» (2) o «no» (0). ENT Senses Quest realiza una suma ordinal aritmética de las respuestas.",
      en: "25 items across three domains: functional (9), emotional (9) and physical (7). Each answer scores \"yes\" (4), \"sometimes\" (2) or \"no\" (0). ENT Senses Quest performs an ordinal arithmetic sum of the responses.",
    },
    results: {
      es: "Puntuación total de 0 (ausencia de discapacidad) a 100 (discapacidad percibida significativa). ENT Senses Quest muestra la puntuación numérica junto a la tabla de referencia estática de la escala original.",
      en: "Total score ranges from 0 (no disability) to 100 (significant perceived disability). ENT Senses Quest displays the numeric score alongside the static reference table of the original scale.",
    },
    sensitivity: {
      es: "Alta fiabilidad y consistencia interna (α de Cronbach = 0,89 para la escala total). Estabilidad test-retest excelente: un cambio de al menos 18 puntos entre dos administraciones asegura (95% de confianza) un cambio clínico real.",
      en: "High reliability and internal consistency (Cronbach's α = 0.89 for the total scale). Excellent test-retest stability: a change of at least 18 points between two administrations assures (95% confidence) a real clinical change.",
    },
    spanishValidations: [
      {
        variantLabel: { es: "Argentina (adultos)", en: "Argentina (adults)" },
        language: "es-AR",
        citation: {
          es: "Caldara B, et al. «Adaptación cultural y validación del Dizziness Handicap Inventory: versión Argentina». Acta Otorrinolaringológica Española. Argentina, 2011.",
          en: "Caldara B, et al. \"Cultural adaptation and validation of the Dizziness Handicap Inventory: Argentine version\". Acta Otorrinolaringológica Española. Argentina, 2011.",
        },
        doi: "10.1016/j.otorri.2011.09.006",
        summary: {
          es: "Adaptación lingüística y cultural al castellano argentino a partir de la versión española peninsular; se modificaron 10 de las 25 preguntas para asegurar equivalencia semántica. Validado en 108 sujetos (98 pacientes vestibulares, 10 sanos, 18–85 años). Alta consistencia interna (α = 0,87) y excelente confiabilidad test-retest (CCI = 0,98). Correlación estadísticamente significativa con Romberg y marcha en tándem.",
          en: "Linguistic and cultural adaptation into Argentine Spanish from the peninsular Spanish version; 10 of the 25 items were modified to ensure semantic equivalence. Validated in 108 subjects (98 vestibular patients, 10 healthy, 18–85 years). High internal consistency (α = 0.87) and excellent test-retest reliability (ICC = 0.98). Statistically significant correlation with Romberg and tandem gait tests.",
        },
      },
      {
        variantLabel: { es: "Pediátrica (DHI-CA)", en: "Paediatric (DHI-CA)" },
        language: "es-AR",
        citation: {
          es: "Sommerfleck PA, Piraíno RM, Bisogno JP. «Adaptación transcultural en versión de lengua española del cuestionario Dizziness Handicap Inventory en la población pediátrica». Acta Otorrinolaringológica Española. Argentina, 2022.",
          en: "Sommerfleck PA, Piraíno RM, Bisogno JP. \"Cross-cultural adaptation of the Spanish-language Dizziness Handicap Inventory for the paediatric population\". Acta Otorrinolaringológica Española. Argentina, 2022.",
        },
        doi: "10.1016/j.otorri.2021.11.003",
        summary: {
          es: "Adaptación transcultural al español de Argentina partiendo de la versión pediátrica portuguesa. Validado en 32 pacientes de 4 a 17 años. Un equipo con psicopedagogía y psicología ajustó el lenguaje (uso de «vos», ejemplos como «caminar por el pasto o piso con desniveles»). α de Cronbach = 0,887. Identificó correctamente los casos de discapacidad severa, asociados principalmente a migraña vestibular.",
          en: "Cross-cultural adaptation into Argentine Spanish from the Portuguese paediatric version. Validated in 32 patients aged 4–17. A team with psychopedagogy and psychology backgrounds adjusted the language (Argentine \"vos\", examples like \"walking on grass or uneven floors\"). Cronbach's α = 0.887. Correctly identified severe disability cases, mainly linked to vestibular migraine.",
        },
      },
    ],
  },

  "thi-25": {
    study: {
      es: "«Development of the Tinnitus Handicap Inventory». Newman CW, Jacobson GP, Spitzer JB. Archives of Otolaryngology–Head and Neck Surgery. Estados Unidos, 1996.",
      en: "\"Development of the Tinnitus Handicap Inventory\". Newman CW, Jacobson GP, Spitzer JB. Archives of Otolaryngology–Head and Neck Surgery. United States, 1996.",
    },
    rationale: {
      es: "Evaluar el impacto que tienen los acúfenos (tinnitus) en las actividades cotidianas del paciente.",
      en: "Assess the impact tinnitus has on the patient's everyday activities.",
    },
    objective: {
      es: "Instrumento de autoinforme breve, fácil de administrar e interpretar, para cuantificar la discapacidad percibida por el tinnitus en los dominios funcional, emocional y catastrófico.",
      en: "Brief self-report instrument, easy to administer and interpret, to quantify the perceived tinnitus handicap in the functional, emotional and catastrophic domains.",
    },
    methodology: {
      es: "25 preguntas. Se puntúa «sí» = 4, «a veces» = 2, «no» = 0. Rango total: 0–100. ENT Senses Quest lo calcula aritméticamente.",
      en: "25 items. Scored \"yes\" = 4, \"sometimes\" = 2, \"no\" = 0. Total range: 0–100. ENT Senses Quest computes it arithmetically.",
    },
    results: {
      es: "A mayor puntuación, mayor discapacidad percibida. La validación española categoriza el grado en: sin incapacidad (0–16), leve (18–36), moderada (38–56) y severa (58–100).",
      en: "Higher score means higher perceived handicap. The Spanish validation categorises: none (0–16), mild (18–36), moderate (38–56) and severe (58–100).",
    },
    sensitivity: {
      es: "Excelente consistencia interna (α de Cronbach = 0,93) y buena validez de constructo frente a otras escalas.",
      en: "Excellent internal consistency (Cronbach's α = 0.93) and good construct validity against other scales.",
    },
    spanishValidations: [
      {
        language: "es-ES",
        variantLabel: { es: "Castellano", en: "Spanish" },
        citation: {
          es: "Herráiz C, Hernández Calvín J, Plaza G, Tapia MC, de los Santos G. «Evaluación de la incapacidad en pacientes con acúfenos». Acta Otorrinolaringológica Española. España, 2001.",
          en: "Herráiz C, Hernández Calvín J, Plaza G, Tapia MC, de los Santos G. \"Assessment of disability in patients with tinnitus\". Acta Otorrinolaringológica Española. Spain, 2001.",
        },
        summary: {
          es: "Realizado en la Unidad de Acúfenos del Hospital Universitario San Carlos (Madrid). Incluyó traducción doble y retrotraducción. Administrado a 80 pacientes; la versión española demostró ser válida, fiable y con consistencia interna elevada (α de Cronbach = 0,90) para cuantificar el impacto en la calidad de vida.",
          en: "Conducted at the Tinnitus Unit of Hospital Universitario San Carlos (Madrid). Included double translation and back-translation. Administered to 80 patients; the Spanish version proved valid, reliable and internally consistent (Cronbach's α = 0.90) to quantify quality-of-life impact.",
        },
      },
    ],
  },

  "etdq-7": {
    study: {
      es: "«Validating the Clinical Assessment of Eustachian Tube Dysfunction: The Eustachian Tube Dysfunction Questionnaire (ETDQ-7)». McCoul ED, Anand VK, Christos PJ. Laryngoscope. Estados Unidos, 2012.",
      en: "\"Validating the Clinical Assessment of Eustachian Tube Dysfunction: The Eustachian Tube Dysfunction Questionnaire (ETDQ-7)\". McCoul ED, Anand VK, Christos PJ. Laryngoscope. United States, 2012.",
    },
    doi: "10.1002/lary.23223",
    rationale: {
      es: "Primer instrumento específico para medir y evaluar de forma cuantitativa la sintomatología de la disfunción de la trompa de Eustaquio (ETD).",
      en: "First instrument specifically developed to quantitatively measure and evaluate the symptoms of Eustachian tube dysfunction (ETD).",
    },
    objective: {
      es: "Herramienta válida y confiable para evaluar síntomas, facilitar la práctica clínica y monitorear los resultados de los tratamientos de la ETD.",
      en: "Valid and reliable tool to evaluate symptoms, support clinical practice and monitor treatment outcomes for ETD.",
    },
    methodology: {
      es: "7 ítems calificados en escala Likert del 1 (ningún problema) al 7 (problema severo). Puede reportarse como suma total (7–49) o media (1,0–7,0). ENT Senses Quest usa la suma simple.",
      en: "7 items scored on a Likert scale from 1 (no problem) to 7 (severe problem). Can be reported as total sum (7–49) or mean (1.0–7.0). ENT Senses Quest uses the simple sum.",
    },
    results: {
      es: "Un puntaje medio ≥ 2,1 o total ≥ 14,5 indica presencia de disfunción de la trompa de Eustaquio.",
      en: "A mean score ≥ 2.1 or a total score ≥ 14.5 indicates the presence of Eustachian tube dysfunction.",
    },
    sensitivity: {
      es: "En el estudio original, el punto de corte ≥ 14,5 alcanzó 100% de sensibilidad y 100% de especificidad para detectar ETD.",
      en: "In the original study, the cut-off ≥ 14.5 achieved 100% sensitivity and 100% specificity for detecting ETD.",
    },
    spanishValidations: [
      {
        language: "es-ES",
        variantLabel: { es: "Castellano", en: "Spanish" },
        citation: {
          es: "Herrera M, Eisenberg G, Plaza G. «Evaluación de la disfunción de la trompa de Eustaquio mediante el cuestionario de disfunción tubárica (ETDQ-7) y la tubomanometría». Acta Otorrinolaringológica Española. España, 2018.",
          en: "Herrera M, Eisenberg G, Plaza G. \"Assessment of Eustachian tube dysfunction with the ETDQ-7 questionnaire and tubomanometry\". Acta Otorrinolaringológica Española. Spain, 2018.",
        },
        doi: "10.1016/j.otorri.2018.05.005",
        summary: {
          es: "Traducción, retrotraducción y revisión por 3 otorrinolaringólogos. 125 pacientes en el Hospital Universitario de Fuenlabrada (Madrid), con timpanograma como gold standard. En esta muestra, un punto de corte de 17,5 maximiza la validez (sensibilidad 49%, especificidad 67%). Los autores sugieren combinar ETDQ-7 con tubomanometría (TMM) para mayor precisión diagnóstica.",
          en: "Translation, back-translation and review by 3 otolaryngologists. 125 patients at Hospital Universitario de Fuenlabrada (Madrid), with tympanogram as gold standard. In this sample, a cut-off of 17.5 maximises validity (sensitivity 49%, specificity 67%). The authors suggest combining ETDQ-7 with tubomanometry (TMM) for higher diagnostic accuracy.",
        },
      },
    ],
  },

  "snot-22": {
    study: {
      es: "«Psychometric validity of the 22-item Sinonasal Outcome Test». Hopkins C, Gillett S, Slack R, Lund VJ, Browne JP. Clinical Otolaryngology. Reino Unido, 2009.",
      en: "\"Psychometric validity of the 22-item Sinonasal Outcome Test\". Hopkins C, Gillett S, Slack R, Lund VJ, Browne JP. Clinical Otolaryngology. United Kingdom, 2009.",
    },
    rationale: {
      es: "Derivado del SNOT-20 con la adición de dos síntomas (obstrucción nasal y pérdida de gusto/olfato) para medir el impacto de la rinosinusitis crónica.",
      en: "Derived from SNOT-20 with two additional symptoms (nasal obstruction and loss of taste/smell) to measure the impact of chronic rhinosinusitis.",
    },
    objective: {
      es: "Evaluar el impacto de la rinosinusitis crónica en la calidad de vida y medir la sensibilidad al cambio clínico tras intervenciones médicas o quirúrgicas.",
      en: "Evaluate the impact of chronic rhinosinusitis on quality of life and measure responsiveness to clinical change after medical or surgical intervention.",
    },
    methodology: {
      es: "22 ítems con escala de 0 a 5. Puntaje total por sumatoria simple.",
      en: "22 items scored 0–5. Total score by simple sum.",
    },
    results: {
      es: "No existe un puntaje rígido binario; a mayor sumatoria total, mayor impacto de los síntomas (nasales, oídos/faciales, calidad de vida y psicológicos).",
      en: "There is no rigid binary cut-off; higher total sums mean greater impact of symptoms (nasal, ear/facial, quality of life and psychological).",
    },
    sensitivity: {
      es: "Más allá de S/E diagnóstica, posee una excepcional sensibilidad al cambio (responsiveness), permitiendo cuantificar el efecto positivo post-tratamiento.",
      en: "Beyond diagnostic sensitivity/specificity, it has exceptional responsiveness, enabling quantification of positive post-treatment effects.",
    },
    spanishValidations: [
      {
        language: "es-ES",
        variantLabel: { es: "Castellano", en: "Spanish" },
        citation: {
          es: "de los Santos G, Reyes P, del Castillo R, Fragola C, Royuela A. «Cross-cultural adaptation and validation of the sino-nasal outcome test (SNOT-22) for Spanish-speaking patients». European Archives of Oto-Rhino-Laryngology. España, 2015.",
          en: "de los Santos G, Reyes P, del Castillo R, Fragola C, Royuela A. \"Cross-cultural adaptation and validation of the sino-nasal outcome test (SNOT-22) for Spanish-speaking patients\". European Archives of Oto-Rhino-Laryngology. Spain, 2015.",
        },
        doi: "10.1007/s00405-014-3437-0",
        summary: {
          es: "Realizado en el Hospital Universitario Ramón y Cajal (Madrid). Tras traducción, retrotraducción y adaptación cultural, se validó en 119 personas (60 casos y 59 controles). Excelente consistencia interna (α de Cronbach = 0,91), alta fiabilidad (CCI = 0,87) y fuerte sensibilidad a los cambios clínicos post-tratamiento quirúrgico o médico.",
          en: "Conducted at Hospital Universitario Ramón y Cajal (Madrid). After translation, back-translation and cultural adaptation, validated in 119 subjects (60 cases and 59 controls). Excellent internal consistency (Cronbach's α = 0.91), high reliability (ICC = 0.87) and strong responsiveness to post-treatment clinical change.",
        },
      },
    ],
  },

  "eat-10": {
    study: {
      es: "«Validity and Reliability of the Eating Assessment Tool (EAT-10)». Belafsky PC, Mouadeb DA, Rees CJ, et al. Annals of Otology, Rhinology & Laryngology. Estados Unidos, 2008.",
      en: "\"Validity and Reliability of the Eating Assessment Tool (EAT-10)\". Belafsky PC, Mouadeb DA, Rees CJ, et al. Annals of Otology, Rhinology & Laryngology. United States, 2008.",
    },
    rationale: {
      es: "Instrumento autoadministrado de resultados específicos de síntomas para evaluar la disfagia (orofaríngea y esofágica).",
      en: "Self-administered symptom-specific outcomes instrument to assess dysphagia (oropharyngeal and esophageal).",
    },
    objective: {
      es: "Evaluar rápidamente la severidad inicial de los síntomas, la calidad de vida relacionada con la deglución y monitorear la eficacia del tratamiento.",
      en: "Rapidly assess initial symptom severity, swallowing-related quality of life and monitor treatment efficacy.",
    },
    methodology: {
      es: "Cuestionario unidimensional de 10 ítems (escala 0–4). Sumatoria directa, sin fórmulas complejas.",
      en: "One-dimensional 10-item questionnaire (0–4 scale). Direct sum, no complex formulas.",
    },
    results: {
      es: "Los datos normativos sugieren que un puntaje ≥ 3 se considera anormal.",
      en: "Normative data suggest a score ≥ 3 is considered abnormal.",
    },
    sensitivity: {
      es: "Excelente consistencia interna (α de Cronbach = 0,960) y muy alta sensibilidad para correlacionar cambios de puntaje antes y después del tratamiento.",
      en: "Excellent internal consistency (Cronbach's α = 0.960) and very high sensitivity to correlate score changes before and after treatment.",
    },
    spanishValidations: [
      {
        language: "es-ES",
        variantLabel: { es: "Castellano", en: "Spanish" },
        citation: {
          es: "Burgos R, Sarto B, Segurola H, et al. «Traducción y validación de la versión en español de la escala EAT-10 (Eating Assessment Tool-10) para el despistaje de la disfagia». Nutrición Hospitalaria. España, 2012.",
          en: "Burgos R, Sarto B, Segurola H, et al. \"Translation and validation of the Spanish version of the EAT-10 (Eating Assessment Tool-10) for dysphagia screening\". Nutrición Hospitalaria. Spain, 2012.",
        },
        doi: "10.3305/nh.2012.27.6.6100",
        summary: {
          es: "Realizado en el Hospital Universitario Vall d'Hebron y centros de atención primaria/geriátricos asociados (Barcelona), con 65 pacientes. Mediante traducción y traducción inversa se demostró que la herramienta es válida, rápida (media de 3,8 minutos) y con fuerte consistencia interna (α de Cronbach = 0,87). Muy útil para el despistaje rutinario.",
          en: "Conducted at Hospital Universitario Vall d'Hebron and associated primary care/geriatric centres (Barcelona), with 65 patients. Through translation and back-translation, the tool proved valid, fast (mean 3.8 minutes) and internally consistent (Cronbach's α = 0.87). Very useful for routine screening.",
        },
      },
    ],
  },

  "vhi-30": {
    study: {
      es: "«The Voice Handicap Index (VHI): Development and Validation». Jacobson BH, Johnson A, Grywalski C, Silbergleit A, Jacobson G, Benninger MS. American Journal of Speech-Language Pathology. Estados Unidos, 1997.",
      en: "\"The Voice Handicap Index (VHI): Development and Validation\". Jacobson BH, Johnson A, Grywalski C, Silbergleit A, Jacobson G, Benninger MS. American Journal of Speech-Language Pathology. United States, 1997.",
    },
    rationale: {
      es: "Aborda la necesidad de medir de manera estandarizada las consecuencias psicosociales (discapacidad/minusvalía) provocadas por los trastornos de la voz.",
      en: "Addresses the need to measure, in a standardised way, the psychosocial consequences (handicap) caused by voice disorders.",
    },
    objective: {
      es: "Cuantificar el impacto autopercibido por el paciente debido a su disfonía en las esferas funcional, física y emocional.",
      en: "Quantify the self-perceived impact of dysphonia on the functional, physical and emotional domains.",
    },
    methodology: {
      es: "30 ítems puntuados en escala de 5 puntos: 0 (nunca) a 4 (siempre). Puntaje máximo: 120 puntos por suma directa.",
      en: "30 items scored on a 5-point scale: 0 (never) to 4 (always). Maximum score: 120 points by direct sum.",
    },
    results: {
      es: "Un cambio ≥ 18 puntos entre dos administraciones representa una alteración significativa en el estado psicosocial del paciente. Permite medir si el paciente percibe su trastorno de voz como leve, moderado o severo.",
      en: "A change of ≥ 18 points between two administrations represents a significant change in the patient's psychosocial state. Allows measuring whether the patient perceives their voice disorder as mild, moderate or severe.",
    },
    sensitivity: {
      es: "No se basa en S/E clásica, pero muestra una fortísima estabilidad test-retest (r = 0,92) y alta consistencia interna (α de Cronbach = 0,95).",
      en: "Does not rely on classical sensitivity/specificity, but shows very strong test-retest stability (r = 0.92) and high internal consistency (Cronbach's α = 0.95).",
    },
    spanishValidations: [
      {
        language: "es-ES",
        variantLabel: { es: "Castellano (VHI-30)", en: "Spanish (VHI-30)" },
        citation: {
          es: "Núñez-Batalla F, Corte-Santos P, Señaris-González B, et al. «Adaptación y validación al español del Voice Handicap Index (VHI-30) y su versión abreviada (VHI-10)». Acta Otorrinolaringológica Española. España, 2007.",
          en: "Núñez-Batalla F, Corte-Santos P, Señaris-González B, et al. \"Adaptation and Validation to Spanish of the Voice Handicap Index (VHI-30) and its Shortened Version (VHI-10)\". Acta Otorrinolaringológica Española. Spain, 2007.",
        },
        summary: {
          es: "Versión completa de 30 ítems. Desarrollado por la Comisión de Foniatría de la SEORL. Aplicado en el Hospital Universitario Central de Asturias a 232 pacientes con disfonía y 38 individuos sanos. Alta fiabilidad (α de Cronbach = 0,93 para VHI-30). Se adaptaron términos idiomáticos (por ejemplo, «afectación de rendimiento en el trabajo» en lugar de «pérdida de ingresos»), obteniendo un instrumento válido y confiable en la población hispanohablante.",
          en: "Full 30-item version. Developed by SEORL's Phoniatrics Commission. Applied at Hospital Universitario Central de Asturias to 232 dysphonic patients and 38 healthy controls. High reliability (Cronbach's α = 0.93 for VHI-30). Idiomatic terms were adapted (e.g. \"impact on work performance\" instead of \"loss of income\"), yielding a valid and reliable instrument for the Spanish-speaking population.",
        },
      },
      {
        language: "es-ES",
        variantLabel: { es: "Castellano Acortado (VHI-10)", en: "Spanish Short Form (VHI-10)" },
        citation: {
          es: "Núñez-Batalla F, Corte-Santos P, Señaris-González B, et al. «Adaptación y validación al español del Voice Handicap Index (VHI-30) y su versión abreviada (VHI-10)». Acta Otorrinolaringológica Española. España, 2007.",
          en: "Núñez-Batalla F, Corte-Santos P, Señaris-González B, et al. \"Adaptation and Validation to Spanish of the Voice Handicap Index (VHI-30) and its Shortened Version (VHI-10)\". Acta Otorrinolaringológica Española. Spain, 2007.",
        },
        summary: {
          es: "Versión abreviada de 10 ítems seleccionados del VHI-30 (F1, F2, F8, F9, F10, P3, P5, P6, E4, E6). Ha demostrado no perder sensibilidad clínica respecto a la versión larga y resulta más rápida de administrar en la consulta. Puntuación 0–40 por suma directa; los rangos de referencia del VHI-30 no aplican tal cual a la versión acortada.",
          en: "Shortened 10-item version selected from VHI-30 (F1, F2, F8, F9, F10, P3, P5, P6, E4, E6). It preserves clinical sensitivity while being faster to administer. Score 0–40 by direct sum; the VHI-30 reference bands do not apply as-is to the short form.",
        },
      },

    ],
  },
};

export function pickText(field: { es: string; en: string } | undefined, lang: Lang): string {
  if (!field) return "";
  return field[lang] ?? field.es;
}

export function hasSpanishValidation(slug: string): boolean {
  return (QUESTIONNAIRE_STUDIES[slug]?.spanishValidations?.length ?? 0) > 0;
}
