import { useState, useCallback } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { EquationEditor } from '@/components/correlations/EquationEditor';
import type { DesignLine, DesignLineMode, DesignLineSegment } from '@/types';

function DesignLineCard({ unitId, unitName, unitColor, topElev, baseElev }: {
  unitId: string; unitName: string; unitColor: string;
  topElev: number; baseElev: number;
}) {
  const designLines = useProjectStore((s) => s.design_lines);
  const setDesignLine = useProjectStore((s) => s.setDesignLine);
  const removeDesignLine = useProjectStore((s) => s.removeDesignLine);
  const existing = designLines.find((d) => d.geo_unit_id === unitId);

  const [mode, setMode] = useState<DesignLineMode>(existing?.mode ?? 'constant');
  const [constPhi, setConstPhi] = useState(existing?.constant_phi ?? 30);
  const [segments, setSegments] = useState<DesignLineSegment[]>(
    existing?.segments ?? [{ elev_from: topElev, elev_to: baseElev, phi: 30 }]
  );
  const [eqCode, setEqCode] = useState(existing?.equation_code ?? 'phi = 30 + 0.2 * depth');

  const handleEqChange = useCallback((code: string) => setEqCode(code), []);

  function save() {
    const dl: DesignLine = {
      geo_unit_id: unitId,
      mode,
      constant_phi: constPhi,
      segments,
      equation_code: eqCode,
    };
    setDesignLine(dl);
  }

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: unitColor }} />
        <span className="text-sm font-semibold text-slate-200">{unitName}</span>
        <span className="text-xs text-slate-500">{topElev.toFixed(1)}–{baseElev.toFixed(1)} m AOD</span>
        {existing && (
          <button
            onClick={() => removeDesignLine(unitId)}
            className="ml-auto text-red-400 hover:text-red-300 text-xs cursor-pointer"
          >Remove</button>
        )}
      </div>

      <div className="px-3 py-2 space-y-3">
        <div className="flex gap-2">
          {(['constant', 'segmented', 'equation'] as DesignLineMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-xs px-2 py-1 rounded cursor-pointer ${
                mode === m ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {mode === 'constant' && (
          <label className="text-xs text-slate-400 flex items-center gap-2">
            φ' (°):
            <input
              type="number"
              step="0.5"
              value={constPhi}
              onChange={(e) => setConstPhi(parseFloat(e.target.value) || 0)}
              className="w-20 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200"
            />
          </label>
        )}

        {mode === 'segmented' && (
          <div className="space-y-1">
            <div className="grid grid-cols-4 gap-1 text-xs text-slate-500 font-medium px-1">
              <span>From (m AOD)</span><span>To (m AOD)</span><span>φ' (°)</span><span></span>
            </div>
            {segments.map((seg, i) => (
              <div key={i} className="grid grid-cols-4 gap-1">
                <input type="number" step="0.5" value={seg.elev_from}
                  onChange={(e) => {
                    const ns = [...segments]; ns[i] = { ...ns[i], elev_from: parseFloat(e.target.value) || 0 };
                    setSegments(ns);
                  }}
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs" />
                <input type="number" step="0.5" value={seg.elev_to}
                  onChange={(e) => {
                    const ns = [...segments]; ns[i] = { ...ns[i], elev_to: parseFloat(e.target.value) || 0 };
                    setSegments(ns);
                  }}
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs" />
                <input type="number" step="0.5" value={seg.phi}
                  onChange={(e) => {
                    const ns = [...segments]; ns[i] = { ...ns[i], phi: parseFloat(e.target.value) || 0 };
                    setSegments(ns);
                  }}
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs" />
                <button onClick={() => setSegments(segments.filter((_, j) => j !== i))}
                  className="text-red-400 hover:text-red-300 text-xs cursor-pointer">✕</button>
              </div>
            ))}
            <button
              onClick={() => setSegments([...segments, { elev_from: baseElev + 1, elev_to: baseElev, phi: 30 }])}
              className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
            >+ Add segment</button>
          </div>
        )}

        {mode === 'equation' && (
          <div className="space-y-1">
            <p className="text-xs text-slate-500">
              Available: <code className="text-green-400">elevation</code> (m AOD),{' '}
              <code className="text-green-400">depth</code> (m bgl). Assign to{' '}
              <code className="text-green-400">phi</code>.
            </p>
            <EquationEditor value={eqCode} onChange={handleEqChange} height="100px" />
          </div>
        )}

        <button
          onClick={save}
          className="w-full bg-blue-700 hover:bg-blue-600 text-white text-xs py-1.5 rounded cursor-pointer"
        >
          {existing ? 'Update Design Line' : 'Add Design Line'}
        </button>
      </div>
    </div>
  );
}

export function DesignLinePanel() {
  const units = useProjectStore((s) => s.ground_model.units);

  return (
    <div className="space-y-3 overflow-y-auto h-full pr-1">
      <p className="text-xs text-slate-500">
        Define a design line for each geological unit. Modes: constant value, segmented (step function), or Python equation.
      </p>
      {units.map((u) => (
        <DesignLineCard
          key={u.id}
          unitId={u.id}
          unitName={u.name}
          unitColor={u.color}
          topElev={u.top_elevation}
          baseElev={u.base_elevation}
        />
      ))}
    </div>
  );
}
