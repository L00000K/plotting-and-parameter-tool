import type { CorrelationDef } from '@/types';

export const DEFAULT_CORRELATIONS: CorrelationDef[] = [
  {
    id: 'kulhawy_mayne_1990',
    name: 'Kulhawy & Mayne 1990',
    reference: 'Kulhawy, F.H. & Mayne, P.W. (1990). Manual on estimating soil properties for foundation design.',
    source_type: 'CPT',
    active: true,
    constants: { C1: 17.6, C2: 11.0 },
    description: 'Peak friction angle from normalised cone resistance Qt for clean uncemented quartz sands.',
    equation_code: `# Available: qc (MPa), fs (kPa), u2 (kPa), sigma_v (kPa), sigma_v_eff (kPa), pa (kPa)
# Constants: C1, C2
Qt = (qc * 1000 - sigma_v) / sigma_v_eff
phi = C1 + C2 * log10(max(Qt, 1.0))`,
  },
  {
    id: 'robertson_2009',
    name: 'Robertson 2009',
    reference: 'Robertson, P.K. (2009). Interpretation of cone penetration tests: a unified approach. CGJ 46(11):1337–1355.',
    source_type: 'CPT',
    active: true,
    constants: {},
    description: 'State-parameter based approach. Requires phi_cv (critical state friction angle) set per geological unit.',
    equation_code: `# Available: qc (MPa), fs (kPa), u2 (kPa), sigma_v (kPa), sigma_v_eff (kPa), pa (kPa), phi_cv (degrees)
Qtn = ((qc * 1000 - sigma_v) / pa) * (pa / sigma_v_eff) ** 0.5
Fr_val = (fs / max(qc * 1000 - sigma_v, 0.001)) * 100
Ic = ((3.47 - log10(max(Qtn, 1.0)))**2 + (log10(max(Fr_val, 0.001)) + 1.22)**2) ** 0.5
psi = (Ic - 3.27) / (-8.7)
phi = phi_cv - 48 * psi`,
  },
  {
    id: 'peck_wolff_1989',
    name: 'Peck / Wolff 1989',
    reference: 'Wolff, T.F. (1989). Pile capacity prediction using parameter functions. ASCE GSP 23.',
    source_type: 'SPT',
    active: true,
    constants: { A: 27.1, B: 0.3, C: 0.00054 },
    description: 'Friction angle from (N₁)₆₀ corrected SPT blow count. Constants A, B, C editable.',
    equation_code: `# Available: N_measured, N60, N160 (normalised to 100 kPa overburden)
# Constants: A, B, C
phi = A + B * N160 - C * N160 ** 2`,
  },
  {
    id: 'hatanaka_uchida_1996',
    name: 'Hatanaka & Uchida 1996',
    reference: 'Hatanaka, M. & Uchida, A. (1996). Empirical correlation between penetration resistance and friction angle of sandy soils. Soils and Foundations 36(4):1–9.',
    source_type: 'SPT',
    active: true,
    constants: {},
    description: 'Based on high-quality undisturbed frozen sand samples. Tends to give slightly higher phi than Peck/Wolff.',
    equation_code: `# Available: N_measured, N60, N160
phi = (20 * N160) ** 0.5 + 20`,
  },
  {
    id: 'shear_box_regression',
    name: 'Shear Box Regression',
    reference: 'Mohr-Coulomb failure criterion: τ = c + σn·tan(φ)',
    source_type: 'ShearBox',
    active: true,
    constants: {},
    description: 'Linear regression on τ vs σn pairs per geological unit. Computed in TypeScript (not editable via equation).',
    equation_code: `# Shear box phi is computed by linear regression in the engine.
# This field is informational only.
# phi = arctan(slope of τ vs σn best-fit line) per geological unit`,
  },
  {
    id: 'triaxial_regression',
    name: 'Triaxial Regression (CD/CU)',
    reference: 'Mohr-Coulomb: φ derived from effective principal stress pairs at failure.',
    source_type: 'Triaxial',
    active: true,
    constants: {},
    description: 'Per specimen: σ3eff = cell - u, σ1eff = σ3eff + deviator - u. Regression across specimens per unit.',
    equation_code: `# Triaxial phi is computed by Mohr-Coulomb regression in the engine.
# This field is informational only.
# phi = arcsin((m-1)/(m+1)) where m = slope of σ1eff vs σ3eff regression`,
  },
];
