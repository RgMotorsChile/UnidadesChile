import { useState } from "react";
import { Link } from "react-router-dom";

const KEY = "uc-cookies";

export function CookieBanner() {
  const [choice, setChoice] = useState(() => localStorage.getItem(KEY));
  if (choice) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-40 px-3 md:bottom-6">
      <div className="mx-auto flex max-w-[720px] flex-col gap-3 rounded-2xl border border-white/10 bg-[#111]/95 p-4 backdrop-blur sm:flex-row sm:items-center">
        <p className="min-w-0 text-[12px] leading-relaxed text-white/65">
          Usamos cookies esenciales para el sitio y, si aceptas, para mejorar la atención.{" "}
          <Link to="/cookies" className="text-white underline underline-offset-2">
            Política de cookies
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="rounded-full border border-white/20 px-3 py-1.5 text-[12px]"
            onClick={() => {
              localStorage.setItem(KEY, "essential");
              setChoice("essential");
            }}
          >
            Solo esenciales
          </button>
          <button
            type="button"
            className="rounded-full bg-brand px-3 py-1.5 text-[12px] font-medium"
            onClick={() => {
              localStorage.setItem(KEY, "all");
              setChoice("all");
            }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
