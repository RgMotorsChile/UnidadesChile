import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { MobileNav } from "./components/MobileNav";
import { ChatWidget } from "./components/ChatWidget";
import { CookieBanner } from "./components/CookieBanner";
import { Home } from "./pages/Home";
import { Inventario } from "./pages/Inventario";

const Auto = lazy(() => import("./pages/Auto").then((m) => ({ default: m.Auto })));
const Vende = lazy(() => import("./pages/Vende").then((m) => ({ default: m.Vende })));
const Financia = lazy(() => import("./pages/Financia").then((m) => ({ default: m.Financia })));
const Nosotros = lazy(() => import("./pages/Nosotros").then((m) => ({ default: m.Nosotros })));
const Novedades = lazy(() => import("./pages/Novedades").then((m) => ({ default: m.Novedades })));
const Novedad = lazy(() => import("./pages/Novedad").then((m) => ({ default: m.Novedad })));
const Comparador = lazy(() => import("./pages/Comparador").then((m) => ({ default: m.Comparador })));
const Contacto = lazy(() => import("./pages/Contacto").then((m) => ({ default: m.Contacto })));
const Privacidad = lazy(() => import("./pages/Legal").then((m) => ({ default: m.Privacidad })));
const Terminos = lazy(() => import("./pages/Legal").then((m) => ({ default: m.Terminos })));
const Cookies = lazy(() => import("./pages/Legal").then((m) => ({ default: m.Cookies })));
const AvisoCredito = lazy(() => import("./pages/Legal").then((m) => ({ default: m.AvisoCredito })));
const CondicionesReserva = lazy(() => import("./pages/Legal").then((m) => ({ default: m.CondicionesReserva })));
const AdminApp = lazy(() => import("./admin/AdminApp").then((m) => ({ default: m.AdminApp })));

function LegacyAuto() {
  const { id } = useParams();
  return <Navigate to={id ? `/catalogo/${id}` : "/catalogo"} replace />;
}

export function App() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <AdminApp />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen min-w-0 overflow-x-clip bg-black">
      <Header />
      <main>
        <Suspense fallback={<div className="min-h-[70vh]" aria-hidden />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Inventario />} />
          <Route path="/catalogo/:id" element={<Auto />} />
          <Route path="/inventario" element={<Navigate to="/catalogo" replace />} />
          <Route path="/inventario/:id" element={<LegacyAuto />} />
          <Route path="/consigna-tu-vehiculo" element={<Vende />} />
          <Route path="/vende-tu-auto" element={<Navigate to="/consigna-tu-vehiculo" replace />} />
          <Route path="/financia" element={<Financia />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/novedades" element={<Novedades />} />
          <Route path="/novedades/:slug" element={<Novedad />} />
          <Route path="/comparador" element={<Comparador />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/aviso-credito" element={<AvisoCredito />} />
          <Route path="/condiciones-reserva" element={<CondicionesReserva />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </main>
      <Footer />
      <MobileNav />
      <ChatWidget />
      <CookieBanner />
    </div>
  );
}
