import { useEffect, useCallback } from 'react';
import { pyodideService, type PyodidePhase } from './PyodideService';
import { useProjectStore } from '@/store/useProjectStore';

export function usePyodide() {
  const setPyodideStatus = useProjectStore((s) => s.setPyodideStatus);
  const status = useProjectStore((s) => s.pyodide_status);

  useEffect(() => {
    const unsubscribe = pyodideService.onStatusChange((phase, message, error) => {
      setPyodideStatus({ phase, progress_message: message, error_message: error });
    });
    return unsubscribe;
  }, [setPyodideStatus]);

  const initPyodide = useCallback(() => {
    pyodideService.init();
  }, []);

  return { status, initPyodide, phase: status.phase as PyodidePhase };
}
