import { useState, useMemo } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import type { SourceType } from '@/types';

type FilterType = SourceType | 'All';

export function FactualDataTable() {
  const datasets = useProjectStore((s) => s.datasets);
  const [filterType, setFilterType] = useState<FilterType>('All');
  const [filterHole, setFilterHole] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 200;

  const allRows = useMemo(() => {
    const rows: Array<{ type: SourceType; hole_id: string; elevation: number; [k: string]: unknown }> = [];
    for (const ds of datasets) {
      for (const r of ds.cpt_rows) rows.push({ type: 'CPT', ...r });
      for (const r of ds.spt_rows) rows.push({ type: 'SPT', ...r });
      for (const r of ds.shear_box_rows) rows.push({ type: 'ShearBox', ...r });
      for (const r of ds.triaxial_rows) rows.push({ type: 'Triaxial', ...r });
    }
    return rows;
  }, [datasets]);

  const filtered = useMemo(() => {
    return allRows
      .filter((r) => filterType === 'All' || r.type === filterType)
      .filter((r) => !filterHole || r.hole_id.toLowerCase().includes(filterHole.toLowerCase()));
  }, [allRows, filterType, filterHole]);

  const page_rows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const holeIds = useMemo(() => [...new Set(allRows.map((r) => r.hole_id))].sort(), [allRows]);

  if (allRows.length === 0) {
    return <p className="text-gray-400 text-sm p-4">No factual data loaded. Use the Import tab to load data.</p>;
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex gap-3 items-center px-1">
        <label className="text-xs text-gray-600">
          Type:{' '}
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value as FilterType); setPage(0); }}
            className="ml-1 bg-white border border-gray-300 rounded px-2 py-0.5 text-gray-800">
            <option value="All">All ({allRows.length})</option>
            {(['CPT', 'SPT', 'ShearBox', 'Triaxial'] as SourceType[]).map((t) => {
              const count = allRows.filter((r) => r.type === t).length;
              return count > 0 ? <option key={t} value={t}>{t} ({count})</option> : null;
            })}
          </select>
        </label>
        <label className="text-xs text-gray-600">
          Hole:{' '}
          <select value={filterHole} onChange={(e) => { setFilterHole(e.target.value); setPage(0); }}
            className="ml-1 bg-white border border-gray-300 rounded px-2 py-0.5 text-gray-800">
            <option value="">All holes</option>
            {holeIds.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </label>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length.toLocaleString()} rows</span>
      </div>

      <div className="overflow-auto flex-1 border border-gray-200 rounded bg-white">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
            <tr>
              <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Type</th>
              <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Hole ID</th>
              <th className="px-2 py-1.5 text-right text-gray-500 font-medium">Elev (m AOD)</th>
              <th className="px-2 py-1.5 text-right text-gray-500 font-medium">Value 1</th>
              <th className="px-2 py-1.5 text-right text-gray-500 font-medium">Value 2</th>
              <th className="px-2 py-1.5 text-right text-gray-500 font-medium">Value 3</th>
            </tr>
          </thead>
          <tbody>
            {page_rows.map((row, i) => {
              let v1 = '', v2 = '', v3 = '';
              if (row.type === 'CPT') {
                v1 = `qc: ${(row.qc as number).toFixed(3)} MPa`;
                v2 = `fs: ${(row.fs as number).toFixed(1)} kPa`;
                v3 = `u2: ${(row.u2 as number).toFixed(1)} kPa`;
              } else if (row.type === 'SPT') {
                v1 = `N: ${row.N_measured}`;
                v2 = `ER: ${row.energy_ratio}%`;
                v3 = `Hammer: ${row.hammer_type}`;
              } else if (row.type === 'ShearBox') {
                v1 = `σn: ${row.normal_stress} kPa`;
                v2 = `τ: ${row.shear_stress} kPa`;
                v3 = `Unit: ${row.geo_unit}`;
              } else if (row.type === 'Triaxial') {
                v1 = `σ3: ${row.cell_pressure} kPa`;
                v2 = `Δσ: ${row.deviator_stress_at_failure} kPa`;
                v3 = `${row.test_type} | ${row.geo_unit}`;
              }
              return (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-1 text-gray-700">{row.type as string}</td>
                  <td className="px-2 py-1 text-gray-700">{row.hole_id}</td>
                  <td className="px-2 py-1 text-right text-gray-700">{(row.elevation as number).toFixed(2)}</td>
                  <td className="px-2 py-1 text-right text-gray-500">{v1}</td>
                  <td className="px-2 py-1 text-right text-gray-500">{v2}</td>
                  <td className="px-2 py-1 text-right text-gray-500">{v3}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 items-center justify-end text-xs text-gray-500">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="px-2 py-0.5 bg-white border border-gray-300 rounded disabled:opacity-40 cursor-pointer">←</button>
          <span>Page {page + 1} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            className="px-2 py-0.5 bg-white border border-gray-300 rounded disabled:opacity-40 cursor-pointer">→</button>
        </div>
      )}
    </div>
  );
}
