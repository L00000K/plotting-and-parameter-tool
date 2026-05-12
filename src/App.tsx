import { useState, useEffect, useCallback } from 'react';
import { StatusBar } from '@/components/layout/StatusBar';
import { ImportPanel } from '@/components/import/ImportPanel';
import { CombinedDataTable } from '@/components/tables/CombinedDataTable';
import { ParameterManager } from '@/components/parameters/ParameterManager';
import { CorrelationPanel } from '@/components/correlations/CorrelationPanel';
import { SymbologyPanel } from '@/components/symbology/SymbologyPanel';
import { DesignLinePanel } from '@/components/design-lines/DesignLinePanel';
import { MainPlot } from '@/components/plot/MainPlot';
import { LayersPanel } from '@/components/plot/LayersPanel';
import { useEquationRecalculation } from '@/services/pyodide/equationRunner';
import { usePyodide } from '@/services/pyodide/usePyodide';
import { useProjectStore } from '@/store/useProjectStore';

type TabId = 'plot' | 'data' | 'equations' | 'design-lines' | 'parameters' | 'symbology';

interface Tab { id: TabId; label: string; }

const TABS: Tab[] = [
  { id: 'plot', label: 'Plot' },
  { id: 'data', label: 'Data' },
  { id: 'equations', label: 'Equations' },
  { id: 'design-lines', label: 'Design Lines' },
  { id: 'parameters', label: 'Parameters' },
  { id: 'symbology', label: 'Symbology' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('plot');
  const [showImport, setShowImport] = useState(false);
  const [hiddenLayers, setHiddenLayers] = useState<Set<string>>(new Set());

  const { initPyodide } = usePyodide();
  const projectName = useProjectStore((s) => s.project_name);
  const setProjectName = useProjectStore((s) => s.setProjectName);

  useEquationRecalculation();

  useEffect(() => {
    const id = window.setTimeout(() => initPyodide(), 3000);
    return () => window.clearTimeout(id);
  }, [initPyodide]);

  useEffect(() => {
    if (['data', 'equations', 'plot'].includes(activeTab)) {
      initPyodide();
    }
  }, [activeTab, initPyodide]);

  const toggleLayer = useCallback((key: string) => {
    setHiddenLayers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const navigate = useCallback((tab: string) => {
    setActiveTab(tab as TabId);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <h1 className="text-gray-900 font-bold text-sm tracking-wide whitespace-nowrap">GeoParameter Tool</h1>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="text-xs bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-700 w-40 focus:outline-none focus:border-blue-400"
          placeholder="Project name"
        />
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer font-medium"
          >
            Import / Reload
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="flex gap-0.5 px-2 pt-2 bg-white border-b border-gray-200 overflow-x-auto flex-shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs rounded-t transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-gray-50 text-blue-600 border border-b-0 border-gray-200 font-medium'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'plot' ? (
          <div className="flex h-full">
            <div className="flex-1 min-w-0 p-3">
              <MainPlot hiddenLayers={hiddenLayers} />
            </div>
            <div className="w-48 flex-shrink-0">
              <LayersPanel hiddenLayers={hiddenLayers} onToggle={toggleLayer} onNavigate={navigate} />
            </div>
          </div>
        ) : (
          <div className="h-full p-4 overflow-hidden">
            {activeTab === 'data' && <CombinedDataTable onNavigate={navigate} />}
            {activeTab === 'equations' && <CorrelationPanel />}
            {activeTab === 'design-lines' && <DesignLinePanel />}
            {activeTab === 'parameters' && <ParameterManager />}
            {activeTab === 'symbology' && <SymbologyPanel />}
          </div>
        )}
      </main>

      <StatusBar />

      {/* Import modal */}
      {showImport && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/30"
          onClick={(e) => { if (e.target === e.currentTarget) setShowImport(false); }}
        >
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Import Data</h2>
              <button
                onClick={() => setShowImport(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <ImportPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
