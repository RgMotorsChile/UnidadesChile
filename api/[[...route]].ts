const FREEZE_HTML = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Error de actualización</title>
    <style>
      html, body { margin: 0; min-height: 100%; background: #0b0b0b; color: #f4f4f4; font-family: Inter, system-ui, sans-serif; }
      main { min-height: 100vh; display: grid; place-items: center; padding: 32px 20px; text-align: center; }
      p { margin: 0; max-width: 32rem; line-height: 1.55; color: #cfcfcf; }
      h1 { margin: 0 0 12px; font-size: 1.75rem; font-weight: 700; }
      small { display: block; margin-top: 18px; color: #888; }
    </style>
  </head>
  <body>
    <main>
      <div>
        <h1>Error de actualización</h1>
        <p>El sitio de Unidades Chile no está disponible por un error durante una actualización. No es posible ingresar por ahora.</p>
        <small>unidadeschile.cl</small>
      </div>
    </main>
  </body>
</html>`;

export const config = {
  runtime: "nodejs",
  api: { bodyParser: { sizeLimit: "4mb" } },
};

export default function handler(
  _req: unknown,
  res: {
    statusCode: number;
    setHeader: (k: string, v: string) => void;
    end: (body?: string) => void;
  },
) {
  res.statusCode = 503;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", "no-store, no-cache, must-revalidate");
  res.setHeader("retry-after", "3600");
  res.end(FREEZE_HTML);
}
