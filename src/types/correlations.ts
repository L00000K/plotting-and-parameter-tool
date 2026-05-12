import type { SourceType } from './raw-data';

export type CorrelationId =
  | 'kulhawy_mayne_1990'
  | 'robertson_2009'
  | 'peck_wolff_1989'
  | 'hatanaka_uchida_1996'
  | 'shear_box_regression'
  | 'triaxial_regression';

export interface CorrelationConstants {
  [key: string]: number;
}

export interface CorrelationDef {
  id: CorrelationId;
  name: string;
  reference: string;
  source_type: SourceType;
  active: boolean;
  equation_code: string;  // Python source string; must assign to `phi`
  constants: CorrelationConstants;
  // constants are injected as Python variables before equation_code runs
  description: string;
}
