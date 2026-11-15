# ENT Senses Scales — Plan del módulo

> **Scales** reúne las **escalas que puntúa el médico** en la consulta: hallazgos endoscópicos, de
> imagen, de exploración y estadiajes. Complementa a **Quest** (cuestionarios que responde el
> paciente) y usa sus datos: el SNOT-22 de Quest, el audiograma de Hearing y los parámetros
> acústicos de Voice.
>
> Este documento es un plan de trabajo. Las definiciones de cada escala deben comprobarse contra
> la publicación original antes de activarla (columna «Verificada» del catálogo).

> **Estado (noviembre 2026):** fases 1 (núcleo + **Rinología**) y 2 (**Laringe y deglución**) hechas.
> Siguiente: fase 3 (Otología).

---

## 1. Qué es y qué no es

- **Es** una herramienta de registro y cálculo: el médico elige el grado que observa, la app suma,
  aplica las reglas publicadas (por ejemplo, «≥3 de 5 criterios») y guarda el resultado con la
  **etiqueta** del paciente para seguir su evolución.
- **No** interpreta imágenes ni hace diagnósticos. No añade umbrales propios: solo los de la
  publicación citada, que se muestra junto a cada escala.
- Mismo principio de privacidad que el resto de la suite: **sin nombres**, solo una etiqueta
  (iniciales o nº de historia) y **sin texto libre** en los registros.
- Posicionamiento regulatorio: igual que Quest, herramienta de consulta (cálculo de puntuaciones
  publicadas), no producto sanitario con marcado CE. Las escalas que derivan una **indicación de
  tratamiento** (criterios EPOS/EUFOREA de biológicos) muestran el resultado como «cumple / no
  cumple los criterios publicados», nunca como recomendación.

## 2. Diseño

### 2.1 Paquetes

Las escalas se agrupan en **paquetes** por área (Rinología, Laringe y deglución, Otología…). Una
**valoración** es una visita: el médico abre el paquete, activa las escalas que ha explorado ese día
y guarda una sola fila. Así una endoscopia (NPS + Lund-Kennedy), un TC (Lund-Mackay) y la decisión
sobre un biológico quedan juntos, con la misma fecha y etiqueta.

### 2.2 Datos (`public.scale_assessments`)

| Columna | Contenido |
|---|---|
| `doctor_id` | Médico propietario (RLS: cada médico solo ve, crea, edita y borra lo suyo) |
| `assessed_on` | Fecha de la exploración (puede ser anterior a hoy, para registrar una basal) |
| `label` | Etiqueta del paciente (≤60 caracteres) |
| `pack`, `pack_version` | Paquete (`rhinology`, `larynx`) y versión de sus definiciones (`rhinology-1`, `larynx-1`) |
| `scales` | Lo que el médico marcó, por escala (jsonb, <20 kB) |
| `summary` | Puntuaciones y categorías calculadas, para listar y dibujar la evolución sin recalcular (jsonb, <10 kB) |

- **Sin acceso anónimo**: el paciente no envía nada a Scales.
- Las definiciones y el cálculo viven en TypeScript puro (`src/modules/scales/lib/`), con pruebas
  unitarias. Si una definición cambia, sube `pack_version` y las filas antiguas conservan la suya.

### 2.3 Pantallas

| Ruta | Qué hace |
|---|---|
| `/scales` | Catálogo por áreas (activas y previstas), últimas valoraciones, buscar por etiqueta |
| `/scales/rinologia` | Nueva valoración (o edición con `?id=`): escalas activables, cálculo en vivo, SNOT-22 desde Quest |
| `/scales/laringe` | Ídem para laringe y deglución, con el análisis de Voice de la misma etiqueta |
| `/scales/evolucion?label=&pack=` | Evolución de un paciente por paquete: gráficas (NPS, Lund-Kennedy, Lund-Mackay, SNOT-22 · RFS, AVQI, Reinke, PAS, FOIS, Murray) y tabla |
| `/scales/informe/$id` | Informe A4 imprimible con las escalas y sus referencias |
| Bandeja → pestaña Scales | Lista de valoraciones con sus puntuaciones principales |

## 3. Catálogo

Leyenda: ✅ hecha · ⏳ prevista · 🔍 hay que comprobar la definición en la publicación original.

### 3.1 Rinología (fase 1, hecha)

| Escala | Qué mide | Rango | Referencia | Estado |
|---|---|---|---|---|
| **Nasal Polyp Score (NPS)** | Tamaño endoscópico de los pólipos por fosa | 0–4 por lado, 0–8 | Gevaert P, et al. *J Allergy Clin Immunol* 2013;131:110-6. [10.1016/j.jaci.2012.07.047](https://doi.org/10.1016/j.jaci.2012.07.047) | ✅ |
| **Lund-Kennedy** | Endoscopia: pólipos, edema, secreción, cicatriz, costras | 0–10 por lado, 0–20 | Lund VJ, Kennedy DW. *Otolaryngol Head Neck Surg* 1997;117:S35-40. [10.1016/S0194-59989770005-6](https://doi.org/10.1016/S0194-59989770005-6) | ✅ |
| **Lund-Kennedy modificada** | Solo pólipos, edema y secreción (se calcula de la anterior) | 0–6 por lado, 0–12 | Psaltis AJ, et al. *Laryngoscope* 2014;124:2216-23. [10.1002/lary.24654](https://doi.org/10.1002/lary.24654) | ✅ |
| **Lund-Mackay** | TC: 5 senos (0/1/2) + complejo ostiomeatal (0/2) | 0–12 por lado, 0–24 | Lund VJ, Mackay IS. *Rhinology* 1993;31:183-4 (PMID 8140385) | ✅ |
| **Control de la RSC (EPOS 2020)** | 7 elementos del último mes / 6 meses | Controlada (0) · parcialmente (1–2) · no controlada (≥3) | Fokkens WJ, et al. *Rhinology* 2020;58(Suppl 29):1-464. [10.4193/Rhin20.600](https://doi.org/10.4193/Rhin20.600) | ✅ |
| **Indicación de biológico (EPOS/EUFOREA 2023)** | Pólipos bilaterales + ≥3 de 5 criterios (≥4 sin cirugía previa) | n/5 | Fokkens WJ, et al. *Rhinology* 2023;61:194-202. [10.4193/Rhin22.489](https://doi.org/10.4193/Rhin22.489) | ✅ |
| **Respuesta al biológico (EPOS/EUFOREA 2023)** | 5 criterios a los 6 meses, al año y después cada año | Sin respuesta (0) · pobre-moderada (1–3) · buena-excelente (4–5) | Ídem | ✅ |
| Sniffin' Sticks (TDI) con normas por edad | Olfatometría | 1–48 | Oleszkiewicz A, et al. 2019 🔍 | ⏳ |
| Mladina | Tipos de desviación septal | 1–7 | 🔍 | ⏳ |
| Hipertrofia adenoidea endoscópica | Grado de obstrucción coanal | 1–4 | 🔍 | ⏳ |

**Detalles de la implementación (rinología):**

- **Criterios de biológico (2023):** inflamación tipo 2 (eosinófilos en tejido ≥10/campo de gran
  aumento, **eosinófilos en sangre ≥150/µL** —antes ≥250— o IgE total ≥100 UI/mL); necesidad de
  corticoides sistémicos o contraindicación (≥2 ciclos al año o tratamiento prolongado >3 meses a
  dosis baja); SNOT-22 ≥40; anosmia en una prueba olfatoria; asma comórbida (que requiere
  corticoide inhalado regular). Sin cirugía previa, el consenso EUFOREA previo exige ≥4.
- **SNOT-22:** se puede escribir a mano o **traer desde Quest** (última respuesta con la misma
  etiqueta). En la respuesta al biológico se muestra el cambio frente a la basal y la diferencia
  mínima importante de 8,9 puntos (Hopkins C, et al. *Clin Otolaryngol* 2009;34:447-54,
  [10.1111/j.1749-4486.2009.01995.x](https://doi.org/10.1111/j.1749-4486.2009.01995.x)) como
  referencia, sin marcar el criterio automáticamente.
- **Respuesta al biológico:** el criterio «menor impacto de las comorbilidades» solo cuenta si el
  paciente las tiene; la menor necesidad de cirugía cuenta como menor necesidad de corticoides
  (ambas son tratamiento de rescate).

### 3.2 Laringe y deglución (fase 2, hecha)

| Escala | Qué mide | Rango | Referencia | Estado |
|---|---|---|---|---|
| **Reflux Finding Score (RFS)** | 8 hallazgos laríngeos | 0–26; en el original, >7 se asoció a reflujo laringofaríngeo (95 % de certeza) | Belafsky PC, et al. *Laryngoscope* 2001;111:1313-7. [10.1097/00005537-200108000-00001](https://doi.org/10.1097/00005537-200108000-00001) | ✅ |
| **Edema de Reinke (Tan)** | Grado por cuerda según la luz glótica ocupada; grado 4 en una cuerda = la otra no se gradúa | 1–4 | Tan M, et al. *Laryngoscope* 2017;127:2310-3. [10.1002/lary.26647](https://doi.org/10.1002/lary.26647) | ✅ |
| **NBI: Ni 2011** | Tipo de asas capilares intraepiteliales | I, II, III, IV, Va, Vb, Vc | Ni XG, et al. *J Laryngol Otol* 2011;125:288-96. [10.1017/S0022215110002033](https://doi.org/10.1017/S0022215110002033) | ✅ (descriptiva) |
| **NBI: ELS 2016** | Cambios vasculares | Sin cambios · longitudinales · perpendiculares | Arens C, et al. *Eur Arch Otorhinolaryngol* 2016;273:1207-14. [10.1007/s00405-015-3851-y](https://doi.org/10.1007/s00405-015-3851-y) | ✅ (descriptiva) |
| **Myer-Cotton** | % de obstrucción subglótica | I ≤50 % · II 51–70 % · III >70 % con luz · IV sin luz | Myer CM, et al. *Ann Otol Rhinol Laryngol* 1994;103:319-23. [10.1177/000348949410300410](https://doi.org/10.1177/000348949410300410) | ✅ |
| **Murray (secreciones)** | Secreciones en la FEES antes de dar alimento | 0–3 | Murray J, et al. *Dysphagia* 1996;11:99-103. [10.1007/BF00417898](https://doi.org/10.1007/BF00417898) | ✅ |
| **Penetration-Aspiration Scale** | Por consistencia (IDDSI 0, 2–3, 4, 7); se guarda la peor | 1–8 (penetración 2–5, aspiración 6–8) | Rosenbek JC, et al. *Dysphagia* 1996;11:93-8. [10.1007/BF00417897](https://doi.org/10.1007/BF00417897) | ✅ |
| **Yale (residuo faríngeo)** | Vallécula y senos piriformes, por consistencia | 1–5 | Neubauer PD, et al. *Dysphagia* 2015;30:521-8. [10.1007/s00455-015-9631-4](https://doi.org/10.1007/s00455-015-9631-4) | ✅ |
| **FOIS** | Ingesta oral funcional | 1–7 | Crary MA, et al. *Arch Phys Med Rehabil* 2005;86:1516-20. [10.1016/j.apmr.2004.11.049](https://doi.org/10.1016/j.apmr.2004.11.049) | ✅ |
| Yonekawa (Reinke) | Tipos I–III | — | Yonekawa H. *Auris Nasus Larynx* 1988;15:57-78. [10.1016/s0385-8146(88)80010-5](https://doi.org/10.1016/s0385-8146(88)80010-5) | 🔍 no incluida |

**Decisiones de la fase 2:**

- **Reinke: Tan en lugar de Yonekawa.** Las definiciones de los tipos de Yonekawa no figuran en el resumen
  del original y las fuentes que la citan la describen de forma distinta (unas por extensión a lo largo de la
  cuerda, otras por morfología). Tan et al. tienen definiciones cuantitativas y fiabilidad publicada. Si se
  consigue el texto original de Yonekawa, puede añadirse como segunda clasificación.
- **Ni y ELS son descriptivas:** se guarda la categoría elegida, sin etiqueta de benignidad/malignidad. El tipo
  IV de Ni se acompaña de una advertencia: en una serie de 674 lesiones incluyó un 36 % de displasias
  (Staníková L, et al. *Front Oncol* 2024;14:1222827, [10.3389/fonc.2024.1222827](https://doi.org/10.3389/fonc.2024.1222827)).
  🔍 La redacción del tipo Va procede de revisiones que reproducen la clasificación; conviene cotejarla con el original.
- **Voice:** la sección «Voz» adjunta un resumen (fecha, AVQI, CPPS, F0, TMF y G de GRBAS, del clínico si lo
  valoró o estimado si no) del análisis de Voice elegido con la misma etiqueta. Se guarda una copia del
  resumen, así que la valoración no cambia si después se borra el análisis en Voice.
- **Paquetes-año** en la sección de Reinke, como dato de contexto.

### 3.3 Otología y base de cráneo (fase 3)

| Escala | Qué mide | Estado |
|---|---|---|
| **House-Brackmann** | Parálisis facial, I–VI | ⏳ |
| **Sunnybrook** | Parálisis facial, 0–100 | ⏳ |
| Sadé / Tos | Retracción de pars tensa / pars flaccida | ⏳ |
| EAONO/JOS | Estadiaje del colesteatoma | ⏳ |
| **Ménière AAO-HNS 1995** | Estadio por la media de 0,5-1-2-3 kHz, **desde el audiograma de Hearing** | ⏳ |
| Koos | Schwannoma vestibular, I–IV | ⏳ |
| Fisch / Glasscock-Jackson | Paragangliomas | ⏳ |
| Jahrsdoerfer | Atresia aural, 0–10 | ⏳ |

### 3.4 Sueño y orofaringe (fase 4)

Brodsky (amígdalas 0–4), Friedman (estadiaje), VOTE (endoscopia del sueño inducido).

### 3.5 Cabeza y cuello (pendiente de licencia)

TNM (AJCC/UICC, 8.ª ed.): el texto de las categorías tiene derechos de autor; antes de incluirlo hay
que consultar las condiciones de uso.

## 4. Fases

| Fase | Contenido | Estado |
|---|---|---|
| **1** | Tabla y RLS, registro del módulo, pestaña de bandeja, paquete de Rinología, evolución, informe | Hecha |
| **2** | Laringe y deglución (RFS, Reinke, NBI, Myer-Cotton, FEES) + enlace con Voice | Hecha |
| **3** | Otología (House-Brackmann, Sunnybrook, Ménière desde Hearing…) | Siguiente |
| **4** | Sueño y orofaringe | — |
| **5** | Dibujos esquemáticos por grado, exportación CSV para investigación | — |

## 5. Pruebas

- `tests/scales.rhinology.test.ts` y `tests/scales.larynx.test.ts`: cada escala con casos límite
  (mínimos, máximos, umbrales exactos de los criterios).
- `tests/scales.rls.test.ts`: sin acceso anónimo; cada médico solo lo suyo; límites de tamaño.
