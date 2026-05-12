import { useState, useCallback } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { EquationEditor } from '@/components/correlations/EquationEditor';
import type { DesignLine, DesignLineMode, DesignLineSegment } from '@/types';

function DesignLineCard({ unitId, unitName, unitColor, topElev, baseElev }: {
  unitId: string; unitName: string; unitColor: string; topElev: number; baseElev: number;
}) {
  const designLines = useProjectStore((s) => s.design_lines);
  const setDesignLine = useProjectStore((s) => s.setDesignLine);
  const removeDesignLine = useProjectStore((s) => s.removeDesignLine);
  const existing = designLines.find((d) => d.geo_unit_id === unitId);
  const [open, setOpen] = useState(!!existing);
  const [mode, setMode] = useState<DesignLineMode>(existing?.mode ?? 'constant');
  const [constPhi, setConstPhi] = useState(existing?.constant_phi ?? 30);
  const [segments, setSegments] = useState<DesignLineSegment[]>(
    existing?.segments ?? [{ elev_from: topElev, elev_to: baseElev, phi: 30 }]
  );
  const [eqCode, setEqCode] = useState(existing?.equation_code ?? 'phi = 30 + 0.2 * depth');
  const handleEqChange = useCallback((code: string) => setEqCode(code), []);

  function save() {
    setDesignLine({ geo_unit_id: unitId, mode, constant_phi: constPhi, segments, equation_code: eqCode });
    setOpen(true);
  }

  function remove() {
    removeDesignLine(unitId);
    setOpen(false);
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Header row — always visible */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-3 h-3 rounded-sm border border-gray-200 flex-shrink-0" style={{ backgroundColor: unitColor }} />
        <span className="text-sm font-semibold text-gray-800">{unitName}</span>
        <span className="text-xs text-gray-400">{topElev.toFixed(1)}–{baseElev.toFixed(1)} m AOD</span>
        <div className="ml-auto flex items-center gap-2">
          {existing && !open && (
            <span className="text-xs text-gray-500 italic">
              {existing.mode === 'constant' ? `φ' = ${existing.constant_phi}°` : existing.mode}
            </span>
          )}
          {existing && (
            <button onClick={remove} className="text-red-400 hover:text-red-600 text-xs cursor-pointer">
              Remove
            </button>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            className={`text-xs px-2.5 py-1 rounded cursor-pointer border font-medium ${
              open
                ? 'bg-blue-600 text-white border-blue-600'
                : existing
                ? 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
            }`}
          >
            {open ? 'Close' : existing ? 'Edit' : 'Add Design Line'}
          </button>
        </div>
      </div>

      {/* Expandable form */}
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-gray-100">
          <div className="flex gap-2">
            {(['constant', 'segmented', 'equation'] as DesignLineMode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`text-xs px-2 py-1 rounded cursor-pointer border ${
                  mode === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {mode === 'constant' && (
            <label className="text-xs text-gray-600 flex items-center gap-2">
              φ' (°):
              <input type="number" step="0.5" value={constPhi}
                onChange={(e) => setConstPhi(parseFloat(e.target.value) || 0)}
                className="w-20 bg-white border border-gray-300 rounded px-2 py-1 text-gray-800 focus:outline-none focus:border-blue-400" />
            </label>
          )}

          {mode === 'segmented' && (
            <div className="space-y-1">
              <div className="grid grid-cols-4 gap-1 text-xs text-gray-500 font-medium px-1">
                <span>From (m AOD)</span><span>To (m AOD)</span><span>φ' (°)</span><span />
              </div>
              {segments.map((seg, i) => (
                <div key={i} className="grid grid-cols-4 gap-1">
                  <input type="number" step="0.5" value={seg.elev_from}
                    onChange={(e) => { const ns = [...segments]; ns[i] = { ...ns[i], elev_from: parseFloat(e.target.value) || 0 }; setSegments(ns); }}
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-800 text-xs focus:outline-none focus:border-blue-400" />
                  <input type="number" step="0.5" value={seg.elev_to}
                    onChange={(e) => { const ns = [...segments]; ns[i] = { ...ns[i], elev_to: parseFloat(e.target.value) || 0 }; setSegments(ns); }}
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-800 text-xs focus:outline-none focus:border-blue-400" />
                  <input type="number" step="0.5" value={seg.phi}
                    onChange={(e) => { const ns = [...segments]; ns[i] = { ...ns[i], phi: parseFloat(e.target.value) || 0 }; setSegments(ns); }}
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-800 text-xs focus:outline-none focus:border-blue-400" />
                  <button onClick={() => setSegments(segments.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 text-xs cursor-pointer">✕</button>
                </div>
              ))}
              <button onClick={() => setSegments([...segments, { elev_from: baseElev + 1, elev_to: baseElev, phi: 30 }])}
                className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">+ Add segment</button>
            </div>
          )}

          {mode === 'equation' && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500">
                Available: <code className="text-green-700 font-mono">elevation</code> (m AOD),{' '}
                <code className="text-green-700 font-mono">depth</code> (m bgl). Assign to{' '}
                <code className="text-green-700 font-mono">phi</code>.
              </p>
              <EquationEditor value={eqCode} onChange={handleEqChange} height="100px" />
            </div>
          )}

          <button onClick={save}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 rounded cursor-pointer font-medium">
            {existing ? 'Update' : 'Save Design Line'}
          </button>
        </div>
      )}
    </div>
  );
}

export function DesignLinePanel() {
  const units = useProjectStore((s) => s.ground_model.units);

  if (units.length === 0) {
    return (
      <div className="p-3 text-xs text-gray-500 space-y-2">
        <p>No geological units defined. Go to <strong>Parameters</strong> to add units first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto h-full pr-1">
      <p className="text-xs text-gray-500 px-1">
        Click <strong>Add Design Line</strong> on any unit to draw a design line on the plot.
      </p>
      {units.map((u) => (
        <DesignLineCard key={u.id} unitId={u.id} unitName={u.name} unitColor={u.color}
          topElev={u.top_elevation} baseElev={u.base_elevation} />
      ))}
    </div>
  );
}
