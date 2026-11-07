# ENT Senses

**ENT Senses** (`entsenses.app`) reúne en una sola aplicación las herramientas de
otorrinolaringología de Juan Pablo García Arteaga: **una cuenta, una base de datos, una bandeja**.
Ver [`PLAN.md`](PLAN.md).

| Módulo | Qué hace | Estado |
|---|---|---|
| **Hearing** | Informes audiométricos (audiograma, impedanciometría, logoaudiometría) con el motor de AudiometricReport; prueba auditiva informativa del paciente (fase 8); audiometría tonal en consulta (fases 2–6, [`docs/hearing/PLAN.md`](docs/hearing/PLAN.md)) | Activo |
| **Quest** | Cuestionarios clínicos validados, QR, hoja imprimible, invitaciones por correo | Etapa B |
| **Voice** | Análisis acústico de la voz en el navegador | Etapa C |
| **Scales**, **Tinnitus** | — | Futuro |

## Principios

- Los pacientes **no dan su nombre**: los resultados llegan anónimos y el médico los identifica
  con una **etiqueta**. Los datos identificativos que se escriben para imprimir un informe **no se
  guardan**.
- Cada módulo vive en `src/modules/<módulo>/`, con sus tablas y sus textos. El registro de módulos
  (`src/modules/registry.ts`) construye el panel, la cabecera, las pestañas de la bandeja y los QR.
- ENT Senses **no es un producto sanitario con marcado CE**.

## Puesta en marcha

```bash
npm ci
cp .env.example .env   # VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

**Base de datos (proyecto Supabase nuevo):** pegar **`supabase/setup.sql`** completo en
SQL Editor → New query → Run. Es la suma, en orden, de `supabase/migrations/` (esquemas de Quest,
Voice y Hearing). Tras añadir una migración: `npm run db:setup`.

**Netlify:** sitio conectado a este repositorio con las variables `VITE_SUPABASE_URL` y
`VITE_SUPABASE_PUBLISHABLE_KEY` (`netlify.toml` y la función `keepalive` ya están configurados).

## Comprobaciones

```bash
npm run build   # typecheck + build
npm test        # RLS de los tres módulos sobre Postgres en memoria (PGlite) + setup.sql
```
