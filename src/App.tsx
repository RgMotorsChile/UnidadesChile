import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { MobileNav } from "./components/MobileNav";
import { ChatWidget } from "./components/ChatWidget";
import { CookieBanner } from "./components/CookieBanner";
import { Home } from "./pages/Home";
import { Inventario } from "./pages/Inventario";
import { Auto } from "./pages/Auto";
import { Vende } from "./pages/Vende";
import { Financia } from "./pages/Financia";
import { Nosotros } from "./pages/Nosotros";
import { Novedades } from "./pages/Novedades";
import { Novedad } from "./pages/Novedad";
import { Comparador } from "./pages/Comparador";
import { Contacto } from "./pages/Contacto";
import { AvisoCredito, CondicionesReserva, Cookies, Privacidad, Terminos } from "./pages/Legal";
import { AdminApp } from "./admin/AdminApp";

function LegacyAuto() {
  const { id } = useParams();
  return <Navigate to={id ? `/catalogo/${id}` : "/catalogo"} replace />;
}

export function App() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) {
    return <AdminApp />;
  }

  return (
    <div className="min-h-screen min-w-0 overflow-x-clip bg-black">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Inventario />} />
          <Route path="/catalogo/:id" element={<Auto />} />
          <Route path="/inventario" element={<Navigate to="/catalogo" replace />} />
          <Route path="/inventario/:id" element={<LegacyAuto />} />
          <Route path="/vende-tu-auto" element={<Vende />} />
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
      </main>
      <Footer />
      <MobileNav />
      <ChatWidget />
      <CookieBanner />
    </div>
  );
}
