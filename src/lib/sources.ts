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

/** Únicas patentes publicables: hoja UNIDADES CHILE. */
export const UNIDADES_CHILE_PLATES = new Set([
  "SRCP17",
  "LXCY98",
  "RPKD45",
  "RZVK91",
  "PTFC69",
  "SFXY80",
  "SCGJ41",
  "PSJJ97",
  "TSXK53",
  "PYSY84",
  "SFRT83",
  "STPZ87",
  "SSDT39",
  "RYGB56",
  "LXBC60",
  "RZSY35",
  "SHYL53",
  "RDHB85",
  "RHYH38",
]);

export function plateKey(unidad: string) {
  return unidad.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function isUnidadesChileStock(unidad: string) {
  return UNIDADES_CHILE_PLATES.has(plateKey(unidad));
}
