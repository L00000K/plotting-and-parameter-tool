// Web Worker: loads Pyodide from CDN and executes geotechnical equation batches.
// Runs in a separate thread to keep the UI responsive during Python execution.

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.mjs';

type WorkerRequest =
  | { type: 'INIT' }
  | { type: 'RUN_BATCH'; id: string; code: string; rows: Record<string, number>[] }
  | { type: 'RUN_DESIGN_LINE'; id: string; code: string; elevations: number[]; groundLevel: number };

type WorkerResponse =
  | { type: 'READY' }
  | { type: 'INIT_ERROR'; error: string }
  | { type: 'BATCH_RESULT'; id: string; results: (number | null)[]; errors: (string | null)[] }
  | { type: 'DESIGN_LINE_RESULT'; id: string; phis: (number | null)[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pyodide: any = null;

async function init() {
  try {
    self.postMessage({ type: 'INIT_PROGRESS', message: 'Loading Python runtime...' });
    // importScripts() is unavailable in ES module workers; use dynamic import with the .mjs build
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { loadPyodide } = await import(/* @vite-ignore */ PYODIDE_CDN) as any;
    pyodide = await loadPyodide();
    self.postMessage({ type: 'READY' } satisfies WorkerResponse);
  } catch (e) {
    self.postMessage({ type: 'INIT_ERROR', error: String(e) } satisfies WorkerResponse);
  }
}

function runSingle(code: string, vars: Record<string, number>): number | null {
  try {
    // Build variable injection code
    const injections = Object.entries(vars)
      .map(([k, v]) => `${k} = ${isFinite(v) ? v : 0}`)
      .join('\n');

    const fullCode = `
import math
log = math.log
log2 = math.log2
log10 = math.log10
sqrt = math.sqrt
atan = math.atan
asin = math.asin
degrees = math.degrees
radians = math.radians
sin = math.sin
cos = math.cos
tan = math.tan
pi = math.pi
exp = math.exp
${injections}
phi = None
${code}
`;
    const result = pyodide.runPython(fullCode);
    void result; // result is None — phi is extracted via globals
    const phi = pyodide.runPython('phi');
    if (phi === null || phi === undefined) return null;
    const val = typeof phi === 'number' ? phi : Number(phi);
    return isFinite(val) ? val : null;
  } catch {
    return null;
  }
}

function runSingleWithError(code: string, vars: Record<string, number>): [number | null, string | null] {
  try {
    const injections = Object.entries(vars)
      .map(([k, v]) => `${k} = ${isFinite(v) ? v : 0}`)
      .join('\n');

    const fullCode = `
import math
log = math.log
log2 = math.log2
log10 = math.log10
sqrt = math.sqrt
atan = math.atan
asin = math.asin
degrees = math.degrees
radians = math.radians
sin = math.sin
cos = math.cos
tan = math.tan
pi = math.pi
exp = math.exp
${injections}
phi = None
${code}
`;
    pyodide.runPython(fullCode);
    const phi = pyodide.runPython('phi');
    if (phi === null || phi === undefined) return [null, 'phi not assigned'];
    const val = typeof phi === 'number' ? phi : Number(phi);
    return isFinite(val) ? [val, null] : [null, `non-finite result: ${val}`];
  } catch (e) {
    return [null, String(e).slice(0, 200)];
  }
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;

  if (msg.type === 'INIT') {
    await init();
    return;
  }

  if (!pyodide) {
    return;
  }

  if (msg.type === 'RUN_BATCH') {
    const results: (number | null)[] = [];
    const errors: (string | null)[] = [];
    for (const row of msg.rows) {
      const [phi, err] = runSingleWithError(msg.code, row);
      results.push(phi);
      errors.push(err);
    }
    self.postMessage({ type: 'BATCH_RESULT', id: msg.id, results, errors } satisfies WorkerResponse);
    return;
  }

  if (msg.type === 'RUN_DESIGN_LINE') {
    const phis: (number | null)[] = [];
    for (const elev of msg.elevations) {
      const vars = { elevation: elev, depth: msg.groundLevel - elev };
      const phi = runSingle(msg.code, vars);
      phis.push(phi);
    }
    self.postMessage({ type: 'DESIGN_LINE_RESULT', id: msg.id, phis } satisfies WorkerResponse);
  }
};
