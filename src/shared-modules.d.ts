declare module "@shared/vehiclePublic.mjs" {
  export function plateKey(value: string): string;
  export function publicSlug(car: {
    id?: string;
    slug?: string;
    unidad?: string;
    plate?: string;
    marca?: string;
    brand?: string;
    modelo?: string;
    model?: string;
    version?: string;
    year?: number;
  }): string;
  export function catalogPath(car: {
    id?: string;
    unidad?: string;
    marca?: string;
    modelo?: string;
    version?: string;
    year?: number;
  }): string;
  export function stripPlate(text: string, plate?: string): string;
  export function vehicleAlt(car: {
    unidad?: string;
    marca?: string;
    modelo?: string;
    year?: number;
  }): string;
  export function isListedHere(
    car: { unidad?: string; plate?: string; sucursal?: string },
    sheetPlates?: Set<string> | null,
  ): boolean;
  export function publicOrigin(host: string, fallbackOrigin?: string): string;
  export function pageSeo(origin: string, pathname: string, car?: object): {
    title: string;
    description: string;
    canonical: string;
    ogType: string;
    ogImage: string;
    ogImageAlt: string;
    robots?: string;
    jsonLd: unknown;
  };
}

declare module "@shared/images.mjs" {
  export const IMAGE_SIZES: string;
  export function imageUrl(src: string, width: number, format: string): string;
  export function srcSet(src: string, format: string): string;
  export function isPendingSrc(src?: string): boolean;
}
