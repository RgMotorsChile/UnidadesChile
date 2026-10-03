/** Orígenes de ESTE sitio. Proyecto independiente de cualquier otra automotora. */
export const STOCK_SOURCES = {
  sheetId: "1BG2uR6APbXEMvVvRmdR-Nn0Vko6eobJ6Xam0XX41Ldc",
  sheetName: "UNIDADES CHILE",
  sheetUrl:
    "https://docs.google.com/spreadsheets/d/1BG2uR6APbXEMvVvRmdR-Nn0Vko6eobJ6Xam0XX41Ldc",
  driveFolderId: "1etQDf-_InkLx8m4_AUMnc8xg2O_137St",
  driveFolderUrl:
    "https://drive.google.com/drive/folders/1etQDf-_InkLx8m4_AUMnc8xg2O_137St",
  skipStatuses: ["VENDIDO", "ENTREGADO", "VTA", "RESERVADO"],
} as const;

export const SITE_URL = "https://www.unidadeschile.cl";

export function plateKey(unidad: string) {
  return unidad.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/** Fila válida de stock (la pestaña / tenant aísla de RG). */
export function isUnidadesChileStock(unidad: string) {
  return plateKey(unidad).length >= 5;
}
