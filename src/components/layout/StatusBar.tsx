import { useProjectStore } from '@/store/useProjectStore';
import { usePyodide } from '@/services/pyodide/usePyodide';

export function StatusBar() {
  const { status, initPyodide } = usePyodide();
  const interpretedCount = useProjectStore((s) => s.interpreted_cache.length);

  const phaseIcon = {
    idle: '⚪',
    loading: '🟡',
    ready: '🟢',
    error: '🔴',
  }[status.phase];

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 bg-slate-900 border-t border-slate-700 text-xs text-slate-400">
      <span>
        <span className="mr-1">{phaseIcon}</span>
        {status.phase === 'idle' && (
          <button
            onClick={initPyodide}
            className="underline hover:text-blue-400 cursor-pointer"
          >
            Load Python runtime
          </button>
        )}
        {status.phase === 'loading' && status.progress_message}
        {status.phase === 'ready' && 'Python ready'}
        {status.phase === 'error' && (
          <span className="text-red-400">
            Python error: {status.error_message}{' '}
            <button onClick={initPyodide} className="underline hover:text-red-300 cursor-pointer">Retry</button>
          </span>
        )}
      </span>
      <span className="text-slate-500">|</span>
      <span>{interpretedCount.toLocaleString()} interpreted values</span>
    </div>
  );
}
