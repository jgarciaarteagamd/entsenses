# ENT Senses Scales — Plan del módulo

> **Scales** reúne las **escalas que puntúa el médico** en la consulta: hallazgos endoscópicos, de
> imagen, de exploración y estadiajes. Complementa a **Quest** (cuestionarios que responde el
> paciente) y usa sus datos: el SNOT-22 de Quest, el audiograma de Hearing y los parámetros
> acústicos de Voice.
>
> Este documento es un plan de trabajo. Las definiciones de cada escala deben comprobarse contra
> la publicación original antes de activarla (columna «Verificada» del catálogo).

> **Estado (noviembre 2026):** fase 1 (núcleo del módulo + **paquete de Rinología**) hecha. Siguiente:
> fase 2 (Laringe y deglución).

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
| `pack`, `pack_version` | Paquete (`rhinology`) y versión de sus definiciones (`rhinology-1`) |
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
| `/scales/evolucion?label=` | Evolución de un paciente: gráfica (NPS, Lund-Kennedy modificada, Lund-Mackay, SNOT-22) y tabla |
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

### 3.2 Laringe y deglución (fase 2)

| Escala | Qué mide | Referencia | Estado |
|---|---|---|---|
| **Reflux Finding Score (RFS)** | 8 hallazgos laríngeos, 0–26 (>7 sugiere reflujo laringofaríngeo) | Belafsky PC, et al. *Laryngoscope* 2001 🔍 | ⏳ |
| **Edema de Reinke (Yonekawa)** | Tipos I–III según extensión del edema | Yonekawa H, 1988 🔍 (definiciones exactas pendientes) | ⏳ |
| Leucoplasia laríngea (Ni, NBI) | Tipos I–V del patrón vascular | Ni XG, et al. 2011 🔍 | ⏳ |
| Patrón vascular (ELS 2016) | Longitudinal / perpendicular | Arens C, et al. 2016 🔍 | ⏳ |
| Myer-Cotton | Estenosis subglótica, grados I–IV por % de obstrucción | Myer CM, et al. 1994 🔍 | ⏳ |
| Penetration-Aspiration Scale | FEES/VFSS, 1–8 | Rosenbek JC, et al. 1996 🔍 | ⏳ |
| Yale Pharyngeal Residue | Vallécula y senos piriformes, 1–5 | Neubauer PD, et al. 2015 🔍 | ⏳ |
| FOIS | Ingesta oral funcional, 1–7 | Crary MA, et al. 2005 🔍 | ⏳ |
| Murray (secreciones) | 0–3 | Murray J, et al. 1996 🔍 | ⏳ |

Con **Voice**: el registro de Reinke mostrará al lado el último análisis acústico de la misma etiqueta
(F0, AVQI, CPPS) para comparar antes y después de la cirugía, y los paquetes-año.

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
| **2** | Laringe y deglución (RFS, Reinke, leucoplasia, FEES) + enlace con Voice | Siguiente |
| **3** | Otología (House-Brackmann, Sunnybrook, Ménière desde Hearing…) | — |
| **4** | Sueño y orofaringe | — |
| **5** | Dibujos esquemáticos por grado, exportación CSV para investigación | — |

## 5. Pruebas

- `tests/scales.rhinology.test.ts`: cada escala con casos límite (mínimos, máximos, umbrales
  exactos de los criterios).
- `tests/scales.rls.test.ts`: sin acceso anónimo; cada médico solo lo suyo; límites de tamaño.
