import { useState, type FormEvent } from "react";
import { ImagePlus, Lock, X } from "lucide-react";
import { marcas } from "../data/cars";
import { waLink } from "../lib/config";
import { compressFoto, enviarConsigna, MAX_FOTOS } from "../lib/consignaSubmit";
import { newLead } from "../lib/leads";
import { useData } from "../store/DataProvider";
import { PageTitle } from "../components/PageTitle";

const years = Array.from({ length: 16 }, (_, i) => 2026 - i);

export function Vende() {
  const { saveLead, settings } = useData();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [patente, setPatente] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [year, setYear] = useState("");
  const [kms, setKms] = useState("");
  const [notas, setNotas] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files, ...Array.from(list)].filter((f) => f.type.startsWith("image/")).slice(0, MAX_FOTOS);
    previews.forEach((url) => URL.revokeObjectURL(url));
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(previews[index]);
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const fotos = [];
      for (const file of files) {
        fotos.push(await compressFoto(file));
      }
      const result = await enviarConsigna({
        nombre,
        telefono,
        email,
        patente,
        marca,
        modelo,
        year,
        kms,
        notas,
        fotos,
      });
      void saveLead(
        newLead({
          origen: "consigna",
          nombre,
          telefono,
          email,
          mensaje: `Consigna ${marca || "auto"} ${modelo} ${year}, patente ${patente}, ${kms} km. ${notas}`.trim(),
        }),
      );
      if (!result.ok) {
        setError(result.error || "No se pudo enviar el correo.");
        return;
      }
      setSent(true);
    } catch {
      setError("No se pudo enviar. Revisa las fotos e inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative overflow-x-clip pb-28">
      <PageTitle
        title="Consigna tu vehículo | Unidades Chile"
        description="Deja tu auto en consignación en Puerto Montt. Carga los datos y fotos; te contactamos."
      />
      <div className="absolute inset-0 bg-[url('/cars/bg-vende.png')] bg-cover bg-center opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/88 to-black/55" />

      <div className="relative mx-auto grid max-w-[1280px] items-start gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:px-8">
        <div className="pt-1 sm:pt-4">
          <h1 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[40px] lg:text-5xl">
            Consigna tu
            <br />
            vehículo
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
            Lo revisamos, lo publicamos y te contactamos. Tú decides si avanzamos.
          </p>
          <ol className="mt-8 space-y-6 sm:mt-10">
            {[
              ["01", "Datos y fotos", "Patente, ficha y fotos del auto."],
              ["02", "Lo revisamos", "El equipo de Unidades Chile recibe un correo con tu info."],
              ["03", "Te contactamos", "Te escribimos por WhatsApp para coordinar."],
            ].map(([n, t, d], i) => (
              <li key={n} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-sm font-bold">
                    {n}
                  </span>
                  {i < 2 && <span className="mt-1 h-8 w-px bg-white/20" />}
                </div>
                <div>
                  <p className="text-lg font-semibold sm:text-xl">{t}</p>
                  <p className="text-sm text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {sent ? (
          <div className="rounded-3xl border border-brand/50 bg-black/70 p-6 shadow-[0_0_50px_rgba(255,12,64,0.18)] backdrop-blur sm:p-8">
            <h2 className="text-2xl font-semibold">Recibimos tu consignación</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Llegó un correo a Unidades Chile con tus datos
              {files.length ? ` y ${files.length} foto${files.length === 1 ? "" : "s"}` : ""}. Te
              contactamos a la brevedad.
            </p>
            <a
              href={waLink(
                `Hola, soy ${nombre}. Dejé en consignación ${marca || "mi auto"} ${modelo} ${year}, patente ${patente}.`,
                settings.whatsapp,
              )}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex rounded-xl bg-brand px-5 py-3 text-sm font-semibold hover:bg-brand-dark"
            >
              Escribir por WhatsApp
            </a>
          </div>
        ) : (
          <form
            className="rounded-3xl border border-brand/50 bg-black/70 p-5 shadow-[0_0_50px_rgba(255,12,64,0.18)] backdrop-blur sm:p-6"
            onSubmit={(e) => void onSubmit(e)}
          >
            <h2 className="text-2xl font-semibold">Datos del vehículo</h2>
            <div className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs text-muted">
                  Nombre
                  <input
                    className="field mt-1"
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </label>
                <label className="text-xs text-muted">
                  WhatsApp
                  <input
                    className="field mt-1"
                    placeholder="9 1234 5678"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    required
                  />
                </label>
              </div>
              <label className="text-xs text-muted">
                Correo (opcional)
                <input
                  className="field mt-1"
                  type="email"
                  placeholder="ivan.p@example.net"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="text-xs text-muted">
                Patente
                <input
                  className="field mt-1"
                  placeholder="Ej: ABCD12"
                  value={patente}
                  onChange={(e) => setPatente(e.target.value.toUpperCase())}
                />
              </label>
              <label className="text-xs text-muted">
                Marca
                <select
                  className="field mt-1"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  required
                >
                  <option value="">Selecciona</option>
                  {marcas.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                  <option>Otra</option>
                </select>
              </label>
              <label className="text-xs text-muted">
                Modelo
                <input
                  className="field mt-1"
                  placeholder="Ej: CX-5"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  required
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs text-muted">
                  Año
                  <select className="field mt-1" value={year} onChange={(e) => setYear(e.target.value)} required>
                    <option value="">Año</option>
                    {years.map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-muted">
                  Kilometraje
                  <input
                    className="field mt-1"
                    placeholder="Ej: 85.000"
                    value={kms}
                    onChange={(e) => setKms(e.target.value)}
                  />
                </label>
              </div>
              <label className="text-xs text-muted">
                Comentarios
                <textarea
                  className="field mt-1 min-h-24 resize-y"
                  placeholder="Estado, dueños, papeles, lo que quieras que sepamos."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                />
              </label>
              <div>
                <p className="text-xs text-muted">Fotos del vehículo (hasta {MAX_FOTOS})</p>
                <label className="mt-1 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-6 text-center text-sm text-white/70 hover:border-white/40">
                  <ImagePlus size={20} />
                  <span>Sube fotos o suéltalas aquí</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
                {previews.length > 0 && (
                  <ul className="mt-3 grid grid-cols-4 gap-2">
                    {previews.map((src, i) => (
                      <li key={src} className="relative">
                        <img src={src} alt="" className="h-16 w-full rounded-lg object-cover" />
                        <button
                          type="button"
                          className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-black text-white"
                          onClick={() => removeFile(i)}
                          aria-label="Quitar foto"
                        >
                          <X size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {error && <p className="text-sm text-brand">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-brand py-3.5 font-semibold hover:bg-brand-dark disabled:opacity-60"
              >
                {busy ? "Enviando…" : "Enviar consignación"}
              </button>
              <p className="flex items-center justify-center gap-2 text-xs text-muted">
                <Lock size={12} /> Sin compromiso · 100% confidencial
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
