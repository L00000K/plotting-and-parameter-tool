import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type {
  ImportedDataset,
  GeoUnit,
  CorrelationDef,
  MarkerStyle,
  DesignLine,
  InterpretedRow,
  SourceType,
} from '@/types';
import { DEFAULT_GROUND_MODEL } from './defaultGroundModel';
import { DEFAULT_CORRELATIONS } from './defaultCorrelations';
import { DEFAULT_SYMBOLOGY } from './defaultSymbology';
import { GEO_UNIT_COLORS } from '@/utils/colorPalette';

interface PyodideStatus {
  phase: 'idle' | 'loading' | 'ready' | 'error';
  progress_message: string;
  error_message: string | null;
}

interface ProjectStore {
  project_name: string;
  datasets: ImportedDataset[];
  ground_model: typeof DEFAULT_GROUND_MODEL;
  correlations: CorrelationDef[];
  symbology: MarkerStyle[];
  design_lines: DesignLine[];
  interpreted_cache: InterpretedRow[];
  pyodide_status: PyodideStatus;

  // Actions
  setProjectName: (name: string) => void;
  addDataset: (ds: Omit<ImportedDataset, 'id' | 'imported_at'>) => void;
  removeDataset: (id: string) => void;

  setGroundLevel: (gl: number) => void;
  setGWT: (elev: number) => void;
  addGeoUnit: (unit: Omit<GeoUnit, 'id' | 'color'>) => void;
  updateGeoUnit: (id: string, partial: Partial<GeoUnit>) => void;
  removeGeoUnit: (id: string) => void;

  updateCorrelation: (id: string, partial: Partial<CorrelationDef>) => void;
  updateCorrelationCode: (id: string, code: string) => void;
  updateCorrelationConstants: (id: string, constants: Record<string, number>) => void;

  updateSymbology: (source_type: SourceType, partial: Partial<MarkerStyle>) => void;

  setDesignLine: (dl: DesignLine) => void;
  removeDesignLine: (geo_unit_id: string) => void;

  setInterpretedCache: (rows: InterpretedRow[]) => void;
  setPyodideStatus: (status: PyodideStatus) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    immer((set) => ({
      project_name: 'New Project',
      datasets: [],
      ground_model: DEFAULT_GROUND_MODEL,
      correlations: DEFAULT_CORRELATIONS,
      symbology: DEFAULT_SYMBOLOGY,
      design_lines: [],
      interpreted_cache: [],
      pyodide_status: { phase: 'idle', progress_message: '', error_message: null },

      setProjectName: (name) => set((s) => { s.project_name = name; }),

      addDataset: (ds) => set((s) => {
        s.datasets.push({ ...ds, id: uuidv4(), imported_at: new Date().toISOString() });
      }),

      removeDataset: (id) => set((s) => {
        s.datasets = s.datasets.filter((d) => d.id !== id);
      }),

      setGroundLevel: (gl) => set((s) => { s.ground_model.ground_level = gl; }),
      setGWT: (elev) => set((s) => { s.ground_model.gwt_elevation = elev; }),

      addGeoUnit: (unit) => set((s) => {
        const idx = s.ground_model.units.length;
        s.ground_model.units.push({
          ...unit,
          id: uuidv4(),
          color: GEO_UNIT_COLORS[idx % GEO_UNIT_COLORS.length],
        });
        s.ground_model.units.sort((a, b) => b.top_elevation - a.top_elevation);
      }),

      updateGeoUnit: (id, partial) => set((s) => {
        const u = s.ground_model.units.find((u) => u.id === id);
        if (u) Object.assign(u, partial);
        s.ground_model.units.sort((a, b) => b.top_elevation - a.top_elevation);
      }),

      removeGeoUnit: (id) => set((s) => {
        s.ground_model.units = s.ground_model.units.filter((u) => u.id !== id);
      }),

      updateCorrelation: (id, partial) => set((s) => {
        const c = s.correlations.find((c) => c.id === id);
        if (c) Object.assign(c, partial);
      }),

      updateCorrelationCode: (id, code) => set((s) => {
        const c = s.correlations.find((c) => c.id === id);
        if (c) c.equation_code = code;
      }),

      updateCorrelationConstants: (id, constants) => set((s) => {
        const c = s.correlations.find((c) => c.id === id);
        if (c) Object.assign(c.constants, constants);
      }),

      updateSymbology: (source_type, partial) => set((s) => {
        const m = s.symbology.find((m) => m.source_type === source_type);
        if (m) Object.assign(m, partial);
      }),

      setDesignLine: (dl) => set((s) => {
        const idx = s.design_lines.findIndex((d) => d.geo_unit_id === dl.geo_unit_id);
        if (idx >= 0) s.design_lines[idx] = dl;
        else s.design_lines.push(dl);
      }),

      removeDesignLine: (geo_unit_id) => set((s) => {
        s.design_lines = s.design_lines.filter((d) => d.geo_unit_id !== geo_unit_id);
      }),

      setInterpretedCache: (rows) => set((s) => { s.interpreted_cache = rows; }),

      setPyodideStatus: (status) => set((s) => { s.pyodide_status = status; }),
    })),
    {
      name: 'geo-parameter-tool',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        project_name: s.project_name,
        datasets: s.datasets,
        ground_model: s.ground_model,
        correlations: s.correlations,
        symbology: s.symbology,
        design_lines: s.design_lines,
        interpreted_cache: s.interpreted_cache,
      }),
    }
  )
);
