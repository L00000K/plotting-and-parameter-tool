import type { ImportedDataset } from './raw-data';
import type { GroundModel } from './geo-model';
import type { CorrelationDef } from './correlations';
import type { MarkerStyle } from './symbology';
import type { DesignLine, InterpretedRow } from './interpreted-data';

export interface ProjectState {
  project_name: string;
  datasets: ImportedDataset[];
  ground_model: GroundModel;
  correlations: CorrelationDef[];
  symbology: MarkerStyle[];
  design_lines: DesignLine[];
  interpreted_cache: InterpretedRow[];  // cached Pyodide results
}
