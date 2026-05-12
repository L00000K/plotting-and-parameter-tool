import type {
  RawCPTRow, RawSPTRow, RawShearBoxRow, RawTriaxialSpecimen,
  HammerType, TestType,
} from '@/types';

interface ParsedAGS {
  cpt_rows: RawCPTRow[];
  spt_rows: RawSPTRow[];
  shear_box_rows: RawShearBoxRow[];
  triaxial_rows: RawTriaxialSpecimen[];
  loca: Record<string, { ground_level: number }>;
  errors: string[];
}

function parseAGSTokens(line: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      tokens.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  tokens.push(current.trim());
  return tokens;
}

function num(v: string | undefined): number {
  const n = parseFloat(v ?? '');
  return isNaN(n) ? 0 : n;
}

// AGS column name → internal field
const LOCA_MAP: Record<string, string> = {
  LOCA_ID: 'id', LOCA_GL: 'ground_level', LOCA_NATE: 'easting', LOCA_NATN: 'northing',
};
const SCPT_MAP: Record<string, string> = {
  LOCA_ID: 'hole_id', SCPT_DPTH: 'depth', SCPT_RES: 'qc', SCPT_FRES: 'fs', SCPT_PWP2: 'u2',
};
const ISPT_MAP: Record<string, string> = {
  LOCA_ID: 'hole_id', ISPT_DPTH: 'depth', ISPT_NVAL: 'N_measured',
  ISPT_RLEN: 'rod_length', ISPT_ENGY: 'energy_ratio',
};
const LBSS_MAP: Record<string, string> = {
  LOCA_ID: 'hole_id', SAMP_ID: 'sample_id', LBSS_NORM: 'normal_stress',
  LBSS_SHST: 'shear_stress', SAMP_DPTH: 'depth',
};
const LTXA_MAP: Record<string, string> = {
  LOCA_ID: 'hole_id', SAMP_ID: 'sample_id', SAMP_DPTH: 'depth',
  LTXA_TESN: 'test_type', LTXA_CELL: 'cell_pressure',
  LTXA_DEVF: 'deviator_stress_at_failure', LTXA_PVF: 'pore_pressure_at_failure',
};
const GEOL_MAP: Record<string, string> = {
  LOCA_ID: 'hole_id', GEOL_TOP: 'top', GEOL_BASE: 'base', GEOL_DESC: 'desc',
};

export function parseAGS4(content: string): ParsedAGS {
  const lines = content.split(/\r?\n/);
  const groups: Record<string, Record<string, string>[]> = {};
  const headers: Record<string, string[]> = {};
  let currentGroup = '';
  const errors: string[] = [];

  for (const line of lines) {
    if (!line.trim() || line.startsWith('"*"') || line.startsWith('*')) continue;
    const tokens = parseAGSTokens(line);
    const marker = tokens[0];

    if (marker === 'GROUP') {
      currentGroup = tokens[1] ?? '';
      if (currentGroup) groups[currentGroup] = [];
    } else if (marker === 'HEADING' && currentGroup) {
      headers[currentGroup] = tokens.slice(1);
    } else if (marker === 'DATA' && currentGroup && headers[currentGroup]) {
      const vals = tokens.slice(1);
      const row: Record<string, string> = {};
      headers[currentGroup].forEach((h, i) => { row[h] = vals[i] ?? ''; });
      groups[currentGroup].push(row);
    }
  }

  // Build LOCA lookup (hole_id → ground_level)
  const loca: Record<string, { ground_level: number }> = {};
  for (const row of groups['LOCA'] ?? []) {
    const id = row['LOCA_ID'];
    if (id) loca[id] = { ground_level: num(row['LOCA_GL']) || 0 };
  }

  const cpt_rows: RawCPTRow[] = (groups['SCPT'] ?? []).map((row) => {
    const holeId = row[SCPT_MAP['LOCA_ID']] ?? row['LOCA_ID'];
    const gl = loca[holeId]?.ground_level ?? 0;
    const depth = num(row['SCPT_DPTH']);
    return {
      hole_id: holeId,
      elevation: gl - depth,
      qc: num(row['SCPT_RES']),
      fs: num(row['SCPT_FRES']),
      u2: num(row['SCPT_PWP2']),
    };
  });

  const spt_rows: RawSPTRow[] = (groups['ISPT'] ?? []).map((row) => {
    const holeId = row['LOCA_ID'];
    const gl = loca[holeId]?.ground_level ?? 0;
    const depth = num(row['ISPT_DPTH']);
    return {
      hole_id: holeId,
      elevation: gl - depth,
      N_measured: num(row['ISPT_NVAL']),
      rod_length: num(row['ISPT_RLEN']) || depth + 1,
      hammer_type: 'safety' as HammerType,
      energy_ratio: num(row['ISPT_ENGY']) || 60,
    };
  });

  const shear_box_rows: RawShearBoxRow[] = (groups['LBSS'] ?? []).map((row) => {
    const holeId = row['LOCA_ID'];
    const gl = loca[holeId]?.ground_level ?? 0;
    const depth = num(row['SAMP_DPTH']);
    return {
      sample_id: row['SAMP_ID'] ?? '',
      hole_id: holeId,
      geo_unit: row['GEOL_UGRP'] ?? '',
      elevation: gl - depth,
      normal_stress: num(row['LBSS_NORM']),
      shear_stress: num(row['LBSS_SHST']),
    };
  });

  const triaxial_rows: RawTriaxialSpecimen[] = (groups['LTXA'] ?? []).map((row) => {
    const holeId = row['LOCA_ID'];
    const gl = loca[holeId]?.ground_level ?? 0;
    const depth = num(row['SAMP_DPTH']);
    const testTypeRaw = row['LTXA_TESN'] ?? '';
    const test_type: TestType = testTypeRaw.includes('U') ? 'CU' : 'CD';
    return {
      sample_id: row['SAMP_ID'] ?? '',
      hole_id: holeId,
      geo_unit: row['GEOL_UGRP'] ?? '',
      elevation: gl - depth,
      test_type,
      cell_pressure: num(row['LTXA_CELL']),
      deviator_stress_at_failure: num(row['LTXA_DEVF']),
      pore_pressure_at_failure: num(row['LTXA_PVF']),
    };
  });

  void LOCA_MAP; void GEOL_MAP; void ISPT_MAP; void LBSS_MAP; void LTXA_MAP;

  return { cpt_rows, spt_rows, shear_box_rows, triaxial_rows, loca, errors };
}
