import { randomBytes } from "node:crypto";

/** Requisitos de contraseña fuerte para cuentas adicionales del panel. */
export function validateStrongPassword(password) {
  if (typeof password !== "string" || password.length < 10) {
    return "La contraseña debe tener al menos 10 caracteres.";
  }
  if (!/[A-Z]/.test(password)) return "Debe incluir al menos una mayúscula.";
  if (!/[a-z]/.test(password)) return "Debe incluir al menos una minúscula.";
  if (!/[0-9]/.test(password)) return "Debe incluir al menos un número.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Debe incluir al menos un símbolo.";
  return null;
}

export function generateTempPassword() {
  return `RgMotors#${randomBytes(10).toString("hex")}9`;
}
