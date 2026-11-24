import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        display: "grid",
        placeItems: "center",
        background: "#0b0b0b",
        color: "#f4f4f4",
        fontFamily: "Inter, system-ui, sans-serif",
        textAlign: "center",
        padding: 32,
      }}
    >
      <div>
        <h1 style={{ margin: "0 0 12px", fontSize: "1.75rem" }}>Error de actualización</h1>
        <p style={{ margin: 0, maxWidth: "32rem", lineHeight: 1.55, color: "#cfcfcf" }}>
          El sitio de Unidades Chile no está disponible por un error durante una actualización. No es posible ingresar por ahora.
        </p>
        <small style={{ display: "block", marginTop: 18, color: "#888" }}>unidadeschile.cl</small>
      </div>
    </main>
  </StrictMode>,
);
