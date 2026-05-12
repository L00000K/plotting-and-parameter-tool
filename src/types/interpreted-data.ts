import type { SourceType } from './raw-data';
import type { CorrelationId } from './correlations';

export interface InterpretedRow {
  id: string;
  hole_id: string;
  elevation: number;      // m AOD
  source_type: SourceType;
  correlation_id: CorrelationId;
  correlation_name: string;
  phi_calculated: number | null;
  geo_unit: string;       // name of the GeoUnit at this elevation
  error?: string;
}

export type DesignLineMode = 'constant' | 'segmented' | 'equation';

export interface DesignLineSegment {
  elev_from: number;  // m AOD (top of segment)
  elev_to: number;    // m AOD (base of segment)
  phi: number;
}

export interface DesignLine {
  geo_unit_id: string;
  mode: DesignLineMode;
  constant_phi?: number;
  segments?: DesignLineSegment[];
  equation_code?: string;  // Python: elevation and depth available, assign to phi
}
