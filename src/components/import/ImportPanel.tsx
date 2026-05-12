import { useState } from 'react';
import { FileDropZone } from './FileDropZone';
import { parseCSV } from '@/services/parsers/csvParser';
import { parseAGS4 } from '@/services/parsers/agsParser';
import { useProjectStore } from '@/store/useProjectStore';
import type { SourceType } from '@/types';

type FileFormat = 'csv' | 'ags4';

export function ImportPanel() {
  const addDataset = useProjectStore((s) => s.addDataset);
  const datasets = useProjectStore((s) => s.datasets);
  const removeDataset = useProjectStore((s) => s.removeDataset);
  const [format, setFormat] = useState<FileFormat>('csv');
  const [sourceType, setSourceType] = useState<SourceType>('CPT');
  const [message, setMessage] = useState('');

  function handleFile(content: string, filename: string) {
    setMessage('');
    try {
      if (format === 'ags4') {
        const parsed = parseAGS4(content);
        addDataset({
          source_file: filename,
          source_type: 'CPT',
          cpt_rows: parsed.cpt_rows,
          spt_rows: parsed.spt_rows,
          shear_box_rows: parsed.shear_box_rows,
          triaxial_rows: parsed.triaxial_rows,
        });
        const total = parsed.cpt_rows.length + parsed.spt_rows.length +
          parsed.shear_box_rows.length + parsed.triaxial_rows.length;
        setMessage(`Imported ${total} records from AGS4 file.`);
      } else {
        const parsed = parseCSV(content, sourceType);
        const total = parsed.cpt_rows.length + parsed.spt_rows.length +
          parsed.shear_box_rows.length + parsed.triaxial_rows.length;
        addDataset({ source_file: filename, source_type: sourceType, ...parsed });
        setMessage(`Imported ${total} records.`);
      }
    } catch (e) {
      setMessage(`Error: ${String(e)}`);
    }
  }

  async function loadSampleData() {
    const base = import.meta.env.BASE_URL ?? '/';
    const files: [string, SourceType][] = [
      ['sample_cpt.csv', 'CPT'],
      ['sample_spt.csv', 'SPT'],
      ['sample_shearbox.csv', 'ShearBox'],
      ['sample_triaxial.csv', 'Triaxial'],
    ];
    for (const [file, type] of files) {
      const res = await fetch(`${base}sample-data/${file}`);
      const text = await res.text();
      const parsed = parseCSV(text, type);
      addDataset({ source_file: file, source_type: type, ...parsed });
    }
    setMessage('Sample dataset loaded.');
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={loadSampleData}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium"
        >
          Load Sample Dataset
        </button>
      </div>

      <div className="border border-slate-700 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Import File</h3>
        <div className="flex gap-4">
          <label className="text-xs text-slate-400">
            Format:{' '}
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as FileFormat)}
              className="ml-1 bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-slate-200"
            >
              <option value="csv">CSV</option>
              <option value="ags4">AGS4</option>
            </select>
          </label>
          {format === 'csv' && (
            <label className="text-xs text-slate-400">
              Data type:{' '}
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as SourceType)}
                className="ml-1 bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-slate-200"
              >
                <option value="CPT">CPT</option>
                <option value="SPT">SPT</option>
                <option value="ShearBox">Shear Box</option>
                <option value="Triaxial">Triaxial</option>
              </select>
            </label>
          )}
        </div>
        <FileDropZone onFile={handleFile} accept={format === 'ags4' ? '.ags,.txt' : '.csv'} />
        {message && <p className="text-xs text-green-400">{message}</p>}
      </div>

      {datasets.length > 0 && (
        <div className="border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Loaded Datasets</h3>
          <div className="space-y-1">
            {datasets.map((ds) => (
              <div key={ds.id} className="flex items-center justify-between text-xs text-slate-400">
                <span className="truncate max-w-xs">{ds.source_file}</span>
                <span className="text-slate-500 mx-2">
                  {ds.cpt_rows.length + ds.spt_rows.length + ds.shear_box_rows.length + ds.triaxial_rows.length} records
                </span>
                <button
                  onClick={() => removeDataset(ds.id)}
                  className="text-red-400 hover:text-red-300 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
