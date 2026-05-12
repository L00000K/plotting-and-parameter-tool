import { useEffect, useRef, useCallback } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { pyodideService } from './PyodideService';
import { computeStressAtElevation } from '@/services/geotechnical/stressCalculator';
import { correctSPT } from '@/services/geotechnical/sptCorrections';
import { shearBoxPhi, triaxialPhi } from '@/services/geotechnical/regressionUtils';
import { getUnitAtElevation, elevationToDepth } from '@/utils/depthUtils';
import type { InterpretedRow } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const DEBOUNCE_MS = 800;

export function useEquationRecalculation() {
  const store = useProjectStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);

  const runCalculations = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    const { datasets, ground_model, correlations } = useProjectStore.getState();
    const { units, gwt_elevation, ground_level } = ground_model;
    const newRows: InterpretedRow[] = [];

    // --- CPT correlations (Pyodide) ---
    const cptCorrelations = correlations.filter((c) => c.source_type === 'CPT' && c.active);
    const allCPTRows = datasets.flatMap((d) => d.cpt_rows);

    for (const corr of cptCorrelations) {
      if (pyodideService.getPhase() !== 'ready') continue;
      const batchVars: Record<string, number>[] = allCPTRows.map((row) => {
        const stress = computeStressAtElevation(row.elevation, ground_level, gwt_elevation, units);
        const unit = getUnitAtElevation(row.elevation, units);
        return {
          qc: row.qc,
          fs: row.fs,
          u2: row.u2,
          elevation: row.elevation,
          depth: elevationToDepth(row.elevation, ground_level),
          sigma_v: stress.sigma_v,
          sigma_v_eff: stress.sigma_v_eff,
          pa: stress.pa,
          phi_cv: unit?.phi_cv ?? 33,
          ...corr.constants,
        };
      });

      const result = await pyodideService.runBatch(corr.equation_code, batchVars);
      allCPTRows.forEach((row, i) => {
        const unit = getUnitAtElevation(row.elevation, units);
        newRows.push({
          id: `${row.hole_id}_${row.elevation}_${corr.id}`,
          hole_id: row.hole_id,
          elevation: row.elevation,
          source_type: 'CPT',
          correlation_id: corr.id,
          correlation_name: corr.name,
          phi_calculated: result.results[i],
          geo_unit: unit?.name ?? 'Unknown',
          error: result.errors[i] ?? undefined,
        });
      });
    }

    // --- SPT correlations (Pyodide) ---
    const sptCorrelations = correlations.filter((c) => c.source_type === 'SPT' && c.active);
    const allSPTRows = datasets.flatMap((d) => d.spt_rows);

    for (const corr of sptCorrelations) {
      if (pyodideService.getPhase() !== 'ready') continue;
      const batchVars: Record<string, number>[] = allSPTRows.map((row) => {
        const stress = computeStressAtElevation(row.elevation, ground_level, gwt_elevation, units);
        const { N60, N160 } = correctSPT(row, stress.sigma_v_eff);
        const unit = getUnitAtElevation(row.elevation, units);
        return {
          N_measured: row.N_measured,
          N60,
          N160,
          elevation: row.elevation,
          depth: elevationToDepth(row.elevation, ground_level),
          sigma_v: stress.sigma_v,
          sigma_v_eff: stress.sigma_v_eff,
          pa: stress.pa,
          phi_cv: unit?.phi_cv ?? 33,
          ...corr.constants,
        };
      });

      const result = await pyodideService.runBatch(corr.equation_code, batchVars);
      allSPTRows.forEach((row, i) => {
        const unit = getUnitAtElevation(row.elevation, units);
        newRows.push({
          id: `${row.hole_id}_${row.elevation}_${corr.id}`,
          hole_id: row.hole_id,
          elevation: row.elevation,
          source_type: 'SPT',
          correlation_id: corr.id,
          correlation_name: corr.name,
          phi_calculated: result.results[i],
          geo_unit: unit?.name ?? 'Unknown',
          error: result.errors[i] ?? undefined,
        });
      });
    }

    // --- Shear box regression (TypeScript) ---
    const shearBoxCorr = correlations.find((c) => c.id === 'shear_box_regression' && c.active);
    if (shearBoxCorr) {
      const allSBRows = datasets.flatMap((d) => d.shear_box_rows);
      for (const unit of units) {
        const unitRows = allSBRows.filter((r) => r.geo_unit === unit.name);
        if (unitRows.length < 2) continue;
        const phi = shearBoxPhi(
          unitRows.map((r) => r.normal_stress),
          unitRows.map((r) => r.shear_stress)
        );
        // Add one representative row per unit at mid-elevation
        const midElev = (unit.top_elevation + unit.base_elevation) / 2;
        unitRows.forEach((row) => {
          newRows.push({
            id: `${row.sample_id}_${row.elevation}_shear_box`,
            hole_id: row.hole_id,
            elevation: row.elevation,
            source_type: 'ShearBox',
            correlation_id: 'shear_box_regression',
            correlation_name: shearBoxCorr.name,
            phi_calculated: phi,
            geo_unit: unit.name,
          });
        });
        void midElev;
      }
    }

    // --- Triaxial regression (TypeScript) ---
    const triaxCorr = correlations.find((c) => c.id === 'triaxial_regression' && c.active);
    if (triaxCorr) {
      const allTXRows = datasets.flatMap((d) => d.triaxial_rows);
      for (const unit of units) {
        const unitRows = allTXRows.filter((r) => r.geo_unit === unit.name);
        if (unitRows.length < 2) continue;
        const sigma3eff = unitRows.map((r) => r.cell_pressure - r.pore_pressure_at_failure);
        const sigma1eff = unitRows.map((r) => r.cell_pressure + r.deviator_stress_at_failure - r.pore_pressure_at_failure);
        const phi = triaxialPhi(sigma3eff, sigma1eff);
        unitRows.forEach((row) => {
          newRows.push({
            id: `${row.sample_id}_${row.elevation}_triaxial_${uuidv4().slice(0,8)}`,
            hole_id: row.hole_id,
            elevation: row.elevation,
            source_type: 'Triaxial',
            correlation_id: 'triaxial_regression',
            correlation_name: triaxCorr.name,
            phi_calculated: phi,
            geo_unit: unit.name,
          });
        });
      }
    }

    useProjectStore.getState().setInterpretedCache(newRows);
    runningRef.current = false;
  }, []);

  useEffect(() => {
    // Trigger recalculation when relevant store slices change
    const unsubscribe = useProjectStore.subscribe((state, prev) => {
      const changed =
        state.datasets !== prev.datasets ||
        state.correlations !== prev.correlations ||
        state.ground_model !== prev.ground_model ||
        state.pyodide_status !== prev.pyodide_status;
      if (!changed) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(runCalculations, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [runCalculations]);

  return { runCalculations };
}
