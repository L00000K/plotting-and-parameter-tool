import Papa from 'papaparse';
import type {
  RawCPTRow, RawSPTRow, RawShearBoxRow, RawTriaxialSpecimen,
  HammerType, TestType, SourceType,
} from '@/types';

type ParsedRow = Record<string, string>;

function norm(key: string): string {
  return key.toLowerCase().trim().replace(/\s+/g, '_');
}

function num(row: ParsedRow, ...keys: string[]): number {
  for (const k of keys) {
    const v = parseFloat(row[norm(k)] ?? row[k] ?? '');
    if (!isNaN(v)) return v;
  }
  return 0;
}

function str(row: ParsedRow, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[norm(k)] ?? row[k];
    if (v) return v.trim();
  }
  return '';
}

function normRow(row: ParsedRow): ParsedRow {
  const out: ParsedRow = {};
  for (const [k, v] of Object.entries(row)) out[norm(k)] = v;
  return out;
}

export function parseCSV(content: string, sourceType: SourceType): {
  cpt_rows: RawCPTRow[];
  spt_rows: RawSPTRow[];
  shear_box_rows: RawShearBoxRow[];
  triaxial_rows: RawTriaxialSpecimen[];
  errors: string[];
} {
  const result = Papa.parse<ParsedRow>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => norm(h),
  });

  const rows = result.data;
  const errors = result.errors.map((e) => e.message);

  if (sourceType === 'CPT') {
    return {
      cpt_rows: rows.map((r) => normRow(r)).map((r): RawCPTRow => ({
        hole_id: str(r, 'hole_id', 'hole', 'cpt_id', 'id'),
        elevation: num(r, 'elevation', 'elev', 'mAOD'),
        qc: num(r, 'qc'),
        fs: num(r, 'fs'),
        u2: num(r, 'u2', 'u'),
      })),
      spt_rows: [], shear_box_rows: [], triaxial_rows: [], errors,
    };
  }

  if (sourceType === 'SPT') {
    return {
      spt_rows: rows.map((r) => normRow(r)).map((r): RawSPTRow => ({
        hole_id: str(r, 'hole_id', 'hole', 'borehole', 'id'),
        elevation: num(r, 'elevation', 'elev', 'mAOD'),
        N_measured: num(r, 'n_measured', 'n', 'nval'),
        rod_length: num(r, 'rod_length', 'rod'),
        hammer_type: (str(r, 'hammer_type', 'hammer') || 'safety') as HammerType,
        energy_ratio: num(r, 'energy_ratio', 'er') || 60,
      })),
      cpt_rows: [], shear_box_rows: [], triaxial_rows: [], errors,
    };
  }

  if (sourceType === 'ShearBox') {
    return {
      shear_box_rows: rows.map((r) => normRow(r)).map((r): RawShearBoxRow => ({
        sample_id: str(r, 'sample_id', 'sample', 'id'),
        hole_id: str(r, 'hole_id', 'hole', 'borehole'),
        geo_unit: str(r, 'geo_unit', 'unit', 'geology'),
        elevation: num(r, 'elevation', 'elev', 'mAOD'),
        normal_stress: num(r, 'normal_stress', 'sigma_n', 'normal'),
        shear_stress: num(r, 'shear_stress', 'tau', 'shear'),
      })),
      cpt_rows: [], spt_rows: [], triaxial_rows: [], errors,
    };
  }

  if (sourceType === 'Triaxial') {
    return {
      triaxial_rows: rows.map((r) => normRow(r)).map((r): RawTriaxialSpecimen => ({
        sample_id: str(r, 'sample_id', 'sample', 'id'),
        hole_id: str(r, 'hole_id', 'hole', 'borehole'),
        geo_unit: str(r, 'geo_unit', 'unit', 'geology'),
        elevation: num(r, 'elevation', 'elev', 'mAOD'),
        test_type: (str(r, 'test_type', 'type') || 'CD') as TestType,
        cell_pressure: num(r, 'cell_pressure', 'cell', 'sigma3'),
        deviator_stress_at_failure: num(r, 'deviator_stress_at_failure', 'deviator', 'devf'),
        pore_pressure_at_failure: num(r, 'pore_pressure_at_failure', 'pore', 'pvf'),
      })),
      cpt_rows: [], spt_rows: [], shear_box_rows: [], errors,
    };
  }

  return { cpt_rows: [], spt_rows: [], shear_box_rows: [], triaxial_rows: [], errors: ['Unknown source type'] };
}
