'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter, ReferenceLine
} from 'recharts'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import type { TestCMJ, TestSprint, ReadinessLog, TestVBTSession } from '@/types'
import { linearRegression } from '@/lib/utils/benchmark'

const TOOLTIP_STYLE = {
  backgroundColor: '#1a1d28',
  border: '0.5px solid #252a3a',
  borderRadius: '6px',
  fontSize: '12px',
  color: '#e2e8f0',
}

function fmtAxisDate(dateStr: string) {
  return format(new Date(dateStr), 'MMM', { locale: it })
}

// ============================================================
// CMJ Trend Chart
// ============================================================
export function CMJChart({ data }: { data: TestCMJ[] }) {
  if (data.length === 0) return <div className="h-28 flex items-center justify-center text-xs text-text-muted">Nessun dato</div>

  const chartData = data.map(d => ({
    date: fmtAxisDate(d.tested_at),
    'Jump Height': d.jump_height_cm,
    'Peak Power/kg': d.peak_power_w_per_kg,
  }))

  return (
    <ResponsiveContainer width="100%" height={110}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" />
        <XAxis dataKey="date" tick={{ fill: '#4a5568', fontSize: 10 }} />
        <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Line type="monotone" dataKey="Jump Height" stroke="#3b82f6"
          dot={{ r: 3, fill: '#3b82f6' }} strokeWidth={1.5} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ============================================================
// Sprint Chart
// ============================================================
export function SprintChart({ data }: { data: TestSprint[] }) {
  if (data.length === 0) return <div className="h-24 flex items-center justify-center text-xs text-text-muted">Nessun dato</div>

  const chartData = data.map(d => ({
    date: fmtAxisDate(d.tested_at),
    '10m': d.time_10m_s,
    '30m': d.time_30m_s,
  }))

  return (
    <ResponsiveContainer width="100%" height={100}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" />
        <XAxis dataKey="date" tick={{ fill: '#4a5568', fontSize: 10 }} />
        <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Line type="monotone" dataKey="10m" stroke="#22c55e" dot={{ r: 3, fill: '#22c55e' }} strokeWidth={1.5} connectNulls />
        <Line type="monotone" dataKey="30m" stroke="#3b82f6" dot={{ r: 3, fill: '#3b82f6' }} strokeWidth={1.5} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ============================================================
// Readiness Chart
// ============================================================
export function ReadinessChart({ data }: { data: ReadinessLog[] }) {
  if (data.length === 0) return <div className="h-24 flex items-center justify-center text-xs text-text-muted">Nessun dato</div>

  const chartData = data.map(d => ({
    date: fmtAxisDate(d.logged_date),
    score: d.readiness_score != null ? Math.round(d.readiness_score) : null,
  }))

  return (
    <ResponsiveContainer width="100%" height={90}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" />
        <XAxis dataKey="date" tick={{ fill: '#4a5568', fontSize: 10 }} />
        <YAxis domain={[0, 100]} tick={{ fill: '#4a5568', fontSize: 10 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <ReferenceLine y={75} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.4} />
        <ReferenceLine y={50} stroke="#eab308" strokeDasharray="3 3" strokeOpacity={0.4} />
        <Line type="monotone" dataKey="score" stroke="#22c55e"
          dot={false} strokeWidth={1.5} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ============================================================
// VBT Load-Velocity Chart (Scatter + regression line)
// ============================================================
export function VBTChart({ session }: { session: TestVBTSession }) {
  const sets = session.sets ?? []
  if (sets.length === 0) return <div className="h-28 flex items-center justify-center text-xs text-text-muted">Nessun dato</div>

  const points = sets.map(s => ({ x: s.load_kg, y: s.velocity_ms }))
  const reg = points.length >= 2 ? linearRegression(points) : null

  const minX = Math.min(...points.map(p => p.x)) * 0.9
  const maxX = session.estimated_1rm_kg
    ? session.estimated_1rm_kg * 1.05
    : Math.max(...points.map(p => p.x)) * 1.1

  const regLine = reg
    ? [
        { x: minX, y: parseFloat((reg.slope * minX + reg.intercept).toFixed(3)) },
        { x: maxX, y: parseFloat((reg.slope * maxX + reg.intercept).toFixed(3)) },
      ]
    : []

  return (
    <ResponsiveContainer width="100%" height={120}>
      <ScatterChart margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" />
        <XAxis type="number" dataKey="x" name="Carico" unit=" kg" tick={{ fill: '#4a5568', fontSize: 10 }} domain={['auto', 'auto']} />
        <YAxis type="number" dataKey="y" name="Velocità" unit=" m/s" tick={{ fill: '#4a5568', fontSize: 10 }} domain={['auto', 'auto']} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ strokeDasharray: '3 3' }} />
        <Scatter name="Set" data={points} fill="#3b82f6" />
        {regLine.length > 0 && (
          <Scatter name="Regressione" data={regLine} fill="transparent"
            line={{ stroke: '#f59e0b', strokeDasharray: '5 5', strokeWidth: 1.5 }} />
        )}
      </ScatterChart>
    </ResponsiveContainer>
  )
}

export default CMJChart
