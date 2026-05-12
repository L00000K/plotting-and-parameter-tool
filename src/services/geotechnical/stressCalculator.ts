import type { GeoUnit } from '@/types';

const PA = 100; // atmospheric pressure kPa

export interface StressState {
  sigma_v: number;      // total vertical stress kPa
  sigma_v_eff: number;  // effective vertical stress kPa
  pa: number;           // atmospheric pressure reference (100 kPa)
  depth: number;        // m below ground level
}

/**
 * Compute vertical stress at a given elevation, integrating unit weights
 * from the ground surface down through the ground model.
 */
export function computeStressAtElevation(
  elevation: number,
  groundLevel: number,
  gwtElevation: number,
  units: GeoUnit[]
): StressState {
  const depth = groundLevel - elevation;
  const sorted = [...units].sort((a, b) => b.top_elevation - a.top_elevation);

  let sigma_v = 0;
  let currentElev = groundLevel;

  for (const unit of sorted) {
    if (currentElev <= elevation) break;

    const layerTop = Math.min(currentElev, unit.top_elevation);
    const layerBase = Math.max(elevation, unit.base_elevation);
    if (layerTop <= layerBase) continue;

    const thickness = layerTop - layerBase;
    // Average unit weight accounting for groundwater within the layer
    const gamma = layerTop > gwtElevation && layerBase >= gwtElevation
      ? unit.gamma          // fully above GWT
      : layerBase < gwtElevation && layerTop <= gwtElevation
        ? unit.gamma_sat    // fully below GWT
        : (() => {
            // layer straddles GWT
            const aboveGWT = layerTop - gwtElevation;
            const belowGWT = gwtElevation - layerBase;
            return (unit.gamma * aboveGWT + unit.gamma_sat * belowGWT) / thickness;
          })();

    sigma_v += gamma * thickness;
    currentElev = layerBase;
  }

  const gw_depth = Math.max(0, gwtElevation - elevation);  // depth of water above point (0 if above GWT)
  const u = 9.81 * (elevation < gwtElevation ? gwtElevation - elevation : 0);
  const sigma_v_eff = Math.max(sigma_v - u, 1.0); // min 1 kPa to avoid divide-by-zero

  return { sigma_v, sigma_v_eff, pa: PA, depth };
}

export { PA };
