import type { MarkerStyle } from '@/types';

export const DEFAULT_SYMBOLOGY: MarkerStyle[] = [
  { source_type: 'CPT',      color: '#3b82f6', size: 4,  opacity: 0.4, shape: 'circle' },
  { source_type: 'SPT',      color: '#f97316', size: 8,  opacity: 1.0, shape: 'x' },
  { source_type: 'ShearBox', color: '#22c55e', size: 10, opacity: 1.0, shape: 'cross' },
  { source_type: 'Triaxial', color: '#a855f7', size: 10, opacity: 1.0, shape: 'diamond' },
];
