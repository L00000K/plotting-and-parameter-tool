import type { RawSPTRow } from '@/types';
import { PA } from './stressCalculator';

// Energy ratio reference: 60%
const ER_REF = 60;

// Hammer energy ratio correction factors
const CE: Record<string, number> = {
  automatic: 0.95,
  safety: 0.75,
  donut: 0.60,
  pin_weight: 1.00,
};

export interface SPTCorrected {
  N60: number;   // energy-corrected N
  N160: number;  // energy + overburden corrected N (normalised to 100 kPa)
}

/**
 * Correct raw SPT N value to N60 (energy correction) and (N1)60 (overburden correction).
 */
export function correctSPT(row: RawSPTRow, sigma_v_eff: number): SPTCorrected {
  const ce = CE[row.hammer_type] ?? 0.75;
  const er_ratio = row.energy_ratio / ER_REF;
  const N60 = row.N_measured * ce * er_ratio;

  // Liao & Whitman (1986) overburden correction
  const Cn = Math.min(Math.sqrt(PA / Math.max(sigma_v_eff, 10)), 2.0);
  const N160 = Math.min(N60 * Cn, 100); // cap at 100

  return { N60, N160 };
}
