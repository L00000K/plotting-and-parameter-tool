import { useState, useEffect } from 'react';
import { StatusBar } from '@/components/layout/StatusBar';
import { ImportPanel } from '@/components/import/ImportPanel';
import { FactualDataTable } from '@/components/tables/FactualDataTable';
import { InterpretedDataTable } from '@/components/tables/InterpretedDataTable';
import { ParameterManager } from '@/components/parameters/ParameterManager';
import { CorrelationPanel } from '@/components/correlations/CorrelationPanel';
import { SymbologyPanel } from '@/components/symbology/SymbologyPanel';
import { DesignLinePanel } from '@/components/design-lines/DesignLinePanel';
import { MainPlot } from '@/components/plot/MainPlot';
import { useEquationRecalculation } from '@/services/pyodide/equationRunner';
import { usePyodide } from '@/services/pyodide/usePyodide';
import { useProjectStore } from '@/store/useProjectStore';

type TabId = 'import' | 'factual' | 'interpreted' | 'parameters' | 'correlations' | 'symbology' | 'design-lines' | 'plot';

interface Tab { id: TabId; label: string; }

const TABS: Tab[] = [
  { id: 'import', label: 'Import' },
  { id: 'factual', label: 'Factual Data' },
  { id: 'interpreted', label: 'Interpreted' },
  { id: 'parameters', label: 'Parameters' },
  { id: 'correlations', label: 'Equations' },
  { id: 'symbology', label: 'Symbology' },
  { id: 'design-lines', label: 'Design Lines' },
  { id: 'plot', label: '📊 Plot' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('import');
  const { initPyodide } = usePyodide();
  const projectName = useProjectStore((s) => s.project_name);
  const setProjectName = useProjectStore((s) => s.setProjectName);

  // Wire up the equation recalculation engine
  useEquationRecalculation();

  // Auto-init Pyodide after a short idle delay
  useEffect(() => {
    const id = window.setTimeout(() => initPyodide(), 3000);
    return () => window.clearTimeout(id);
  }, [initPyodide]);

  // Init Pyodide when navigating to tabs that need it
  useEffect(() => {
    if (['interpreted', 'correlations', 'plot'].includes(activeTab)) {
      initPyodide();
    }
  }, [activeTab, initPyodide]);

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-2 bg-slate-900 border-b border-slate-700">
        <h1 className="text-slate-100 font-bold text-sm tracking-wide">⛏ GeoParameter Tool</h1>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300 w-48"
          placeholder="Project name"
        />
      </header>

      {/* Tab bar */}
      <nav className="flex gap-0.5 px-2 pt-2 bg-slate-900 border-b border-slate-700 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs rounded-t transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-950 text-slate-100 border border-b-0 border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-hidden p-4">
        <div className="h-full">
          {activeTab === 'import' && <ImportPanel />}
          {activeTab === 'factual' && <FactualDataTable />}
          {activeTab === 'interpreted' && <InterpretedDataTable />}
          {activeTab === 'parameters' && <ParameterManager />}
          {activeTab === 'correlations' && <CorrelationPanel />}
          {activeTab === 'symbology' && <SymbologyPanel />}
          {activeTab === 'design-lines' && <DesignLinePanel />}
          {activeTab === 'plot' && <MainPlot />}
        </div>
      </main>

      <StatusBar />
    </div>
  );
}
