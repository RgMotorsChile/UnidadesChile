import type { Car } from "../data/cars";

export type VehicleStatus = "publicado" | "borrador" | "reservado" | "vendido";

export type Vehicle = Car & {
  status: VehicleStatus;
  notas: string;
  vistas: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicationStatus = "publicado" | "borrador";

export type Publication = {
  id: string;
  titulo: string;
  slug: string;
  extracto: string;
  cuerpo: string;
  portada: string;
  estado: PublicationStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type LeadStatus = "nuevo" | "contactado" | "ganado" | "perdido";

export type Lead = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  mensaje: string;
  origen: string;
  vehicleId: string;
  estado: LeadStatus;
  createdAt: string;
};

export type MediaAsset = {
  id: string;
  nombre: string;
  mime: string;
  size: number;
  kind: "catalogo" | "publicacion" | "sitio";
  createdAt: string;
};

export type SiteSettings = {
  name: string;
  legal: string;
  whatsapp: string;
  phoneDisplay: string;
  email: string;
  city: string;
  address: string;
  hours: string;
  mapQuery: string;
  homeHeadline1: string;
  homeHeadline2: string;
  homeSub: string;
};

export type AdminUser = {
  user: string;
  passwordHash: string;
};
