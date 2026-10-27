# Dossier de autoría

Constancia técnica del repositorio [RgMotorsChile/UnidadesChile](https://github.com/RgMotorsChile/UnidadesChile), armada el 2026-10-27 a partir del commit de `main` `3d8c0fdf178340581e721ecc54792d0c20a37bb1`.

No es un certificado legal. No afirma que un tribunal, un notario o un registro hayan reconocido la autoría. El sello OpenTimestamps de abajo es una prueba de existencia de unos bytes en el tiempo; al crearse seguía pendiente de confirmación en Bitcoin.

La identidad de contacto (Mathias Jara, GitHub MathiasAlejandr0, mathias.jara@hotmail.com, desarrollador full-stack, Chile) es la que el autor pidió dejar escrita. El historial de git acredita los commits de **Mathias Alejandro Jara Alvarado** con el correo `111708379+MathiasAlejandr0@users.noreply.github.com`. El correo hotmail no aparece en `git log`.

El autor declara que desarrolló este proyecto como practicante y que en este repositorio no hay un contrato de cesión de derechos. Esta frase queda registrada como su declaración.

## Proyecto

Sitio de Unidades Chile Automotriz, descrito en `README.md` como catálogo, ficha, financiamiento y administración. El `index.html` de este commit titula la página «Unidades Chile Automotriz» y apunta a `https://www.unidadeschile.cl/`. El paquete npm se llama `unidades-chile`.

En `src/components/Footer.tsx`, desde el commit `0ddc777985cd1ed524d4eadc8150ec899f059a98` (2026-10-09 16:45:23 -0300, «feat(footer): firma del desarrollador»), el pie muestra el texto «Desarrollado por Mathias Jara · Desarrollador Full Stack» y, en el mismo bloque, un enlace a `https://southsoftware.cl` con el texto «Desarrollado por South Software». Esos son los textos del fuente. Este dossier no les da otro alcance.

## Stack

Declarado en `package.json` de este commit (`version` `1.0.0`, `private: true`). Esa versión ya estaba en `1d409bee4ce93af76753346ce5547c6b24b6de5e`. No hay tags de git.

- React `^19.2.8` y React DOM `^19.2.8`
- React Router `^7.18.3`
- Vite `^8.2.2`, `@vitejs/plugin-react` `^6.1.1`
- TypeScript `^7.0.2`
- Tailwind CSS `^4.3.3` con `@tailwindcss/vite` `^4.3.3`
- `@supabase/supabase-js` `^2.117.0`
- `lucide-react` `^1.39.0`
- `sharp` `^0.35.5`
- Pruebas: `node --test`, Playwright `^1.64.1`, `@axe-core/playwright` `^4.14.0`

`vercel.json` marca el framework `vite` y reescribe el sitio hacia `/api/html` y `/sitemap.xml` hacia `/api/sitemap`. `api/[[...route]].ts` concentra los handlers en una sola función de runtime `nodejs`; el comentario del archivo dice que el plan Hobby corta el deploy en la función número 13.

## Módulos en este commit

Rutas públicas en `src/App.tsx`: `/`, `/catalogo`, `/catalogo/:id`, `/consigna-tu-vehiculo`, `/financia`, `/nosotros`, `/novedades`, `/novedades/:slug`, `/comparador`, `/contacto`, `/privacidad`, `/terminos`, `/cookies`, `/aviso-credito`, `/condiciones-reserva`, y el panel bajo `/admin`.

- `src/pages`: páginas públicas (inicio, inventario, ficha, consigna, financiamiento, nosotros, novedades, comparador, contacto, textos legales).
- `src/components`: cabecera, pie, navegación móvil, chat, cookies, ficha de auto, comparador, favoritos, leads.
- `src/admin`: login, inventario y editor de catálogo, medios, vendidos, CRM, analítica, novedades y acceso.
- `src/lib`: cliente Supabase, catálogo, fotos, leads, consigna, Autofin, formato y metadatos.
- `src/store`: datos del catálogo, sesión de administración y almacenamiento local.
- `src/data/cars.ts`: datos de vehículos usados por el front.
- `api/`: handlers de catálogo, consigna, contacto, HTML, imágenes, Open Graph, patentes, sitemap, y administración (login, logout, fotos, venta, sincronización, vehículos).
- `shared/`: ruta de la función, catálogo, despacho, HTML, imágenes, patentes y presentación pública del vehículo.
- `server/`: imágenes y compuerta SEO del entorno local.
- `scripts/`: revisión de imágenes y exportación del catálogo hacia Supabase.
- `e2e/public.spec.js`: prueba de extremo a extremo con Playwright.
- `supabase/migrations/20261022120000_vehicle_photo_orphans.sql`: migración presente en el commit. Entró en `0ca0cd3` (2026-10-21).

## Fechas del historial

El detalle de commits y líneas está en `AUTHORS.md`. Hitos leídos de `git log` sobre este `main`:

| Fecha | Commit | Qué consta en el asunto o en el archivo |
| --- | --- | --- |
| 2026-09-24 15:39:25 -0300 | `f37344ce6597a73b6d547114bdaa68807b38a590` | Primer commit, «Initial commit», autor RgMotorsChile |
| 2026-09-24 15:47:10 -0300 | `1d409bee4ce93af76753346ce5547c6b24b6de5e` | Primer commit de Mathias Alejandro Jara Alvarado: «feat: sitio Unidades Chile (www.unidadeschile.cl)». `package.json` ya declara `1.0.0` |
| 2026-09-25 | `1d30b6f` | «feat: estudio de fotos con portada y orden como RG Motors» (toca `package.json`) |
| 2026-10-09 16:45:23 -0300 | `0ddc777985cd1ed524d4eadc8150ec899f059a98` | «feat(footer): firma del desarrollador» |
| 2026-10-21 | `0ca0cd3` | «feat(admin): pasar las fotos del catálogo de Vercel Blob a Supabase Storage (#10)», incluye la migración SQL de arriba |
| 2026-10-22 15:30:14 -0300 | `3d8c0fdf178340581e721ecc54792d0c20a37bb1` | Último commit de `main`: «fix: botones rojos con texto blanco y rojo más sobrio (#15)» |

## Archivo de código fijado

`src/App.tsx` en el commit `3d8c0fdf178340581e721ecc54792d0c20a37bb1`.

| | Valor |
| --- | --- |
| Blob de git | `7d044522242f92cf6d20e4d2daa3d7f283d15cb1` |
| SHA-256 del contenido (`git cat-file blob`) | `78b7e72a3db3f8c37e17032347dc755227e5dd63b1754719b872b88edbcc93e2` |

El mismo SHA-256 sale de `sha256sum src/App.tsx` en el árbol de trabajo limpio de ese commit.

## Sello OpenTimestamps

Se generó un archivo con:

```sh
git archive --format=tar.gz 3d8c0fdf178340581e721ecc54792d0c20a37bb1
```

Git 2.43.0, el 2026-10-27. Ese comando es el `git archive --format=tar.gz HEAD` pedido, ejecutado cuando `HEAD` de `main` era ese commit. El tar.gz **no** está en el repositorio. Volver a correr `git archive` puede no repetir los mismos bytes; la prueba apunta al SHA-256 de abajo, no a una nueva generación.

| | Valor |
| --- | --- |
| Nombre | `unidadeschile-3d8c0fdf178340581e721ecc54792d0c20a37bb1.tar.gz` |
| Bytes | 68272318 |
| SHA-256 | `be5a24953d48dafd1aa090e69cb8bf1ea68110f922fabdc29f774085ee8b8de0` |
| Sello | `docs/autoria/unidadeschile-3d8c0fdf178340581e721ecc54792d0c20a37bb1.tar.gz.ots` |
| Cliente | opentimestamps-client 0.7.2 (`ots stamp`) |

`ots info` muestra el mismo SHA-256 y cuatro atestaciones **pendientes** de confirmación en Bitcoin:

- `https://alice.btc.calendar.opentimestamps.org`
- `https://bob.btc.calendar.opentimestamps.org`
- `https://finney.calendar.eternitywall.com`
- `https://btc.calendar.catallaxy.com`

Hasta que un calendario publique el compromiso en Bitcoin, el sello no queda anclado en la cadena. Se completa después, sin rehacer el archivo, con:

```sh
ots upgrade docs/autoria/unidadeschile-3d8c0fdf178340581e721ecc54792d0c20a37bb1.tar.gz.ots
```

Para verificar hace falta el tar.gz original (el de ese SHA-256) junto al `.ots`, con el mismo nombre base:

```sh
ots verify docs/autoria/unidadeschile-3d8c0fdf178340581e721ecc54792d0c20a37bb1.tar.gz.ots
```

Los hashes también están en `docs/autoria/source-sha256.txt`.
