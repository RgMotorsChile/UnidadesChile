import type { Lead } from "../store/types";
import { nowIso, uid } from "../store/repo";

export function newLead(input: {
  origen: string;
  mensaje: string;
  nombre?: string;
  telefono?: string;
  email?: string;
  vehicleId?: string;
}): Lead {
  return {
    id: uid("lead"),
    nombre: input.nombre?.trim() || "Consulta web",
    telefono: input.telefono?.trim() || "",
    email: input.email?.trim() || "",
    mensaje: input.mensaje,
    origen: input.origen,
    vehicleId: input.vehicleId || "",
    estado: "nuevo",
    createdAt: nowIso(),
  };
}
