import { useState, useCallback } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { EquationEditor } from './EquationEditor';
import type { CorrelationDef } from '@/types';

const INJECTED_VARS: Record<string, string[]> = {
  CPT: ['qc (MPa)', 'fs (kPa)', 'u2 (kPa)', 'elevation', 'depth', 'sigma_v', 'sigma_v_eff', 'pa', 'phi_cv', '+ constants'],
  SPT: ['N_measured', 'N60', 'N160', 'elevation', 'depth', 'sigma_v', 'sigma_v_eff', 'pa', 'phi_cv', '+ constants'],
  ShearBox: ['(computed via regression — not editable)'],
  Triaxial: ['(computed via regression — not editable)'],
};

const SOURCE_COLORS: Record<string, string> = {
  CPT: 'bg-blue-100 text-blue-700',
  SPT: 'bg-orange-100 text-orange-700',
  ShearBox: 'bg-green-100 text-green-700',
  Triaxial: 'bg-purple-100 text-purple-700',
};

function CorrelationCard({ corr }: { corr: CorrelationDef }) {
  const [open, setOpen] = useState(false);
  const updateCorrelation = useProjectStore((s) => s.updateCorrelation);
  const updateCorrelationCode = useProjectStore((s) => s.updateCorrelationCode);
  const updateCorrelationConstants = useProjectStore((s) => s.updateCorrelationConstants);
  const handleCodeChange = useCallback((code: string) => updateCorrelationCode(corr.id, code), [corr.id, updateCorrelationCode]);
  const isReadOnly = corr.source_type === 'ShearBox' || corr.source_type === 'Triaxial';

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50"
        onClick={() => setOpen((o) => !o)}>
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={corr.active}
            onChange={(e) => { e.stopPropagation(); updateCorrelation(corr.id, { active: e.target.checked }); }}
            className="cursor-pointer" />
          <div>
            <span className="text-sm font-medium text-gray-800">{corr.name}</span>
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded font-medium ${SOURCE_COLORS[corr.source_type]}`}>
              {corr.source_type}
            </span>
          </div>
        </div>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 pt-2 italic">{corr.reference}</p>

          {Object.keys(corr.constants).length > 0 && (
            <div>
              <p className="text-xs text-gray-600 font-medium mb-1">Constants</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(corr.constants).map(([k, v]) => (
                  <label key={k} className="text-xs text-gray-600">
                    {k}
                    <input type="number" step="any" value={v}
                      onChange={(e) => updateCorrelationConstants(corr.id, { [k]: parseFloat(e.target.value) || 0 })}
                      className="ml-1 w-20 bg-white border border-gray-300 rounded px-2 py-0.5 text-gray-800 focus:outline-none focus:border-blue-400" />
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-400 mb-1">Available: {INJECTED_VARS[corr.source_type]?.join(', ')}</p>
            <p className="text-xs text-gray-400 mb-1">Must assign: <code className="text-green-700 font-mono">phi</code> (degrees)</p>
          </div>

          <div>
            <p className="text-xs text-gray-600 font-medium mb-1">
              Equation {isReadOnly && <span className="text-gray-400">(read-only)</span>}
            </p>
            <EquationEditor value={corr.equation_code} onChange={handleCodeChange} readOnly={isReadOnly} height="180px" />
          </div>
        </div>
      )}
    </div>
  );
}

export function CorrelationPanel() {
  const correlations = useProjectStore((s) => s.correlations);
  return (
    <div className="space-y-2 overflow-y-auto h-full pr-1">
      <p className="text-xs text-gray-500 px-1">
        Toggle correlations, edit constants, modify Python equations. Changes recalculate after 0.4s.
      </p>
      {correlations.map((c) => <CorrelationCard key={c.id} corr={c} />)}
    </div>
  );
}
