# ENT Senses — Plan de proyecto

> **ENT Senses** (`entsenses.app`): una sola aplicación para otorrinolaringología que reúne las
> herramientas de Juan Pablo García Arteaga (Huelva) en **módulos**, con **una sola cuenta**,
> **una sola base de datos** y **una sola bandeja**.
>
> ORL es la especialidad de los sentidos —oído, equilibrio, olfato, gusto— y de la voz: de ahí el
> nombre (ENT + senses).

---

## 1. Módulos

| Módulo | Origen | Qué hace | Estado |
|---|---|---|---|
| **ENT Senses Quest** | ENT Quest | Cuestionarios clínicos validados (SNOT-22, VHI, EAT-10…): QR, hoja imprimible, invitaciones por correo, rellenar en consulta | Hecho (etapa B) |
| **ENT Senses Voice** | Vocalyzer | Análisis acústico de la voz en el navegador (AVQI, CPPS, jitter, shimmer…), estimación GRBAS/CAPE-V | Hecho (etapa C) |
| **ENT Senses Hearing** | Auditone Test + AudiometricReport | Informes audiométricos (audiograma, impedanciometría, logoaudiometría); prueba auditiva informativa del paciente; audiometría tonal en consulta | Hecho (etapa A); fases 2–8 de su plan |
| **ENT Senses Scales** | — | Escalas clínicas (por definir) | Futuro |
| **ENT Senses Tinnitus** | — | Evaluación de acúfenos (por definir) | Futuro |

El plan técnico y regulatorio del módulo Hearing (audiometría calibrada, normas IEC/ISO, Clase IIa)
está en [`docs/hearing/PLAN.md`](docs/hearing/PLAN.md).

## 2. Principios

1. **Una cuenta para todo**: el médico entra una vez y ve todos sus módulos.
2. **Privacidad por diseño** (heredada de las tres apps): los pacientes nunca dan su nombre; los
   resultados llegan anónimos y el médico los identifica con una **etiqueta** (iniciales o nº de
   historia). Los datos identificativos que se escriben para imprimir un informe no se guardan.
3. **Módulos separados por dentro**: cada módulo tiene su carpeta, sus tablas y sus textos. Así,
   un módulo (p. ej. el audiómetro de Hearing) puede certificarse algún día como producto sanitario
   sin arrastrar al resto (MDCG 2019-11 permite certificar módulos de una suite si están
   delimitados).
4. **Lo común se hace una vez**: acceso, panel, bandeja, invitaciones, QR, configuración y textos
   legales.

## 3. Arquitectura

- **Stack**: React 19 + Vite + TypeScript + TanStack Router (rutas por archivos) + Tailwind 4 +
  shadcn/ui; **Supabase** (Auth, Postgres con RLS, Realtime) en la UE; **Netlify**.
- **Estructura**:

```
src/
  components/        núcleo: cabecera, marca, legales, QR, ui/ (shadcn)
  lib/               núcleo: supabase, i18n, perfil, enlaces
  modules/
    registry.ts      lista de módulos (nombre, icono, ruta, estado)
    hearing/         motor de AudiometricReport, editor de informes, sesiones
    quest/           cuestionarios, puntuaciones, invitaciones
    voice/           análisis acústico (Web Worker), protocolo, informe
  routes/
    panel, bandeja (pestañas por módulo), invitaciones, configuracion
    hearing.*, quest.*, voice.*          (área del médico)
    p.$doctorId.<módulo>…, i.$token       (área del paciente)
supabase/migrations/  esquema completo (las migraciones de las tres apps + las de la suite)
docs/                 planes por módulo y documentación regulatoria
```

- **Textos (i18n, ES/EN)**: un diccionario del núcleo y uno por módulo; cada módulo consulta
  primero el suyo y después el del núcleo.
- **Base de datos (proyecto Supabase nuevo `entsenses`)**: cada módulo conserva sus tablas
  (`patient_responses` de Quest, `voice_results` de Voice, `audiometry_sessions` de Hearing) y
  comparten `doctor_profiles` y `patient_invitations`.

## 4. Etapas

| Etapa | Contenido | Entregable |
|---|---|---|
| **A. Núcleo + Hearing** | Repositorio `entsenses` desde Auditone: marca ENT Senses, panel con tarjetas de módulos, bandeja con pestañas, registro de módulos, Hearing como primer módulo | App funcionando con Hearing |
| **B. Quest** | Cuestionarios, catálogo, hoja imprimible, invitaciones por correo (Gmail / app de correo / copiar / compartir), puntuaciones | Quest dentro de la suite |
| **C. Voice** | Protocolo y análisis acústico, evaluación en consulta, informe, valoración perceptual | Voice dentro de la suite |
| **D. Legal y puesta en marcha** | Términos y privacidad comunes con la finalidad de cada módulo; proyecto Supabase `entsenses`, sitio Netlify `entsenses`, dominio `entsenses.app` | Suite publicada |
| **E. Transición** | Exportar/importar datos útiles de ENT Quest y Vocalyzer si los hay; redirigir `entquest.app` y `vocalyzer.app` a `entsenses.app`; pausar los proyectos antiguos | Una sola app |
| **F. Hearing fases 2–8** | Motor de tonos, calibración, audiómetro manual y automático, enmascaramiento, prueba del paciente | Ver `docs/hearing/PLAN.md` |

## 5. Puesta en marcha (etapa D)

- **Supabase**: el plan gratuito permite **2 proyectos activos** (hoy: `entquest` y `vocalyzer`).
  Para crear `entsenses` hay que **pausar uno** (recomendado: `vocalyzer`, casi sin datos; un
  proyecto pausado se puede restaurar durante 90 días) o pasar a Pro.
- **Netlify**: sitio nuevo `entsenses` conectado a este repositorio; variables
  `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`; dominio `entsenses.app`.
- **Dominio**: comprobar disponibilidad de `entsenses.app` (y opcionalmente `entsenses.tools` como
  redirección) y buscar marcas parecidas en TMview / OEPM antes de registrarlo.

## 6. Pendiente de decidir

- Si hay datos reales en ENT Quest o Vocalyzer que deban trasladarse (etapa E).
- Contenido de los módulos Scales y Tinnitus.
