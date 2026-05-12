import { useProjectStore } from '@/store/useProjectStore';
import { GeoUnitEditor } from './GeoUnitEditor';

export function ParameterManager() {
  const ground_model = useProjectStore((s) => s.ground_model);
  const setGroundLevel = useProjectStore((s) => s.setGroundLevel);
  const setGWT = useProjectStore((s) => s.setGWT);
  const addGeoUnit = useProjectStore((s) => s.addGeoUnit);
  const units = ground_model.units;

  return (
    <div className="space-y-4 overflow-y-auto h-full pr-1">
      {/* Site parameters */}
      <div className="border border-slate-700 rounded-lg p-3 space-y-2">
        <h3 className="text-sm font-semibold text-slate-300">Site Parameters</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-slate-400">
            Ground Level (m AOD)
            <input
              type="number"
              step="0.1"
              value={ground_model.ground_level}
              onChange={(e) => setGroundLevel(parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs"
            />
          </label>
          <label className="text-xs text-slate-400">
            GWT Elevation (m AOD)
            <input
              type="number"
              step="0.1"
              value={ground_model.gwt_elevation}
              onChange={(e) => setGWT(parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs"
            />
          </label>
        </div>
      </div>

      {/* Geological units */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Geological Units</h3>
          <button
            onClick={() => addGeoUnit({
              name: `Unit ${units.length + 1}`,
              top_elevation: units.length > 0 ? units[units.length - 1].base_elevation : ground_model.ground_level,
              base_elevation: units.length > 0 ? units[units.length - 1].base_elevation - 5 : ground_model.ground_level - 5,
              gamma: 19,
              gamma_sat: 20,
              phi_cv: 33,
            })}
            className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded cursor-pointer"
          >
            + Add Unit
          </button>
        </div>
        {units.map((unit) => <GeoUnitEditor key={unit.id} unit={unit} />)}
      </div>
    </div>
  );
}
