import { useMemo } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import type { MarkerStyle } from '@/types';

// Plotly trace type (simplified)
interface PlotTrace {
  name: string;
  x: (number | null)[];
  y: (number | null)[];
  type: 'scatter';
  mode: 'markers' | 'lines' | 'lines+markers';
  marker?: {
    symbol: string;
    size: number;
    opacity: number;
    color: string;
  };
  line?: { color: string; width: number; dash?: string };
  hovertemplate?: string;
  showlegend?: boolean;
  legendgroup?: string;
}

function markerSymbol(style: MarkerStyle): string {
  return style.shape;
}

export function usePlotData(hiddenLayers?: Set<string>) {
  const interpretedCache = useProjectStore((s) => s.interpreted_cache);
  const symbology = useProjectStore((s) => s.symbology);
  const ground_model = useProjectStore((s) => s.ground_model);
  const design_lines = useProjectStore((s) => s.design_lines);
  const correlations = useProjectStore((s) => s.correlations);

  const traces = useMemo((): PlotTrace[] => {
    const result: PlotTrace[] = [];

    // Group interpreted rows by (source_type, correlation_id)
    const groups = new Map<string, typeof interpretedCache>();
    for (const row of interpretedCache) {
      if (row.phi_calculated === null) continue;
      const key = `${row.source_type}::${row.correlation_id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    for (const [key, rows] of groups) {
      const [sourceType, corrId] = key.split('::') as [string, string];
      if (hiddenLayers?.has(corrId)) continue;
      const style = symbology.find((s) => s.source_type === sourceType);
      if (!style) continue;
      const corr = correlations.find((c) => c.id === corrId);

      result.push({
        name: corr?.name ?? corrId,
        x: rows.map((r) => r.phi_calculated),
        y: rows.map((r) => r.elevation),
        type: 'scatter',
        mode: 'markers',
        marker: {
          symbol: markerSymbol(style),
          size: style.size,
          opacity: style.opacity,
          color: style.color,
        },
        legendgroup: corrId,
        hovertemplate: `<b>${corr?.name ?? sourceType}</b><br>φ': %{x:.1f}°<br>Elev: %{y:.2f} m AOD<br>Hole: %{text}<extra></extra>`,
        showlegend: true,
      } as PlotTrace & { text: string[] });
      (result[result.length - 1] as PlotTrace & { text: string[] }).text = rows.map((r) => r.hole_id);
    }

    // Design lines
    for (const dl of design_lines) {
      const unit = ground_model.units.find((u) => u.id === dl.geo_unit_id);
      if (!unit) continue;
      if (hiddenLayers?.has(`design_${unit.id}`)) continue;

      if (dl.mode === 'constant' && dl.constant_phi !== undefined) {
        result.push({
          name: `${unit.name} (design)`,
          x: [dl.constant_phi, dl.constant_phi],
          y: [unit.top_elevation, unit.base_elevation],
          type: 'scatter',
          mode: 'lines',
          line: { color: unit.color, width: 3 },
          showlegend: true,
          legendgroup: `design_${unit.id}`,
        });
      }

      if (dl.mode === 'segmented' && dl.segments) {
        const xs: (number | null)[] = [];
        const ys: (number | null)[] = [];
        for (const seg of dl.segments) {
          xs.push(seg.phi, seg.phi, null);
          ys.push(seg.elev_from, seg.elev_to, null);
        }
        result.push({
          name: `${unit.name} (design)`,
          x: xs,
          y: ys,
          type: 'scatter',
          mode: 'lines',
          line: { color: unit.color, width: 3 },
          showlegend: true,
          legendgroup: `design_${unit.id}`,
        });
      }
    }

    return result;
  }, [interpretedCache, symbology, design_lines, ground_model.units, correlations, hiddenLayers]);

  const layout = useMemo(() => {
    const { units, ground_level, gwt_elevation } = ground_model;

    const shapes: object[] = [];
    const annotations: object[] = [];

    for (const unit of units) {
      shapes.push({
        type: 'line',
        x0: 0, x1: 1, xref: 'paper',
        y0: unit.top_elevation, y1: unit.top_elevation,
        line: { color: unit.color, width: 1, dash: 'dash' },
      });
      shapes.push({
        type: 'rect',
        x0: 0, x1: 1, xref: 'paper',
        y0: unit.base_elevation, y1: unit.top_elevation,
        fillcolor: unit.color,
        opacity: 0.05,
        line: { width: 0 },
      });
      annotations.push({
        x: 0.01,
        y: (unit.top_elevation + unit.base_elevation) / 2,
        xref: 'paper',
        yref: 'y',
        xanchor: 'left',
        text: `<i>${unit.name}</i>`,
        showarrow: false,
        font: { color: unit.color, size: 10 },
      });
    }

    shapes.push({
      type: 'line',
      x0: 0, x1: 1, xref: 'paper',
      y0: gwt_elevation, y1: gwt_elevation,
      line: { color: '#3b82f6', width: 1, dash: 'dot' },
    });
    annotations.push({
      x: 1, y: gwt_elevation, xref: 'paper', yref: 'y',
      xanchor: 'right', text: 'GWT', showarrow: false,
      font: { color: '#3b82f6', size: 9 },
    });

    return {
      paper_bgcolor: '#ffffff',
      plot_bgcolor: '#f9fafb',
      font: { color: '#374151', size: 11 },
      margin: { l: 60, r: 20, t: 20, b: 60 },
      xaxis: {
        title: { text: "Friction Angle φ' (°)" },
        range: [15, 55],
        gridcolor: '#e5e7eb',
        zeroline: false,
        color: '#6b7280',
        linecolor: '#d1d5db',
        tickcolor: '#d1d5db',
      },
      yaxis: {
        title: { text: 'Elevation (m AOD)' },
        range: [ground_model.units[ground_model.units.length - 1]?.base_elevation ?? 0, ground_level + 1],
        gridcolor: '#e5e7eb',
        zeroline: false,
        color: '#6b7280',
        linecolor: '#d1d5db',
        tickcolor: '#d1d5db',
      },
      legend: {
        bgcolor: '#ffffff',
        bordercolor: '#e5e7eb',
        borderwidth: 1,
        font: { size: 10, color: '#374151' },
      },
      shapes,
      annotations,
    };
  }, [ground_model]);

  return { traces, layout };
}
