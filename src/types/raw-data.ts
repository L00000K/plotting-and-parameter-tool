export type HammerType = 'automatic' | 'safety' | 'donut' | 'pin_weight';
export type TestType = 'CD' | 'CU';
export type SourceType = 'CPT' | 'SPT' | 'ShearBox' | 'Triaxial';

export interface RawCPTRow {
  hole_id: string;
  elevation: number;   // m AOD
  qc: number;          // MPa
  fs: number;          // kPa
  u2: number;          // kPa
}

export interface RawSPTRow {
  hole_id: string;
  elevation: number;
  N_measured: number;
  rod_length: number;
  hammer_type: HammerType;
  energy_ratio: number; // % e.g. 60
}

export interface RawShearBoxRow {
  sample_id: string;
  hole_id: string;
  geo_unit: string;
  elevation: number;
  normal_stress: number;  // kPa
  shear_stress: number;   // kPa at failure
}

export interface RawTriaxialSpecimen {
  sample_id: string;
  hole_id: string;
  geo_unit: string;
  elevation: number;
  test_type: TestType;
  cell_pressure: number;             // kPa
  deviator_stress_at_failure: number; // kPa
  pore_pressure_at_failure: number;  // kPa (0 for CD)
}

export interface ImportedDataset {
  id: string;
  source_file: string;
  source_type: SourceType;
  imported_at: string;
  cpt_rows: RawCPTRow[];
  spt_rows: RawSPTRow[];
  shear_box_rows: RawShearBoxRow[];
  triaxial_rows: RawTriaxialSpecimen[];
}
