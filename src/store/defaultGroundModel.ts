import type { GroundModel } from '@/types';
import { GEO_UNIT_COLORS } from '@/utils/colorPalette';

export const DEFAULT_GROUND_MODEL: GroundModel = {
  ground_level: 50.0,
  gwt_elevation: 48.5,
  units: [
    {
      id: 'unit-made-ground',
      name: 'Made Ground',
      top_elevation: 50.0,
      base_elevation: 48.0,
      gamma: 17.0,
      gamma_sat: 18.0,
      phi_cv: 30.0,
      color: GEO_UNIT_COLORS[0],
    },
    {
      id: 'unit-dense-sand',
      name: 'Dense Sand',
      top_elevation: 48.0,
      base_elevation: 35.0,
      gamma: 19.0,
      gamma_sat: 20.0,
      phi_cv: 33.0,
      color: GEO_UNIT_COLORS[1],
    },
    {
      id: 'unit-stiff-clay',
      name: 'Stiff Clay',
      top_elevation: 35.0,
      base_elevation: 20.0,
      gamma: 20.0,
      gamma_sat: 21.0,
      phi_cv: 25.0,
      color: GEO_UNIT_COLORS[2],
    },
  ],
};
