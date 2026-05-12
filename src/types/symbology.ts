import type { SourceType } from './raw-data';
import type { CorrelationId } from './correlations';

export type MarkerShape =
  | 'circle'
  | 'circle-open'
  | 'cross'
  | 'x'
  | 'square'
  | 'diamond'
  | 'triangle-up'
  | 'star';

export interface MarkerStyle {
  source_type: SourceType;
  correlation_id?: CorrelationId;  // undefined = applies to all correlations for source_type
  color: string;
  size: number;
  opacity: number;   // 0–1
  shape: MarkerShape;
}
