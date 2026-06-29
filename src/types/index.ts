// ============================================================
// APMS Football — TypeScript Types
// ============================================================

export type DominantFoot = 'destro' | 'sinistro' | 'ambidestro'
export type AthleteRole =
  | 'portiere' | 'difensore_centrale' | 'terzino'
  | 'centrocampista_difensivo' | 'centrocampista' | 'centrocampista_offensivo'
  | 'ala' | 'attaccante' | 'trequartista'
export type Category = 'serie_a' | 'serie_b' | 'serie_c' | 'u19' | 'u17' | 'u15' | 'u14' | 'altro'
export type BenchmarkLevel = 'elite' | 'serie_a' | 'serie_b' | 'u19' | 'u17' | 'u15'
export type DataSource = 'manual' | 'myjump' | 'meloq' | 'import_csv'

// ============================================================
// ATHLETE
// ============================================================

export interface Athlete {
  id: string
  team_id: string
  user_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  height_cm: number | null
  weight_kg: number | null
  dominant_foot: DominantFoot
  role: AthleteRole | null
  category: Category | null
  photo_url: string | null
  notes: string | null
  bmi: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AthleteSummary extends Athlete {
  last_cmj_date: string | null
  last_cmj_height: number | null
  last_imtp_date: string | null
  last_imtp_force: number | null
  last_sprint_date: string | null
  last_sprint_10m: number | null
  today_readiness: number | null
  last_readiness_date: string | null
}

export type AthleteFormData = Omit<Athlete, 'id' | 'team_id' | 'user_id' | 'bmi' | 'is_active' | 'created_at' | 'updated_at'>

// ============================================================
// CMJ
// ============================================================

export interface TestCMJ {
  id: string
  athlete_id: string
  tested_at: string
  source: DataSource
  jump_height_cm: number | null
  peak_power_w: number | null
  peak_power_w_per_kg: number | null
  rsi_modified: number | null
  peak_velocity_prop_ms: number | null
  peak_velocity_brake_ms: number | null
  contact_time_ms: number | null
  flight_time_ms: number | null
  body_weight_kg: number | null
  n_jumps: number
  best_jump: boolean
  benchmark_level: BenchmarkLevel | null
  notes: string | null
  created_at: string
}

export type TestCMJFormData = Omit<TestCMJ, 'id' | 'athlete_id' | 'created_at' | 'source'>

// ============================================================
// IMTP
// ============================================================

export interface TestIMTP {
  id: string
  athlete_id: string
  tested_at: string
  source: DataSource
  body_weight_kg: number | null
  peak_force_n: number | null
  peak_force_n_per_kg: number | null
  early_rfd_n_per_s: number | null
  max_rfd_n_per_s: number | null
  late_rfd_n_per_s: number | null
  force_at_100ms_n: number | null
  force_at_150ms_n: number | null
  force_at_200ms_n: number | null
  test_duration_ms: number | null
  n_attempts: number
  benchmark_level: BenchmarkLevel | null
  notes: string | null
  created_at: string
}

export type TestIMTPFormData = Omit<TestIMTP, 'id' | 'athlete_id' | 'created_at' | 'source'>

// ============================================================
// SPRINT
// ============================================================

export interface TestSprint {
  id: string
  athlete_id: string
  tested_at: string
  source: DataSource
  time_10m_s: number | null
  time_30m_s: number | null
  time_5m_s: number | null
  time_20m_s: number | null
  surface: string | null
  wind_ms: number | null
  timing_system: string | null
  n_attempts: number
  benchmark_level: BenchmarkLevel | null
  notes: string | null
  created_at: string
}

export type TestSprintFormData = Omit<TestSprint, 'id' | 'athlete_id' | 'created_at' | 'source'>

// ============================================================
// VBT
// ============================================================

export interface TestVBTSet {
  id: string
  session_id: string
  load_kg: number
  load_pct: number | null
  velocity_ms: number
  rpe: number | null
  set_number: number | null
  created_at: string
}

export interface TestVBTSession {
  id: string
  athlete_id: string
  tested_at: string
  source: DataSource
  exercise: string
  estimated_1rm_kg: number | null
  actual_1rm_kg: number | null
  r_squared: number | null
  device: string | null
  benchmark_level: BenchmarkLevel | null
  notes: string | null
  created_at: string
  sets?: TestVBTSet[]
}

export type TestVBTSessionFormData = Omit<TestVBTSession, 'id' | 'athlete_id' | 'created_at' | 'source' | 'sets'> & {
  sets: Omit<TestVBTSet, 'id' | 'session_id' | 'created_at'>[]
}

// ============================================================
// READINESS
// ============================================================

export interface ReadinessLog {
  id: string
  athlete_id: string
  logged_date: string
  sleep_quality: number | null
  energy_level: number | null
  doms: number | null
  stress: number | null
  rpe_prev: number | null
  weight_kg: number | null
  readiness_score: number | null
  notes: string | null
  created_at: string
}

export type ReadinessLogFormData = Omit<ReadinessLog, 'id' | 'athlete_id' | 'readiness_score' | 'created_at'>

// ============================================================
// BENCHMARK
// ============================================================

export interface Benchmark {
  id: string
  test_type: string
  metric_key: string
  metric_label: string
  category: BenchmarkLevel
  mean: number
  std_dev: number
  p25: number
  p50: number
  p75: number
  p90: number
  unit: string
  higher_is_better: boolean
  source_refs: string[]
}

// ============================================================
// UTILS
// ============================================================

export interface BenchmarkResult {
  percentile: number
  z_score: number
  traffic_light: 'green' | 'yellow' | 'red'
  label: string
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export type TrafficLight = 'green' | 'yellow' | 'red'

// ============================================================
// LABEL MAPS (per UI)
// ============================================================

export const ROLE_LABELS: Record<AthleteRole, string> = {
  portiere: 'Portiere',
  difensore_centrale: 'Difensore centrale',
  terzino: 'Terzino',
  centrocampista_difensivo: 'Centrocampista difensivo',
  centrocampista: 'Centrocampista',
  centrocampista_offensivo: 'Centrocampista offensivo',
  ala: 'Ala',
  attaccante: 'Attaccante',
  trequartista: 'Trequartista',
}

export const CATEGORY_LABELS: Record<Category, string> = {
  serie_a: 'Serie A',
  serie_b: 'Serie B',
  serie_c: 'Serie C',
  u19: 'U19 / Primavera',
  u17: 'U17',
  u15: 'U15',
  u14: 'U14',
  altro: 'Altro',
}

export const BENCHMARK_LEVEL_LABELS: Record<BenchmarkLevel, string> = {
  elite: 'Elite / Serie A',
  serie_a: 'Serie A',
  serie_b: 'Serie B',
  u19: 'U19',
  u17: 'U17',
  u15: 'U15',
}
