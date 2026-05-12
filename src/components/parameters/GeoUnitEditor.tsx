import { useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import type { GeoUnit } from '@/types';

interface Props { unit: GeoUnit; }

export function GeoUnitEditor({ unit }: Props) {
  const [open, setOpen] = useState(true);
  const updateGeoUnit = useProjectStore((s) => s.updateGeoUnit);
  const removeGeoUnit = useProjectStore((s) => s.removeGeoUnit);

  function update(field: keyof GeoUnit, value: unknown) {
    updateGeoUnit(unit.id, { [field]: value });
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50"
        onClick={() => setOpen((o) => !o)}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: unit.color }} />
          <span className="text-sm font-medium text-gray-800">{unit.name}</span>
          <span className="text-xs text-gray-400">
            {unit.top_elevation.toFixed(1)}–{unit.base_elevation.toFixed(1)} m AOD
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); removeGeoUnit(unit.id); }}
            className="text-red-400 hover:text-red-600 text-xs cursor-pointer">✕</button>
          <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="px-3 pb-3 pt-1 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-gray-100">
          <Field label="Name" value={unit.name} type="text" onChange={(v) => update('name', v)} />
          <Field label="Color" value={unit.color} type="color" onChange={(v) => update('color', v)} />
          <Field label="Top Elevation (m AOD)" value={unit.top_elevation} type="number" step="0.5"
            onChange={(v) => update('top_elevation', parseFloat(v))} />
          <Field label="Base Elevation (m AOD)" value={unit.base_elevation} type="number" step="0.5"
            onChange={(v) => update('base_elevation', parseFloat(v))} />
          <Field label="γ bulk (kN/m³)" value={unit.gamma} type="number" step="0.5"
            onChange={(v) => update('gamma', parseFloat(v))} />
          <Field label="γ sat (kN/m³)" value={unit.gamma_sat} type="number" step="0.5"
            onChange={(v) => update('gamma_sat', parseFloat(v))} />
          <Field label="φ_cv (°)" value={unit.phi_cv} type="number" step="1"
            onChange={(v) => update('phi_cv', parseFloat(v))} />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, type, step, onChange }: {
  label: string; value: string | number; type: string; step?: string; onChange: (v: string) => void;
}) {
  return (
    <label className="text-xs text-gray-600">
      {label}
      <input type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 block w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-800 text-xs focus:outline-none focus:border-blue-400" />
    </label>
  );
}
