export interface RegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  n: number;
}

/** Ordinary least-squares regression of y on x. */
export function linearRegression(x: number[], y: number[]): RegressionResult | null {
  const n = x.length;
  if (n < 2) return null;

  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;

  let ssXX = 0, ssXY = 0, ssYY = 0;
  for (let i = 0; i < n; i++) {
    ssXX += (x[i] - xMean) ** 2;
    ssXY += (x[i] - xMean) * (y[i] - yMean);
    ssYY += (y[i] - yMean) ** 2;
  }

  if (ssXX === 0) return null;
  const slope = ssXY / ssXX;
  const intercept = yMean - slope * xMean;
  const r2 = ssYY > 0 ? (ssXY ** 2) / (ssXX * ssYY) : 1;

  return { slope, intercept, r2, n };
}

/** Derive phi (degrees) from shear box (normal_stress, shear_stress) pairs via OLS. */
export function shearBoxPhi(normalStresses: number[], shearStresses: number[]): number | null {
  const reg = linearRegression(normalStresses, shearStresses);
  if (!reg) return null;
  return (Math.atan(reg.slope) * 180) / Math.PI;
}

/** Derive phi from triaxial (sigma3eff, sigma1eff) pairs via Mohr-Coulomb regression. */
export function triaxialPhi(sigma3eff: number[], sigma1eff: number[]): number | null {
  const reg = linearRegression(sigma3eff, sigma1eff);
  if (!reg) return null;
  const m = reg.slope; // σ1' = m·σ3' + b
  if (m <= 1) return null;
  return (Math.asin((m - 1) / (m + 1)) * 180) / Math.PI;
}
