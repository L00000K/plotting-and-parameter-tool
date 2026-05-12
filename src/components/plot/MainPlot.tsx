import { useMemo } from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import { usePlotData } from './usePlotData';
import { useProjectStore } from '@/store/useProjectStore';

// plotly.js-dist-min ships a UMD bundle; cast to any to satisfy react-plotly factory
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const Plotly = require('plotly.js-dist-min') as any;
const Plot = createPlotlyComponent(Plotly);

export function MainPlot() {
  const { traces, layout } = usePlotData();
  const interpretedCount = useProjectStore((s) => s.interpreted_cache.length);
  const pyPhase = useProjectStore((s) => s.pyodide_status.phase);

  const config = useMemo((): Partial<Plotly.Config> => ({
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['select2d', 'lasso2d'] as Plotly.ModeBarDefaultButtons[],
    toImageButtonOptions: {
      format: 'svg' as const,
      filename: 'phi_profile',
    },
  }), []);

  if (interpretedCount === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        {pyPhase !== 'ready'
          ? 'Start Python runtime and load data to see the plot.'
          : 'Load factual data to generate the soil cloud plot.'}
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Plot
        data={traces as Plotly.Data[]}
        layout={layout as Partial<Plotly.Layout>}
        config={config}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler
      />
    </div>
  );
}
