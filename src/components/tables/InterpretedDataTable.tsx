import { useState, useMemo } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { formatPhi } from '@/utils/formatters';
import type { SourceType } from '@/types';

type FilterType = SourceType | 'All';

export function InterpretedDataTable() {
  const rows = useProjectStore((s) => s.interpreted_cache);
  const pyStatus = useProjectStore((s) => s.pyodide_status.phase);
  const [filterType, setFilterType] = useState<FilterType>('All');
  const [filterUnit, setFilterUnit] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 200;

  const units = useMemo(() => [...new Set(rows.map((r) => r.geo_unit))].sort(), [rows]);

  const filtered = useMemo(() => {
    return rows
      .filter((r) => filterType === 'All' || r.source_type === filterType)
      .filter((r) => !filterUnit || r.geo_unit === filterUnit)
      .sort((a, b) => b.elevation - a.elevation);
  }, [rows, filterType, filterUnit]);

  const page_rows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (rows.length === 0) {
    return (
      <div className="p-4 text-slate-500 text-sm">
        {pyStatus !== 'ready'
          ? 'Load data and start the Python runtime to see interpreted values.'
          : 'No interpreted data yet. Load factual data to generate values.'}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-2">
      {pyStatus === 'loading' && (
        <div className="text-xs text-yellow-400 px-1">⚙ Recalculating...</div>
      )}
      <div className="flex gap-3 items-center px-1">
        <label className="text-xs text-slate-400">
          Type:{' '}
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value as FilterType); setPage(0); }}
            className="ml-1 bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-slate-200"
          >
            <option value="All">All</option>
            {(['CPT', 'SPT', 'ShearBox', 'Triaxial'] as SourceType[]).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Unit:{' '}
          <select
            value={filterUnit}
            onChange={(e) => { setFilterUnit(e.target.value); setPage(0); }}
            className="ml-1 bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-slate-200"
          >
            <option value="">All</option>
            {units.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
        <span className="text-xs text-slate-500 ml-auto">{filtered.length.toLocaleString()} values</span>
      </div>

      <div className="overflow-auto flex-1 border border-slate-700 rounded">
        <table className="w-full text-xs">
          <thead className="bg-slate-800 sticky top-0">
            <tr>
              <th className="px-2 py-1.5 text-left text-slate-400 font-medium">Hole</th>
              <th className="px-2 py-1.5 text-right text-slate-400 font-medium">Elev (m AOD)</th>
              <th className="px-2 py-1.5 text-left text-slate-400 font-medium">Source</th>
              <th className="px-2 py-1.5 text-left text-slate-400 font-medium">Correlation</th>
              <th className="px-2 py-1.5 text-left text-slate-400 font-medium">Geo Unit</th>
              <th className="px-2 py-1.5 text-right text-slate-400 font-medium">φ' (°)</th>
            </tr>
          </thead>
          <tbody>
            {page_rows.map((row, i) => (
              <tr key={row.id} className={i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/50'}>
                <td className="px-2 py-1 text-slate-300">{row.hole_id}</td>
                <td className="px-2 py-1 text-right text-slate-300">{row.elevation.toFixed(2)}</td>
                <td className="px-2 py-1 text-slate-400">{row.source_type}</td>
                <td className="px-2 py-1 text-slate-400">{row.correlation_name}</td>
                <td className="px-2 py-1 text-slate-400">{row.geo_unit}</td>
                <td className={`px-2 py-1 text-right font-mono font-medium ${row.phi_calculated === null ? 'text-red-400' : 'text-green-300'}`}>
                  {row.phi_calculated === null && row.error
                    ? <span title={row.error}>—</span>
                    : formatPhi(row.phi_calculated)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 items-center justify-end text-xs text-slate-400">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="px-2 py-0.5 bg-slate-700 rounded disabled:opacity-40 cursor-pointer">←</button>
          <span>Page {page + 1} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            className="px-2 py-0.5 bg-slate-700 rounded disabled:opacity-40 cursor-pointer">→</button>
        </div>
      )}
    </div>
  );
}
