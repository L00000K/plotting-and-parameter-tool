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

export function usePlotData() {
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
        legendgroup: sourceType,
        hovertemplate: `<b>${corr?.name ?? sourceType}</b><br>φ': %{x:.1f}°<br>Elev: %{y:.2f} m AOD<br>Hole: %{text}<extra></extra>`,
        showlegend: true,
      } as PlotTrace & { text: string[] });
      // Add text for hover (hole_id)
      (result[result.length - 1] as PlotTrace & { text: string[] }).text = rows.map((r) => r.hole_id);
    }

    // Design lines
    for (const dl of design_lines) {
      const unit = ground_model.units.find((u) => u.id === dl.geo_unit_id);
      if (!unit) continue;

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

      // Equation mode: cached computed phis stored separately
      // (handled in MainPlot via effect)
    }

    return result;
  }, [interpretedCache, symbology, design_lines, ground_model.units, correlations]);

  const layout = useMemo(() => {
    const { units, ground_level, gwt_elevation } = ground_model;

    const shapes: object[] = [];
    const annotations: object[] = [];

    // Geological unit boundary lines and background bands
    for (const unit of units) {
      // Horizontal dashed line at unit top
      shapes.push({
        type: 'line',
        x0: 0, x1: 1, xref: 'paper',
        y0: unit.top_elevation, y1: unit.top_elevation,
        line: { color: unit.color, width: 1, dash: 'dash' },
      });
      // Shaded band
      shapes.push({
        type: 'rect',
        x0: 0, x1: 1, xref: 'paper',
        y0: unit.base_elevation, y1: unit.top_elevation,
        fillcolor: unit.color,
        opacity: 0.04,
        line: { width: 0 },
      });
      // Label annotation
      annotations.push({
        x: 0,
        y: (unit.top_elevation + unit.base_elevation) / 2,
        xref: 'paper',
        yref: 'y',
        xanchor: 'left',
        text: `<i>${unit.name}</i>`,
        showarrow: false,
        font: { color: unit.color, size: 10 },
      });
    }

    // GWT line
    shapes.push({
      type: 'line',
      x0: 0, x1: 1, xref: 'paper',
      y0: gwt_elevation, y1: gwt_elevation,
      line: { color: '#60a5fa', width: 1, dash: 'dot' },
    });
    annotations.push({
      x: 1, y: gwt_elevation, xref: 'paper', yref: 'y',
      xanchor: 'right', text: 'GWT', showarrow: false,
      font: { color: '#60a5fa', size: 9 },
    });

    return {
      paper_bgcolor: '#0f172a',
      plot_bgcolor: '#1e293b',
      font: { color: '#e2e8f0', size: 11 },
      margin: { l: 60, r: 20, t: 30, b: 60 },
      xaxis: {
        title: { text: "Friction Angle φ' (°)" },
        range: [15, 55],
        gridcolor: '#334155',
        zeroline: false,
        color: '#94a3b8',
      },
      yaxis: {
        title: { text: 'Elevation (m AOD)' },
        range: [ground_model.units[ground_model.units.length - 1]?.base_elevation ?? 0, ground_level + 1],
        gridcolor: '#334155',
        zeroline: false,
        color: '#94a3b8',
      },
      legend: {
        bgcolor: '#1e293b',
        bordercolor: '#334155',
        borderwidth: 1,
        font: { size: 10 },
      },
      shapes,
      annotations,
    };
  }, [ground_model]);

  return { traces, layout };
}
