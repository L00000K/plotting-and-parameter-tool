import { useProjectStore } from '@/store/useProjectStore';
import type { MarkerShape, SourceType } from '@/types';

const SHAPES: MarkerShape[] = ['circle', 'circle-open', 'cross', 'x', 'square', 'diamond', 'triangle-up', 'star'];

const SOURCE_LABELS: Record<SourceType, string> = {
  CPT: 'CPT',
  SPT: 'SPT',
  ShearBox: 'Shear Box',
  Triaxial: 'Triaxial',
};

export function SymbologyPanel() {
  const symbology = useProjectStore((s) => s.symbology);
  const updateSymbology = useProjectStore((s) => s.updateSymbology);

  return (
    <div className="space-y-3 overflow-y-auto h-full pr-1">
      <p className="text-xs text-slate-500">Adjust marker style for each data source type.</p>
      {symbology.map((m) => (
        <div key={m.source_type} className="border border-slate-700 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: m.color }} />
            <h3 className="text-sm font-semibold text-slate-300">{SOURCE_LABELS[m.source_type]}</h3>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <label className="text-xs text-slate-400">
              Color
              <input
                type="color"
                value={m.color}
                onChange={(e) => updateSymbology(m.source_type, { color: e.target.value })}
                className="ml-2 cursor-pointer h-6 w-12 bg-transparent border-0"
              />
            </label>

            <label className="text-xs text-slate-400">
              Shape
              <select
                value={m.shape}
                onChange={(e) => updateSymbology(m.source_type, { shape: e.target.value as MarkerShape })}
                className="ml-1 bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-slate-200"
              >
                {SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>

            <label className="text-xs text-slate-400">
              Size: {m.size}
              <input
                type="range"
                min="2"
                max="20"
                step="1"
                value={m.size}
                onChange={(e) => updateSymbology(m.source_type, { size: parseInt(e.target.value) })}
                className="ml-2 w-24 cursor-pointer"
              />
            </label>

            <label className="text-xs text-slate-400">
              Opacity: {(m.opacity * 100).toFixed(0)}%
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={m.opacity}
                onChange={(e) => updateSymbology(m.source_type, { opacity: parseFloat(e.target.value) })}
                className="ml-2 w-24 cursor-pointer"
              />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
