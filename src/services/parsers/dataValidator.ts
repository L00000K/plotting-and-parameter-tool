import type { SourceType } from '@/types';

const REQUIRED_COLS: Record<SourceType, string[]> = {
  CPT: ['hole_id', 'elevation', 'qc', 'fs'],
  SPT: ['hole_id', 'elevation', 'n_measured'],
  ShearBox: ['sample_id', 'geo_unit', 'elevation', 'normal_stress', 'shear_stress'],
  Triaxial: ['sample_id', 'geo_unit', 'elevation', 'cell_pressure', 'deviator_stress_at_failure'],
};

export function validateCSVHeaders(headers: string[], sourceType: SourceType): string[] {
  const required = REQUIRED_COLS[sourceType] ?? [];
  const normalised = headers.map((h) => h.toLowerCase().trim().replace(/\s+/g, '_'));
  return required.filter((r) => !normalised.includes(r));
}
