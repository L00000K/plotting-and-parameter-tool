import { PA } from './stressCalculator';

export interface CPTNormalised {
  qt: number;    // kPa, corrected total cone resistance (u2 correction)
  Qt: number;    // normalised cone resistance (dimensionless)
  Qtn: number;   // stress-normalised cone resistance
  Fr: number;    // friction ratio %
  Ic: number;    // soil behaviour type index
}

/**
 * Normalise CPT readings.
 * @param qc MPa
 * @param fs kPa
 * @param u2 kPa
 * @param sigma_v total vertical stress kPa
 * @param sigma_v_eff effective vertical stress kPa
 * @param a_net net area ratio (default 0.8)
 */
export function normaliseCPT(
  qc: number,
  fs: number,
  u2: number,
  sigma_v: number,
  sigma_v_eff: number,
  a_net = 0.8
): CPTNormalised {
  const qt_kpa = qc * 1000 + u2 * (1 - a_net); // kPa
  const Qt = Math.max((qt_kpa - sigma_v) / Math.max(sigma_v_eff, 1), 1);
  const n = 0.5; // stress exponent for sands
  const Qtn = Math.max(((qt_kpa - sigma_v) / PA) * Math.pow(PA / Math.max(sigma_v_eff, 1), n), 1);
  const Fr = Math.max((fs / Math.max(qt_kpa - sigma_v, 0.1)) * 100, 0.001);
  const Ic = Math.sqrt(Math.pow(3.47 - Math.log10(Qtn), 2) + Math.pow(Math.log10(Fr) + 1.22, 2));

  return { qt: qt_kpa, Qt, Qtn, Fr, Ic };
}
