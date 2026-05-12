import type { GeoUnit } from '@/types';

export function getUnitAtElevation(elevation: number, units: GeoUnit[]): GeoUnit | undefined {
  return units.find(u => elevation <= u.top_elevation && elevation >= u.base_elevation);
}

export function elevationToDepth(elevation: number, groundLevel: number): number {
  return groundLevel - elevation;
}

export function depthToElevation(depth: number, groundLevel: number): number {
  return groundLevel - depth;
}
