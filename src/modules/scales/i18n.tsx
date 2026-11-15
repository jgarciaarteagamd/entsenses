// ENT Senses Scales — interface texts. The module looks its keys up here first and falls back to
// the core dictionary. Grade definitions live with each scale (lib/rhinology.ts).
import { createModuleLang, type Dict } from "@/lib/i18n";
export type { Lang } from "@/lib/i18n";

export const SCALES_DICT: Dict = {
  // Home
  "scales.title": { es: "Escalas clínicas", en: "Clinical scales" },
  "scales.subtitle": {
    es: "Escalas que puntúa el médico (endoscopia, imagen, estadiajes). Se guardan con la etiqueta del paciente para seguir su evolución.",
    en: "Clinician-rated scales (endoscopy, imaging, staging). Saved with the patient label to follow their course.",
  },
  "scales.new": { es: "Nueva valoración", en: "New assessment" },
  "scales.coming": { es: "Próximamente", en: "Coming soon" },
  "scales.recent": { es: "Últimas valoraciones", en: "Recent assessments" },
  "scales.followup": { es: "Evolución de un paciente", en: "Patient follow-up" },
  "scales.followup.placeholder": { es: "Etiqueta del paciente", en: "Patient label" },
  "scales.followup.open": { es: "Ver evolución", en: "View follow-up" },
  "scales.empty": { es: "Todavía no hay valoraciones.", en: "No assessments yet." },
  "scales.disclaimer": {
    es: "Herramienta de registro y cálculo de escalas publicadas. No interpreta imágenes ni sustituye el juicio clínico.",
    en: "A tool to record and score published scales. It does not interpret images or replace clinical judgement.",
  },

  // Pack names
  "pack.rhinology": { es: "Rinología", en: "Rhinology" },

  // Form
  "form.title.new": { es: "Valoración de rinología", en: "Rhinology assessment" },
  "form.title.edit": { es: "Editar valoración de rinología", en: "Edit rhinology assessment" },
  "form.subtitle": {
    es: "Active las escalas que ha explorado hoy. Las puntuaciones se calculan mientras marca.",
    en: "Switch on the scales you examined today. Scores update as you rate.",
  },
  "form.label": { es: "Etiqueta del paciente", en: "Patient label" },
  "form.label.placeholder": { es: "Iniciales o nº de historia", en: "Initials or record number" },
  "form.label.hint": {
    es: "No escriba el nombre. La misma etiqueta une las valoraciones, el SNOT-22 de Quest y la evolución.",
    en: "Do not type the name. The same label links assessments, the Quest SNOT-22 and the follow-up.",
  },
  "form.date": { es: "Fecha de la exploración", en: "Examination date" },
  "form.include": { es: "Incluir", en: "Include" },
  "form.right": { es: "Derecha", en: "Right" },
  "form.left": { es: "Izquierda", en: "Left" },
  "form.total": { es: "Total", en: "Total" },
  "form.incomplete": { es: "Incompleta", en: "Incomplete" },
  "form.yes": { es: "Sí", en: "Yes" },
  "form.no": { es: "No", en: "No" },
  "form.save": { es: "Guardar valoración", en: "Save assessment" },
  "form.saving": { es: "Guardando…", en: "Saving…" },
  "form.saved": { es: "Valoración guardada", en: "Assessment saved" },
  "form.nothing": { es: "Active al menos una escala.", en: "Switch on at least one scale." },
  "form.confirm_incomplete": {
    es: "Hay escalas incompletas ({0}). Se guardarán sin puntuación total. ¿Continuar?",
    en: "Some scales are incomplete ({0}). They will be saved without a total score. Continue?",
  },
  "form.error": { es: "No se pudo guardar. Inténtelo de nuevo.", en: "Could not save. Please try again." },
  "form.summary": { es: "Resumen", en: "Summary" },
  "form.references": { es: "Referencias", en: "References" },
  "form.legend": { es: "Definición de los grados", en: "Grade definitions" },
  "form.after_save.new": { es: "Otra valoración", en: "Another assessment" },
  "form.after_save.followup": { es: "Ver evolución", en: "View follow-up" },
  "form.after_save.print": { es: "Imprimir informe", en: "Print report" },
  "form.not_found": { es: "No se encontró la valoración.", en: "Assessment not found." },

  // Scale titles
  "scale.nps": { es: "Nasal Polyp Score (NPS)", en: "Nasal Polyp Score (NPS)" },
  "scale.nps.desc": { es: "Endoscopia. De 0 a 4 por fosa (total 0–8).", en: "Endoscopy. 0 to 4 per side (total 0–8)." },
  "scale.lundKennedy": { es: "Lund-Kennedy", en: "Lund-Kennedy" },
  "scale.lundKennedy.desc": {
    es: "Endoscopia. Original: 5 elementos (0–20). Modificada: pólipos, edema y secreción (0–12). Cicatrices y costras son opcionales.",
    en: "Endoscopy. Original: 5 items (0–20). Modified: polyps, oedema and discharge (0–12). Scarring and crusting are optional.",
  },
  "scale.lk.original": { es: "Lund-Kennedy original", en: "Original Lund-Kennedy" },
  "scale.lk.modified": { es: "Lund-Kennedy modificada", en: "Modified Lund-Kennedy" },
  "scale.lundMackay": { es: "Lund-Mackay", en: "Lund-Mackay" },
  "scale.lundMackay.desc": {
    es: "Tomografía computarizada. Senos 0/1/2 y complejo ostiomeatal 0/2 por lado (total 0–24).",
    en: "Computed tomography. Sinuses 0/1/2 and ostiomeatal complex 0/2 per side (total 0–24).",
  },
  "scale.snot22": { es: "SNOT-22", en: "SNOT-22" },
  "scale.snot22.desc": {
    es: "Cuestionario del paciente (0–110). Escríbalo o tráigalo de Quest. Se usa en los criterios de biológico y en la evolución.",
    en: "Patient questionnaire (0–110). Type it or bring it from Quest. Used in the biologic criteria and the follow-up.",
  },
  "scale.control": { es: "Control de la RSC (EPOS 2020)", en: "CRS control (EPOS 2020)" },
  "scale.control.desc": {
    es: "Síntomas del último mes, endoscopia y tratamiento de rescate en los últimos 6 meses. Marque «Sí» si está presente.",
    en: "Symptoms in the last month, endoscopy and rescue treatment in the last 6 months. Tick “Yes” if present.",
  },
  "scale.control.vas": {
    es: "Si usa una escala visual analógica, en los estudios con EPOS 2020 se considera presente un síntoma con EVA > 5.",
    en: "If you use a visual analogue scale, studies using EPOS 2020 count a symptom as present with VAS > 5.",
  },
  "scale.biologic": { es: "Indicación de biológico (EPOS/EUFOREA 2023)", en: "Biologic indication (EPOS/EUFOREA 2023)" },
  "scale.biologic.desc": {
    es: "Rinosinusitis crónica con pólipos bilaterales: ≥3 de 5 criterios tras cirugía endoscópica nasosinusal; ≥4 sin cirugía previa (casos excepcionales).",
    en: "Chronic rhinosinusitis with bilateral polyps: ≥3 of 5 criteria after endoscopic sinus surgery; ≥4 without previous surgery (exceptional cases).",
  },
  "scale.response": { es: "Respuesta al biológico (EPOS/EUFOREA 2023)", en: "Response to biologics (EPOS/EUFOREA 2023)" },
  "scale.response.desc": {
    es: "Primera valoración a los 6 meses, después al año y luego cada año. El criterio de comorbilidades solo cuenta si el paciente las tiene.",
    en: "First evaluation at 6 months, then at 1 year and yearly after that. The comorbidity criterion only counts if the patient has comorbidities.",
  },

  // SNOT-22
  "snot.value": { es: "Puntuación SNOT-22", en: "SNOT-22 score" },
  "snot.from_quest": { es: "SNOT-22 en Quest con esta etiqueta", en: "Quest SNOT-22 with this label" },
  "snot.use": { es: "Usar", en: "Use" },
  "snot.none": {
    es: "No hay ningún SNOT-22 en Quest con esta etiqueta. Puede enviarlo al paciente desde Quest o escribir la puntuación.",
    en: "No Quest SNOT-22 with this label. You can send it to the patient from Quest or type the score.",
  },
  "snot.no_label": { es: "Escriba la etiqueta del paciente para buscar su SNOT-22 en Quest.", en: "Type the patient label to look up their SNOT-22 in Quest." },
  "snot.taken": { es: "Tomado de Quest ({0})", en: "Taken from Quest ({0})" },
  "snot.mcid": {
    es: "Diferencia mínima importante del SNOT-22: 8,9 puntos (Hopkins 2009).",
    en: "SNOT-22 minimal important difference: 8.9 points (Hopkins 2009).",
  },

  // Biologic
  "bio.bilateral": { es: "Pólipos nasales bilaterales", en: "Bilateral nasal polyps" },
  "bio.surgery": { es: "Cirugía endoscópica nasosinusal previa", en: "Previous endoscopic sinus surgery" },
  "bio.type2": { es: "Inflamación tipo 2", en: "Type 2 inflammation" },
  "bio.tissueEos": { es: "Eosinófilos en tejido (/CGA)", en: "Tissue eosinophils (/HPF)" },
  "bio.bloodEos": { es: "Eosinófilos en sangre (/µL)", en: "Blood eosinophils (/µL)" },
  "bio.ige": { es: "IgE total (UI/mL)", en: "Total IgE (IU/mL)" },
  "bio.steroids": { es: "Corticoides sistémicos", en: "Systemic corticosteroids" },
  "bio.courses": { es: "Ciclos en el último año", en: "Courses in the last year" },
  "bio.longterm": { es: "Tratamiento prolongado (>3 meses)", en: "Long-term treatment (>3 months)" },
  "bio.contraindicated": { es: "Contraindicados", en: "Contraindicated" },
  "bio.snot": { es: "SNOT-22", en: "SNOT-22" },
  "bio.snot.missing": { es: "Active la sección SNOT-22 para usar este criterio.", en: "Switch on the SNOT-22 section to use this criterion." },
  "bio.smell": { es: "Olfato", en: "Smell" },
  "bio.anosmia": { es: "Anosmia en una prueba olfatoria", en: "Anosmic on a smell test" },
  "bio.smellTest": { es: "Prueba", en: "Test" },
  "bio.smellScore": { es: "Puntuación", en: "Score" },
  "bio.smellTest.none": { es: "Sin especificar", en: "Not specified" },
  "bio.smellTest.sniffin": { es: "Sniffin' Sticks", en: "Sniffin' Sticks" },
  "bio.smellTest.bast24": { es: "BAST-24", en: "BAST-24" },
  "bio.smellTest.upsit": { es: "UPSIT", en: "UPSIT" },
  "bio.smellTest.other": { es: "Otra", en: "Other" },
  "bio.asthma": { es: "Asma con corticoide inhalado regular", en: "Asthma on regular inhaled corticosteroids" },
  "bio.result": { es: "{0} de 5 criterios (se necesitan {1})", en: "{0} of 5 criteria ({1} needed)" },
  "bio.meets": { es: "Cumple los criterios publicados", en: "Meets the published criteria" },
  "bio.not_meets": { es: "No cumple los criterios publicados", en: "Does not meet the published criteria" },
  "bio.no_bilateral": { es: "Los criterios se aplican a pólipos bilaterales.", en: "The criteria apply to bilateral polyps." },

  // Response
  "resp.timepoint": { es: "Momento de la valoración", en: "Evaluation time" },
  "resp.timepoint.6m": { es: "6 meses", en: "6 months" },
  "resp.timepoint.12m": { es: "1 año", en: "1 year" },
  "resp.timepoint.annual": { es: "Revisión anual", en: "Yearly review" },
  "resp.biologic": { es: "Biológico", en: "Biologic" },
  "resp.biologic.dupilumab": { es: "Dupilumab", en: "Dupilumab" },
  "resp.biologic.omalizumab": { es: "Omalizumab", en: "Omalizumab" },
  "resp.biologic.mepolizumab": { es: "Mepolizumab", en: "Mepolizumab" },
  "resp.biologic.other": { es: "Otro", en: "Other" },
  "resp.baseline": { es: "Valoración basal (misma etiqueta)", en: "Baseline assessment (same label)" },
  "resp.baseline.none": { es: "Sin basal", en: "No baseline" },
  "resp.baseline.need_label": { es: "Escriba la etiqueta para elegir una valoración basal.", en: "Type the label to choose a baseline assessment." },
  "resp.baseline.empty": { es: "No hay valoraciones anteriores con esta etiqueta.", en: "No earlier assessments with this label." },
  "resp.delta": { es: "Cambio frente a la basal", en: "Change from baseline" },
  "resp.delta.na": { es: "sin datos para comparar", en: "no data to compare" },
  "resp.comorb.improved": { es: "Sí", en: "Yes" },
  "resp.comorb.not_improved": { es: "No", en: "No" },
  "resp.comorb.none": { es: "No tiene", en: "None" },
  "resp.result": { es: "{0} de {1} criterios", en: "{0} of {1} criteria" },
  "resp.level.none": { es: "Sin respuesta", en: "No response" },
  "resp.level.poor_moderate": { es: "Respuesta pobre-moderada", en: "Poor to moderate response" },
  "resp.level.good_excellent": { es: "Respuesta buena-excelente", en: "Good to excellent response" },

  // Control
  "control.level.controlled": { es: "Controlada", en: "Controlled" },
  "control.level.partly": { es: "Parcialmente controlada", en: "Partly controlled" },
  "control.level.uncontrolled": { es: "No controlada", en: "Uncontrolled" },
  "control.result": { es: "{0} de 7 presentes", en: "{0} of 7 present" },

  // Inbox / list
  "list.edit": { es: "Editar", en: "Edit" },
  "list.print": { es: "Imprimir", en: "Print" },
  "list.followup": { es: "Evolución", en: "Follow-up" },
  "list.delete": { es: "Eliminar", en: "Delete" },
  "list.confirm_delete": { es: "¿Eliminar esta valoración? No se puede deshacer.", en: "Delete this assessment? This cannot be undone." },
  "list.no_label": { es: "Sin etiqueta", en: "No label" },
  "list.loading": { es: "Cargando…", en: "Loading…" },
  "list.error": { es: "Ha ocurrido un error.", en: "Something went wrong." },
  "list.filter": { es: "Filtrar por etiqueta", en: "Filter by label" },

  // Follow-up
  "follow.title": { es: "Evolución", en: "Follow-up" },
  "follow.subtitle": { es: "Valoraciones de rinología y SNOT-22 de Quest con la etiqueta «{0}».", en: "Rhinology assessments and Quest SNOT-22 with the label “{0}”." },
  "follow.chart": { es: "Puntuaciones en el tiempo", en: "Scores over time" },
  "follow.table": { es: "Valoraciones", en: "Assessments" },
  "follow.date": { es: "Fecha", en: "Date" },
  "follow.empty": { es: "No hay valoraciones con esta etiqueta.", en: "No assessments with this label." },
  "follow.snot_quest": { es: "SNOT-22 (Quest)", en: "SNOT-22 (Quest)" },
  "follow.choose": { es: "Elija un paciente", en: "Choose a patient" },

  // Report
  "report.title": { es: "Informe de escalas de rinología", en: "Rhinology scales report" },
  "report.date": { es: "Fecha de la exploración", en: "Examination date" },
  "report.label": { es: "Etiqueta", en: "Label" },
  "report.back": { es: "Volver", en: "Back" },
  "report.print": { es: "Imprimir", en: "Print" },
  "report.item": { es: "Elemento", en: "Item" },
  "report.not_available": { es: "Valoración no disponible.", en: "Assessment not available." },
  "report.footer": {
    es: "Puntuaciones calculadas por ENT Senses Scales según las publicaciones citadas. No es un diagnóstico.",
    en: "Scores computed by ENT Senses Scales following the cited publications. Not a diagnosis.",
  },
};

export const useLang = createModuleLang(SCALES_DICT);
