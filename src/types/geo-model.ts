export interface GeoUnit {
  id: string;
  name: string;
  top_elevation: number;   // m AOD
  base_elevation: number;  // m AOD
  gamma: number;           // kN/m³ bulk unit weight above GWT
  gamma_sat: number;       // kN/m³ saturated unit weight
  phi_cv: number;          // degrees, critical state friction angle
  color: string;           // hex
}

export interface GroundModel {
  gwt_elevation: number;   // m AOD
  ground_level: number;    // m AOD (surface elevation)
  units: GeoUnit[];        // ordered by top_elevation descending (shallowest first)
}
