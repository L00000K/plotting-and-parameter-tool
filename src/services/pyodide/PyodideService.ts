import { v4 as uuidv4 } from 'uuid';

type PromiseCallbacks = {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
};

export type PyodidePhase = 'idle' | 'loading' | 'ready' | 'error';

export interface BatchResult {
  results: (number | null)[];
  errors: (string | null)[];
}

export interface DesignLineResult {
  phis: (number | null)[];
}

type StatusListener = (phase: PyodidePhase, message: string, error: string | null) => void;

class PyodideService {
  private worker: Worker | null = null;
  private pending = new Map<string, PromiseCallbacks>();
  private phase: PyodidePhase = 'idle';
  private listeners: StatusListener[] = [];

  private emit(phase: PyodidePhase, message = '', error: string | null = null) {
    this.phase = phase;
    this.listeners.forEach((l) => l(phase, message, error));
  }

  onStatusChange(listener: StatusListener): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  getPhase(): PyodidePhase { return this.phase; }

  async init(): Promise<void> {
    if (this.phase === 'ready' || this.phase === 'loading') return;
    this.emit('loading', 'Starting Python runtime...');

    this.worker = new Worker(
      new URL('../../workers/pyodide.worker.ts', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = (event) => {
      const msg = event.data;
      if (msg.type === 'READY') {
        this.emit('ready', 'Python runtime ready');
        return;
      }
      if (msg.type === 'INIT_ERROR') {
        this.emit('error', '', msg.error);
        return;
      }
      if (msg.type === 'INIT_PROGRESS') {
        this.emit('loading', msg.message);
        return;
      }
      if (msg.type === 'BATCH_RESULT' || msg.type === 'DESIGN_LINE_RESULT') {
        const cb = this.pending.get(msg.id);
        if (cb) {
          this.pending.delete(msg.id);
          cb.resolve(msg);
        }
      }
    };

    this.worker.onerror = (e) => {
      this.emit('error', '', e.message);
    };

    this.worker.postMessage({ type: 'INIT' });
  }

  async runBatch(code: string, rows: Record<string, number>[]): Promise<BatchResult> {
    if (!this.worker || this.phase !== 'ready') {
      return { results: rows.map(() => null), errors: rows.map(() => 'Pyodide not ready') };
    }
    const id = uuidv4();
    return new Promise((resolve, reject) => {
      this.pending.set(id, {
        resolve: (v) => resolve((v as { results: (number | null)[]; errors: (string | null)[] })),
        reject,
      });
      this.worker!.postMessage({ type: 'RUN_BATCH', id, code, rows });
    });
  }

  async runDesignLine(
    code: string,
    elevations: number[],
    groundLevel: number
  ): Promise<DesignLineResult> {
    if (!this.worker || this.phase !== 'ready') {
      return { phis: elevations.map(() => null) };
    }
    const id = uuidv4();
    return new Promise((resolve, reject) => {
      this.pending.set(id, {
        resolve: (v) => resolve(v as DesignLineResult),
        reject,
      });
      this.worker!.postMessage({ type: 'RUN_DESIGN_LINE', id, code, elevations, groundLevel });
    });
  }
}

export const pyodideService = new PyodideService();
