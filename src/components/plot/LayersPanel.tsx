import { useProjectStore } from '@/store/useProjectStore';

interface Props {
  hiddenLayers: Set<string>;
  onToggle: (key: string) => void;
}

export function LayersPanel({ hiddenLayers, onToggle }: Props) {
  const correlations = useProjectStore((s) => s.correlations);
  const design_lines = useProjectStore((s) => s.design_lines);
  const units = useProjectStore((s) => s.ground_model.units);
  const symbology = useProjectStore((s) => s.symbology);

  const activeCorrLayers = correlations.filter((c) => c.active);
  const designLayers = design_lines.map((dl) => {
    const unit = units.find((u) => u.id === dl.geo_unit_id);
    return { key: `design_${dl.geo_unit_id}`, label: `${unit?.name ?? 'Unknown'} (design)`, color: unit?.color ?? '#6b7280' };
  });

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 overflow-y-auto">
      <div className="px-3 py-2 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Layers</h3>
      </div>

      <div className="px-3 py-2 space-y-3 flex-1">
        {activeCorrLayers.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data</p>
            {activeCorrLayers.map((c) => {
              const style = symbology.find((s) => s.source_type === c.source_type);
              const visible = !hiddenLayers.has(c.id);
              return (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => onToggle(c.id)}
                    className="cursor-pointer accent-blue-600 w-3.5 h-3.5 flex-shrink-0"
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: style?.color ?? '#6b7280', opacity: visible ? 1 : 0.3 }}
                  />
                  <span className={`text-xs leading-tight ${visible ? 'text-gray-700' : 'text-gray-400'}`}>
                    {c.name}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {designLayers.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Design Lines</p>
            {designLayers.map((dl) => {
              const visible = !hiddenLayers.has(dl.key);
              return (
                <label key={dl.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => onToggle(dl.key)}
                    className="cursor-pointer accent-blue-600 w-3.5 h-3.5 flex-shrink-0"
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: dl.color, opacity: visible ? 1 : 0.3 }}
                  />
                  <span className={`text-xs leading-tight ${visible ? 'text-gray-700' : 'text-gray-400'}`}>
                    {dl.label}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {activeCorrLayers.length === 0 && designLayers.length === 0 && (
          <p className="text-xs text-gray-400">No layers yet. Load data or add a design line.</p>
        )}
      </div>
    </div>
  );
}
