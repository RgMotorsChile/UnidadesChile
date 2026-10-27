# Unidades Chile Automotriz

Sitio de Unidades Chile Automotriz. Catálogo, ficha, consigna, financiamiento, novedades, comparador, contacto y administración. El paquete npm se llama `unidades-chile` (versión `1.0.0`). El sitio público es [www.unidadeschile.cl](https://www.unidadeschile.cl/).

## Autor y desarrollador

**Mathias Jara** ([GitHub @MathiasAlejandr0](https://github.com/MathiasAlejandr0)), desarrollador full-stack, Chile. Diseñó y desarrolló el proyecto completo (2026).

- [AUTHORS.md](AUTHORS.md)
- [LICENSE](LICENSE)
- [CITATION.cff](CITATION.cff)
- [docs/autoria/DOSSIER.md](docs/autoria/DOSSIER.md)

## Copyright

© 2026 Mathias Jara. Todos los derechos reservados.

Las condiciones de uso, copia, modificación y distribución están en [LICENSE](LICENSE).

## Sello de fecha

En `docs/autoria/` está el sello OpenTimestamps del `git archive` del commit `3d8c0fdf178340581e721ecc54792d0c20a37bb1`:

`docs/autoria/unidadeschile-3d8c0fdf178340581e721ecc54792d0c20a37bb1.tar.gz.ots`

Los hashes de ese archivo y de `src/App.tsx` están en [docs/autoria/source-sha256.txt](docs/autoria/source-sha256.txt). El detalle del sello y la verificación están en [docs/autoria/DOSSIER.md](docs/autoria/DOSSIER.md).

## Stack

Declarado en `package.json` (`private: true`):

- React y React DOM `^19.2.8`
- React Router `^7.18.3`
- Vite `^8.2.2` y `@vitejs/plugin-react` `^6.1.1`
- TypeScript `^7.0.2` (`npm run build` corre `tsc --noEmit` antes de `vite build`)
- Tailwind CSS `^4.3.3` con `@tailwindcss/vite` `^4.3.3`
- `@supabase/supabase-js` `^2.117.0`
- `lucide-react` `^1.39.0`
- `sharp` `^0.35.5` (procesamiento de imágenes en `server/images.mjs`)
- Pruebas: `node --test`, Playwright `^1.64.1` y `@axe-core/playwright` `^4.14.0`

`vite.config.ts` carga React, Tailwind y el plugin SEO de `vite.seo-plugin.mjs`. El alias `@shared` apunta a `shared/`.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `src/pages` | Páginas públicas: inicio, inventario, ficha, consigna, financiamiento, nosotros, novedades, comparador, contacto y textos legales |
| `src/components` | Cabecera, pie, navegación móvil, chat, cookies, ficha de auto, comparador, favoritos y leads |
| `src/admin` | Login, inventario y editor, medios, vendidos, CRM, analítica, novedades y acceso |
| `src/lib` | Cliente Supabase, catálogo, fotos, leads, consigna, Autofin, formato y metadatos |
| `src/store` | Datos del catálogo, sesión de administración y almacenamiento local |
| `src/data/cars.ts` | Datos de vehículos usados por el front |
| `api/` | Función única de Vercel (`api/[[...route]].ts`, runtime `nodejs`) |
| `api/admin/` | Login, logout, fotos, venta, sincronización, vehículos, medios y sesión |
| `shared/` | Ruta de la función, catálogo, HTML, imágenes, patentes y presentación pública del vehículo |
| `server/` | Imágenes y compuerta SEO del entorno local |
| `scripts/` | Revisión de imágenes, compresión de stock, importación de la hoja de stock y exportación hacia Supabase |
| `e2e/public.spec.js` | Prueba de extremo a extremo con Playwright y axe-core |
| `supabase/migrations/` | `20261022120000_vehicle_photo_orphans.sql` |
| `public/` | Logos, favicon, manifiesto, imagen Open Graph y fotos en `public/cars/stock` |
| `docs/` | Nota de DNS de correo (`docs/dns-correo-unidadeschile.md`) y la carpeta `docs/autoria/` |

Rutas públicas en `src/App.tsx`: `/`, `/catalogo`, `/catalogo/:id`, `/consigna-tu-vehiculo`, `/financia`, `/nosotros`, `/novedades`, `/novedades/:slug`, `/comparador`, `/contacto`, `/privacidad`, `/terminos`, `/cookies`, `/aviso-credito` y `/condiciones-reserva`. El panel está bajo `/admin` (login, inventario, medios, vendidos, CRM, analítica, telemetría y configuración de novedades y acceso).

## Cómo correr en local

El workflow de CI usa Node.js 22 (`.github/workflows/ci.yml`).

```sh
npm ci
cp .env.example .env
npm run dev
```

`.env` está en `.gitignore`. Los nombres van en la sección de variables; los valores quedan en el entorno local o en Vercel.

`npm run dev` ejecuta `vite`. `vite.config.ts` no fija puerto.

```sh
npm run build
npm run preview
npm test
npm run check:images
npm run test:e2e
```

`npm run test:e2e` ejecuta Playwright. `playwright.config.js` levanta `npm run build && npm run preview` en `http://127.0.0.1:4173`.

## Variables de entorno

Solo nombres. La plantilla está en `.env.example`.

El cliente Vite las declara en `src/vite-env.d.ts`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_ADMIN_USER`
- `VITE_ADMIN_PASSWORD_HASH`

El servidor las lee en `api/` (varias también figuran en `.env.example`):

- `SUPABASE_URL` (si falta, se usa `VITE_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_USER`
- `ADMIN_PASSWORD_HASH`
- `CRON_SECRET`
- `RESEND_API_KEY`
- `CONSIGNA_TO`
- `CONSIGNA_FROM`
- `UC_CATALOG_WRITE_URL`
- `UC_SYNC_URL`

Vercel define `VERCEL` y `VERCEL_URL`. Las fotos usan el bucket público `vehicle-photos` con `SUPABASE_URL` o `VITE_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

## Scripts

| Script | Qué hace |
| --- | --- |
| `dev` | `vite` |
| `build` | `tsc --noEmit && vite build` |
| `preview` | `vite preview` |
| `test` | `node --experimental-strip-types --test` sobre `api/admin/_media.test.js`, `api/admin/_sheetRemoval.test.js`, `shared/vehiclePublic.test.mjs` y `shared/vercelFunctions.test.mjs` |
| `check:images` | `scripts/check-images.mjs`: compara `shared/local-catalog.json` con `src/data/cars.ts` y comprueba que las fotos locales existan |
| `test:e2e` | `playwright test` |

En `scripts/`, fuera de `package.json`:

- `export-cars-for-supabase.mjs` escribe `scratch/cars-export.json` a partir de `src/data/cars.ts`.
- `import-stock-uc.py` importa la hoja UNIDADES CHILE hacia `src/data/cars.ts`, con fotos de `public/cars/stock`.
- `compress-stock.py` comprime las fotos de `public/cars/stock` con Pillow.

CI, en cada push y pull request: `npm ci`, `npm test`, `npm run check:images`, Semgrep (`p/javascript` y `p/typescript`, severidades ERROR y WARNING) y `npm run test:e2e` con Chromium.

## Despliegue en Vercel

`vercel.json` fija `"framework": "vite"`.

Reescrituras:

- `/` → `/api/html`
- `/sitemap.xml` → `/api/sitemap`
- el resto del sitio, fuera de `api/` y de los estáticos de imágenes, logos y favicon → `/api/html?path=:path`

`api/[[...route]].ts` concentra los handlers en una función de runtime `nodejs`. El comentario del archivo indica que el plan Hobby corta el deploy en la función número 13. Las claves que atiende `shared/apiRoute.mjs` son `catalog-index`, `consigna`, `contacto`, `html`, `img`, `og-image`, `sheet-plates`, `sitemap`, `admin/login`, `admin/logout`, `admin/photos`, `admin/sell`, `admin/sync` y `admin/vehicles`.

`.vercelignore` deja fuera `node_modules`, `dist`, `.cache`, `scripts` y `.git`.

## Supabase

El cliente del navegador está en `src/lib/supabase.ts`. El tenant del código es `unidades-chile`.

Tablas que consulta este repositorio:

- `tenants`
- `catalog_vehicles`
- `vehicle_photo_orphans`

El login de administración (`api/admin/_login.ts`) usa Supabase Auth y la RPC `uc_admin_session_create`. `api/admin/_auth.js` describe la sesión de servidor para un admin del tenant en `tenant_members`.

Las fotos de catálogo van al bucket público `vehicle-photos`. La migración documenta el path `<tenant_slug>/<vehicle_slug>/<sha256>.<ext>`, con prefijo `unidades-chile/`. `supabase/migrations/20261022120000_vehicle_photo_orphans.sql` crea `public.vehicle_photo_orphans` para los borrados de Storage que fallaron: activa RLS, revoca el acceso de `public`, `anon` y `authenticated`, y concede permisos a `service_role`. El comentario de esa migración deja el reintento de huérfanos en el job de RgMotorsChileWeb.
