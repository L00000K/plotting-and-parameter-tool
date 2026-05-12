import { useMemo, useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import type { SourceType } from '@/types';

type FilterType = SourceType | 'All';

interface PivotRow {
  key: string;
  hole_id: string;
  elevation: number;
  source_type: SourceType;
  phis: Map<string, number | null>;
  errors: Map<string, string | undefined>;
}

interface Props {
  onNavigate: (tab: string) => void;
}

const PAGE_SIZE = 200;

export function CombinedDataTable({ onNavigate }: Props) {
  const interpretedRows = useProjectStore((s) => s.interpreted_cache);
  const correlations = useProjectStore((s) => s.correlations);
  const pyStatus = useProjectStore((s) => s.pyodide_status.phase);
  const [sourceFilter, setSourceFilter] = useState<FilterType>('All');
  const [page, setPage] = useState(0);

  const activeCorrelations = useMemo(
    () => correlations.filter((c) => interpretedRows.some((r) => r.correlation_id === c.id)),
    [correlations, interpretedRows]
  );

  const pivotData = useMemo((): PivotRow[] => {
    const groups = new Map<string, PivotRow>();
    for (const row of interpretedRows) {
      const rowKey = `${row.hole_id}::${row.elevation}::${row.source_type}`;
      if (!groups.has(rowKey)) {
        groups.set(rowKey, {
          key: rowKey,
          hole_id: row.hole_id,
          elevation: row.elevation,
          source_type: row.source_type as SourceType,
          phis: new Map(),
          errors: new Map(),
        });
      }
      const g = groups.get(rowKey)!;
      g.phis.set(row.correlation_id, row.phi_calculated);
      if (row.error) g.errors.set(row.correlation_id, row.error);
    }
    return Array.from(groups.values())
      .filter((r) => sourceFilter === 'All' || r.source_type === sourceFilter)
      .sort((a, b) => b.elevation - a.elevation);
  }, [interpretedRows, sourceFilter]);

  const visibleCorrelations = useMemo(
    () =>
      sourceFilter === 'All'
        ? activeCorrelations
        : activeCorrelations.filter((c) => c.source_type === sourceFilter),
    [activeCorrelations, sourceFilter]
  );

  const pageRows = pivotData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(pivotData.length / PAGE_SIZE);

  const sourceCounts = useMemo(() => {
    const counts: Partial<Record<FilterType, number>> = { All: interpretedRows.length };
    for (const st of ['CPT', 'SPT', 'ShearBox', 'Triaxial'] as SourceType[]) {
      const n = interpretedRows.filter((r) => r.source_type === st).length;
      if (n > 0) counts[st] = n;
    }
    return counts;
  }, [interpretedRows]);

  if (interpretedRows.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <TableHeader onNavigate={onNavigate} />
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          {pyStatus !== 'ready'
            ? 'Load data and start the Python runtime to see interpreted values.'
            : 'No interpreted data yet. Load factual data to generate values.'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <TableHeader onNavigate={onNavigate} />

      {pyStatus === 'loading' && (
        <div className="text-xs text-amber-600 px-1">Recalculating...</div>
      )}

      <div className="flex items-center gap-1 px-1 flex-wrap">
        {(['All', 'CPT', 'SPT', 'ShearBox', 'Triaxial'] as FilterType[]).map((st) => {
          const count = sourceCounts[st];
          if (st !== 'All' && !count) return null;
          return (
            <button
              key={st}
              onClick={() => { setSourceFilter(st); setPage(0); }}
              className={`text-xs px-2.5 py-1 rounded-full cursor-pointer border transition-colors ${
                sourceFilter === st
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {st}{count !== undefined ? ` (${count.toLocaleString()})` : ''}
            </button>
          );
        })}
        <span className="text-xs text-gray-400 ml-auto">{pivotData.length.toLocaleString()} rows</span>
      </div>

      <div className="overflow-auto flex-1 border border-gray-200 rounded bg-white">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="border-b border-gray-200">
              <th className="px-2 py-1.5 text-left text-gray-500 font-medium whitespace-nowrap">Hole / Sample</th>
              <th className="px-2 py-1.5 text-right text-gray-500 font-medium whitespace-nowrap">Elev (m AOD)</th>
              <th className="px-2 py-1.5 text-left text-gray-500 font-medium whitespace-nowrap">Source</th>
              {visibleCorrelations.map((c) => (
                <th key={c.id} className="px-2 py-1.5 text-right text-gray-500 font-medium whitespace-nowrap">
                  {c.name} φ' (°)
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={row.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-2 py-1 text-gray-700">{row.hole_id}</td>
                <td className="px-2 py-1 text-right text-gray-700 font-mono">{row.elevation.toFixed(2)}</td>
                <td className="px-2 py-1 text-gray-500">{row.source_type}</td>
                {visibleCorrelations.map((c) => {
                  const phi = row.phis.get(c.id);
                  const err = row.errors.get(c.id);
                  if (!row.phis.has(c.id)) {
                    return <td key={c.id} className="px-2 py-1 text-right text-gray-300">—</td>;
                  }
                  return (
                    <td key={c.id} className={`px-2 py-1 text-right font-mono font-medium ${phi === null ? 'text-red-400' : 'text-emerald-700'}`}>
                      {phi === null
                        ? <span title={err}>err</span>
                        : phi!.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 items-center justify-end text-xs text-gray-500 px-1">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="px-2 py-0.5 bg-white border border-gray-300 rounded disabled:opacity-40 cursor-pointer hover:bg-gray-50">
            ←
          </button>
          <span>Page {page + 1} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            className="px-2 py-0.5 bg-white border border-gray-300 rounded disabled:opacity-40 cursor-pointer hover:bg-gray-50">
            →
          </button>
        </div>
      )}
    </div>
  );
}

function TableHeader({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <div className="flex items-center gap-2 px-1 flex-wrap">
      <span className="text-xs font-semibold text-gray-700">Interpreted Data</span>
      <div className="flex gap-1.5 ml-auto">
        <button
          onClick={() => onNavigate('equations')}
          className="text-xs px-2.5 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 cursor-pointer"
        >
          Edit Correlations
        </button>
        <button
          onClick={() => onNavigate('parameters')}
          className="text-xs px-2.5 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 cursor-pointer"
        >
          Edit Parameters
        </button>
        <button
          onClick={() => onNavigate('design-lines')}
          className="text-xs px-2.5 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 cursor-pointer"
        >
          Design Lines
        </button>
      </div>
    </div>
  );
}
