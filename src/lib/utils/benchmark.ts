import type { Benchmark, BenchmarkResult, BenchmarkLevel } from '@/types'

// Approssimazione della funzione di errore (erf) per la CDF normale
function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const y =
    1 -
    (0.254829592 * t -
      0.284496736 * t ** 2 +
      1.421413741 * t ** 3 -
      1.453152027 * t ** 4 +
      1.061405429 * t ** 5) *
      Math.exp(-x * x)
  return x < 0 ? -y : y
}

// Percentile da z-score (distribuzione normale standard)
function zToPercentile(z: number): number {
  return Math.round(50 + 50 * erf(z / Math.sqrt(2)))
}

/**
 * Calcola il percentile e il semaforo per un valore dato il benchmark.
 */
export function calcBenchmarkResult(
  value: number,
  benchmark: Benchmark
): BenchmarkResult {
  const z = (value - benchmark.mean) / benchmark.std_dev
  let percentile = zToPercentile(z)

  // Se lower_is_better (es. sprint in secondi) invertiamo
  if (!benchmark.higher_is_better) {
    percentile = 100 - percentile
  }

  percentile = Math.max(1, Math.min(99, percentile))

  let traffic_light: 'green' | 'yellow' | 'red'
  let label: string

  if (percentile >= 75) {
    traffic_light = 'green'
    label = 'Elite'
  } else if (percentile >= 40) {
    traffic_light = 'yellow'
    label = 'Nella norma'
  } else {
    traffic_light = 'red'
    label = 'Da migliorare'
  }

  return { percentile, z_score: parseFloat(z.toFixed(2)), traffic_light, label }
}

/**
 * Colori semaforo
 */
export const TRAFFIC_COLORS = {
  green: { bg: '#1e3a1e', text: '#22c55e', hex: '#22c55e' },
  yellow: { bg: '#3a2e10', text: '#eab308', hex: '#eab308' },
  red: { bg: '#3a1e1e', text: '#ef4444', hex: '#ef4444' },
} as const

/**
 * Readiness Score composito (0–100)
 * Formula basata su Hooper & Mackinnon (1995) e McLean et al. (2010)
 */
export function calcReadinessScore(params: {
  sleep_quality: number   // 1–10
  energy_level: number    // 1–10
  doms: number            // 1–10 (invertito)
  stress: number          // 1–10 (invertito)
  rpe_prev: number        // 1–10, penalizza >7
}): number {
  const { sleep_quality, energy_level, doms, stress, rpe_prev } = params
  const rpe_adj = 10 - Math.max(0, (rpe_prev - 7) * 2)
  const raw =
    sleep_quality * 0.25 +
    energy_level * 0.25 +
    (10 - doms) * 0.20 +
    (10 - stress) * 0.15 +
    rpe_adj * 0.15
  return Math.round(raw * 10)
}

export function readinessTrafficLight(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 75) return 'green'
  if (score >= 50) return 'yellow'
  return 'red'
}

export function readinessLabel(score: number): string {
  if (score >= 75) return 'Pronto'
  if (score >= 50) return 'Attenzione'
  return 'Recupero'
}

/**
 * Regressione lineare semplice per la curva carico-velocità VBT.
 * Restituisce pendenza, intercetta, R² e 1RM stimato (velocità minima = 0.17 m/s default).
 */
export function linearRegression(points: { x: number; y: number }[]): {
  slope: number
  intercept: number
  r_squared: number
  estimated_1rm: number
} {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: 0, r_squared: 0, estimated_1rm: 0 }

  const sumX = points.reduce((s, p) => s + p.x, 0)
  const sumY = points.reduce((s, p) => s + p.y, 0)
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // R²
  const meanY = sumY / n
  const ssTot = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0)
  const ssRes = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0)
  const r_squared = ssTot === 0 ? 0 : 1 - ssRes / ssTot

  // 1RM stimato: carico a cui velocity = 0.17 m/s (soglia concentric mean velocity)
  const MIN_VELOCITY = 0.17
  const estimated_1rm = slope !== 0 ? (MIN_VELOCITY - intercept) / slope : 0

  return {
    slope: parseFloat(slope.toFixed(4)),
    intercept: parseFloat(intercept.toFixed(4)),
    r_squared: parseFloat(r_squared.toFixed(4)),
    estimated_1rm: parseFloat(estimated_1rm.toFixed(1)),
  }
}

/**
 * Calcola l'età in anni da una data di nascita
 */
export function calcAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

/**
 * Mappa la categoria atleta al benchmark level più appropriato
 */
export function categoryToBenchmarkLevel(category: string): BenchmarkLevel {
  const map: Record<string, BenchmarkLevel> = {
    serie_a: 'elite',
    serie_b: 'serie_b',
    serie_c: 'serie_b',
    u19: 'u19',
    u17: 'u17',
    u15: 'u15',
    u14: 'u15',
    altro: 'serie_b',
  }
  return map[category] ?? 'serie_b'
}

/**
 * Formato numero per display (es. 1847 → "1.847", 0.71 → "0.71")
 */
export function fmtNum(value: number | null | undefined, decimals = 2): string {
  if (value == null) return '—'
  if (value >= 1000) return value.toLocaleString('it-IT')
  return value.toFixed(decimals)
}

/**
 * Formato data italiana
 */
export function fmtDate(dateString: string | null): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('it-IT')
}
