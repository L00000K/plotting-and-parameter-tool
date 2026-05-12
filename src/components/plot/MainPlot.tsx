import { useMemo } from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import * as Plotly from 'plotly.js-dist-min';
import { usePlotData } from './usePlotData';
import { useProjectStore } from '@/store/useProjectStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = createPlotlyComponent(Plotly as any);

interface Props {
  hiddenLayers?: Set<string>;
}

export function MainPlot({ hiddenLayers }: Props) {
  const { traces, layout } = usePlotData(hiddenLayers);
  const interpretedCount = useProjectStore((s) => s.interpreted_cache.length);
  const pyPhase = useProjectStore((s) => s.pyodide_status.phase);

  const config = useMemo(() => ({
    responsive: true,
    displayModeBar: true,
    toImageButtonOptions: {
      format: 'svg',
      filename: 'phi_profile',
    },
  }), []);

  if (interpretedCount === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        {pyPhase !== 'ready'
          ? 'Start Python runtime and load data to see the plot.'
          : 'Load factual data to generate the soil cloud plot.'}
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Plot
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data={traces as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        layout={layout as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config={config as any}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler
      />
    </div>
  );
}
