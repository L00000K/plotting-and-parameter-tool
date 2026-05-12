export function formatPhi(phi: number | null, decimals = 1): string {
  if (phi === null || !isFinite(phi)) return '—';
  return phi.toFixed(decimals);
}

export function formatElev(elev: number, decimals = 2): string {
  return elev.toFixed(decimals);
}
