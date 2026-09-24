/**
 * Motor de simulación — Unidades Chile × Autofin (Trinidad / spider fee).
 * Calibrado contra POST https://webapi.autofin.cl/v1/spider/fee
 * (producto AUTOPLAN USADOS, Desgravamen + Cesantía ON, sin AutoProtegido):
 *
 *   $15.000.000 · pie $3.000.000 · 48m · usado → ValorCuota 493.197 · CAE 38,31%
 *
 * La cuota Trinidad ya trae seguros desgravamen/cesantía; no sumamos prima
 * de daños del auto (AutoProtegido=false en el simulador público).
 */

/** Tasa mensual all-in referencial (capital+interés+seguros incluidos en cuota Autofin). */
export const AUTOFIN_DEFAULT_MONTHLY_RATE = 0.0321;

/** Tasa legada de partners (subestimaba vs autofin.cl). */
export const AUTOFIN_LEGACY_PARTNER_RATE = 0.0185;

/** Tasa intermedia 2,5% usada brevemente; también se normaliza al all-in. */
export const AUTOFIN_INTERMEDIATE_RATE = 0.025;

export const CREDIT_RULES = {
  minDownPct: 20,
  maxDownPct: 60,
  minTermMonths: 12,
  maxTermMonths: 48,
  termStep: 6,
  deferredFirstPaymentDays: 60,
};

export const VEHICLE_TYPES = [
  { id: "auto", label: "Auto", match: ["Sedán", "Hatchback", "Coupé", "Deportivo"] },
  { id: "suv", label: "SUV", match: ["SUV", "Crossover"] },
  { id: "camioneta", label: "Camioneta", match: ["Pickup", "Camioneta"] },
  { id: "camion", label: "Camión", match: ["Camión", "Truck"] },
  { id: "furgon", label: "Furgón", match: ["Furgón", "Van", "Comercial"] },
] as const;

export type VehicleTypeId = (typeof VEHICLE_TYPES)[number]["id"];

export function matchVehicleType(bodyType?: string): VehicleTypeId {
  const b = (bodyType || "").toLowerCase();
  for (const t of VEHICLE_TYPES) {
    if (t.match.some((m) => b.includes(m.toLowerCase()))) return t.id;
  }
  return "auto";
}

export const AUTOFIN_OPERATIONAL_FEES = {
  notaryAndPledge: 180000,
  registration: 45000,
  admin: 75000,
};

export const AUTOFIN_PUBLIC_INSURANCE_FLAGS = {
  Desgravamen: true,
  Cesantia: true,
  AutoProtegido: false,
} as const;

export function frenchMonthlyPayment(
  financed: number,
  monthlyRate: number,
  termMonths: number,
): number {
  if (financed <= 0 || termMonths <= 0) return 0;
  if (monthlyRate <= 0) return Math.round(financed / termMonths);
  const i = monthlyRate;
  const factor = (i * Math.pow(1 + i, termMonths)) / (Math.pow(1 + i, termMonths) - 1);
  return Math.round(financed * factor);
}

export function annualCaeFromMonthlyRate(monthlyRate: number): number {
  return (Math.pow(1 + monthlyRate, 12) - 1) * 100;
}

export function approximateCaeWithFees(
  financed: number,
  monthlyRate: number,
  termMonths: number,
  feesTotal: number,
): number {
  if (financed <= 0 || termMonths <= 0) return 0;
  const basePayment = frenchMonthlyPayment(financed, monthlyRate, termMonths);
  const feePerMonth = Math.round(feesTotal / termMonths);
  const paymentWithFees = basePayment + feePerMonth;
  let lo = 0;
  let hi = 0.2;
  for (let n = 0; n < 40; n++) {
    const mid = (lo + hi) / 2;
    const p = frenchMonthlyPayment(financed, mid, termMonths);
    if (p < paymentWithFees) lo = mid;
    else hi = mid;
  }
  return annualCaeFromMonthlyRate((lo + hi) / 2);
}

export type CreditInsuranceBreakdown = {
  vehicleDamage: number;
  life: number;
  unemployment: number;
  total: number;
  bakedIntoRate: boolean;
};

export type CreditSimulationInput = {
  price: number;
  downPct: number;
  termMonths: number;
  monthlyRate?: number;
  vehicleYear?: number;
  vehicleType?: VehicleTypeId;
};

export type CreditSimulationResult = {
  downPayment: number;
  financed: number;
  monthlyPayment: number;
  capitalInstallment: number;
  insurance: CreditInsuranceBreakdown;
  termMonths: number;
  downPct: number;
  monthlyRate: number;
  caeApprox: number;
  caeWithFeesApprox: number;
  operationalFees: number;
  totalCreditCost: number;
  totalCostWithDown: number;
  deferredFirstPaymentDays: number;
  vehicleType?: VehicleTypeId;
  warnings: string[];
  ok: boolean;
};

export function clampDownPct(downPct: number): number {
  return Math.max(
    CREDIT_RULES.minDownPct,
    Math.min(CREDIT_RULES.maxDownPct, Math.round(downPct)),
  );
}

export function clampTermMonths(termMonths: number): number {
  const { minTermMonths, maxTermMonths, termStep } = CREDIT_RULES;
  const allowed: number[] = [];
  for (let t = minTermMonths; t <= maxTermMonths; t += termStep) allowed.push(t);
  if (allowed.includes(termMonths)) return termMonths;
  return allowed.reduce((best, t) =>
    Math.abs(t - termMonths) < Math.abs(best - termMonths) ? t : best,
  );
}

export function resolveMonthlyRate(requested?: number): number {
  if (requested == null || !Number.isFinite(requested) || requested <= 0) {
    return AUTOFIN_DEFAULT_MONTHLY_RATE;
  }
  if (
    Math.abs(requested - AUTOFIN_LEGACY_PARTNER_RATE) < 0.00005 ||
    Math.abs(requested - AUTOFIN_INTERMEDIATE_RATE) < 0.00005
  ) {
    return AUTOFIN_DEFAULT_MONTHLY_RATE;
  }
  return requested;
}

export function simulateCredit(input: CreditSimulationInput): CreditSimulationResult {
  const warnings: string[] = [];
  const monthlyRate = resolveMonthlyRate(input.monthlyRate);
  const downPct = clampDownPct(input.downPct);
  const termMonths = clampTermMonths(input.termMonths);

  if (downPct !== input.downPct) {
    warnings.push(`Pie ajustado al mínimo ${CREDIT_RULES.minDownPct}%.`);
  }
  if (termMonths !== input.termMonths) {
    warnings.push(`Plazo ajustado a ${termMonths} meses (máx. ${CREDIT_RULES.maxTermMonths}).`);
  }

  const currentYear = new Date().getFullYear();
  if (input.vehicleYear) {
    const ageAtEnd = currentYear - input.vehicleYear + Math.ceil(termMonths / 12);
    if (ageAtEnd > 10) {
      warnings.push(
        `Autofin suele limitar antigüedad + plazo a ~10 años (proyección ~${ageAtEnd} años).`,
      );
    }
  }

  const downPayment = Math.round((input.price * downPct) / 100);
  const financed = Math.max(0, input.price - downPayment);
  const fees =
    AUTOFIN_OPERATIONAL_FEES.notaryAndPledge +
    AUTOFIN_OPERATIONAL_FEES.registration +
    AUTOFIN_OPERATIONAL_FEES.admin;

  const monthlyPayment = frenchMonthlyPayment(financed, monthlyRate, termMonths);
  const insurance: CreditInsuranceBreakdown = {
    vehicleDamage: 0,
    life: 0,
    unemployment: 0,
    total: 0,
    bakedIntoRate: true,
  };

  const totalCreditCost = monthlyPayment * termMonths + fees;
  const caeApprox = annualCaeFromMonthlyRate(monthlyRate);

  return {
    downPayment,
    financed,
    monthlyPayment,
    capitalInstallment: monthlyPayment,
    insurance,
    termMonths,
    downPct,
    monthlyRate,
    caeApprox,
    caeWithFeesApprox: approximateCaeWithFees(financed, monthlyRate, termMonths, fees),
    operationalFees: fees,
    totalCreditCost,
    totalCostWithDown: totalCreditCost + downPayment,
    deferredFirstPaymentDays: CREDIT_RULES.deferredFirstPaymentDays,
    vehicleType: input.vehicleType,
    warnings,
    ok: financed > 0 && monthlyPayment > 0,
  };
}

export function estimateMonthlyAutofin(
  price: number,
  termMonths = 48,
  piePercent = 0.2,
  monthlyRate = AUTOFIN_DEFAULT_MONTHLY_RATE,
): number {
  if (!price || price <= 0) return 0;
  return simulateCredit({
    price,
    downPct: Math.round(piePercent * 100),
    termMonths,
    monthlyRate,
  }).monthlyPayment;
}

/** Alias para fichas y listados (pie 20% · 48 meses). */
export function cuotaDesde(precio: number, piePct = 20, plazo = 48) {
  return estimateMonthlyAutofin(precio, plazo, piePct / 100);
}
