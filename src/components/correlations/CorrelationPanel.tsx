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

function CorrelationCard({ corr }: { corr: CorrelationDef }) {
  const [open, setOpen] = useState(false);
  const updateCorrelation = useProjectStore((s) => s.updateCorrelation);
  const updateCorrelationCode = useProjectStore((s) => s.updateCorrelationCode);
  const updateCorrelationConstants = useProjectStore((s) => s.updateCorrelationConstants);

  const handleCodeChange = useCallback((code: string) => {
    updateCorrelationCode(corr.id, code);
  }, [corr.id, updateCorrelationCode]);

  const isReadOnly = corr.source_type === 'ShearBox' || corr.source_type === 'Triaxial';

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-800"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={corr.active}
            onChange={(e) => { e.stopPropagation(); updateCorrelation(corr.id, { active: e.target.checked }); }}
            className="cursor-pointer"
          />
          <div>
            <span className="text-sm font-medium text-slate-200">{corr.name}</span>
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded text-white ${
              corr.source_type === 'CPT' ? 'bg-blue-700' :
              corr.source_type === 'SPT' ? 'bg-orange-700' :
              corr.source_type === 'ShearBox' ? 'bg-green-700' : 'bg-purple-700'
            }`}>
              {corr.source_type}
            </span>
          </div>
        </div>
        <span className="text-slate-500 text-xs">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-700">
          <p className="text-xs text-slate-500 pt-2 italic">{corr.reference}</p>

          {/* Constants */}
          {Object.keys(corr.constants).length > 0 && (
            <div>
              <p className="text-xs text-slate-400 font-medium mb-1">Constants</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(corr.constants).map(([k, v]) => (
                  <label key={k} className="text-xs text-slate-400">
                    {k}
                    <input
                      type="number"
                      step="any"
                      value={v}
                      onChange={(e) => updateCorrelationConstants(corr.id, { [k]: parseFloat(e.target.value) || 0 })}
                      className="ml-1 w-20 bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-slate-200"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Available variables */}
          <div>
            <p className="text-xs text-slate-500 mb-1">Available variables: {INJECTED_VARS[corr.source_type]?.join(', ')}</p>
            <p className="text-xs text-slate-500 mb-1">Must assign: <code className="text-green-400">phi</code> (degrees)</p>
          </div>

          {/* Equation editor */}
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">
              Equation {isReadOnly && <span className="text-slate-500">(read-only)</span>}
            </p>
            <EquationEditor
              value={corr.equation_code}
              onChange={handleCodeChange}
              readOnly={isReadOnly}
              height="180px"
            />
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
      <p className="text-xs text-slate-500 px-1">
        Toggle correlations on/off, edit constants, and modify Python equations.
        Changes trigger recalculation after 0.8s.
      </p>
      {correlations.map((c) => <CorrelationCard key={c.id} corr={c} />)}
    </div>
  );
}
