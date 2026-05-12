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
    <div className="flex items-center gap-4 px-4 py-1.5 bg-white border-t border-gray-200 text-xs text-gray-500">
      <span>
        <span className="mr-1">{phaseIcon}</span>
        {status.phase === 'idle' && (
          <button
            onClick={initPyodide}
            className="underline hover:text-blue-600 cursor-pointer"
          >
            Load Python runtime
          </button>
        )}
        {status.phase === 'loading' && <span className="text-amber-600">{status.progress_message}</span>}
        {status.phase === 'ready' && <span className="text-green-700">Python ready</span>}
        {status.phase === 'error' && (
          <span className="text-red-600">
            Python error: {status.error_message}{' '}
            <button onClick={initPyodide} className="underline hover:text-red-500 cursor-pointer">Retry</button>
          </span>
        )}
      </span>
      <span className="text-gray-300">|</span>
      <span>{interpretedCount.toLocaleString()} interpreted values</span>
    </div>
  );
}
