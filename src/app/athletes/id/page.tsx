import { createServerClient } from '@/lib/supabase/client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FileText, Plus } from 'lucide-react'
import type { Athlete, TestCMJ, TestIMTP, TestSprint, TestVBTSession, ReadinessLog } from '@/types'
import { fmtNum, fmtDate, calcAge, readinessTrafficLight, readinessLabel, TRAFFIC_COLORS } from '@/lib/utils/benchmark'
import CMJChart from '@/components/charts/CMJChart'
import SprintChart from '@/components/charts/SprintChart'
import ReadinessChart from '@/components/charts/ReadinessChart'
import VBTChart from '@/components/charts/VBTChart'

const ROLE_LABELS: Record<string, string> = {
  portiere:'Portiere', difensore_centrale:'Difensore centrale', terzino:'Terzino',
  centrocampista_difensivo:'CDC', centrocampista:'Centrocampista',
  centrocampista_offensivo:'COF', ala:'Ala', attaccante:'Attaccante', trequartista:'Trequartista',
}
const CAT_LABELS: Record<string, string> = {
  serie_a:'Serie A', serie_b:'Serie B', serie_c:'Serie C',
  u19:'U19', u17:'U17', u15:'U15', u14:'U14', altro:'Altro',
}
const FOOT: Record<string, string> = { destro:'Destro', sinistro:'Sinistro', ambidestro:'Ambidestro' }

function Delta({ curr, prev, invert = false, decimals = 1 }: {
  curr?: number | null; prev?: number | null; invert?: boolean; decimals?: number
}) {
  if (curr == null || prev == null) return null
  const diff = curr - prev
  if (Math.abs(diff) < 0.001) return <span className="delta-flat">→ stabile</span>
  const positive = invert ? diff < 0 : diff > 0
  const sign = diff > 0 ? '+' : ''
  return positive
    ? <span className="delta-up">▲ {sign}{diff.toFixed(decimals)}</span>
    : <span className="delta-down">▼ {diff.toFixed(decimals)}</span>
}

function MetricCard({ label, value, unit, children }: {
  label: string; value: string; unit?: string; children?: React.ReactNode
}) {
  return (
    <div className="card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">
        {value} {unit && <span className="text-sm text-text-muted font-normal">{unit}</span>}
      </div>
      {children && <div className="mt-1">{children}</div>}
    </div>
  )
}

export default async function AthleteDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const [
    { data: athlete },
    { data: cmjTests },
    { data: imtpTests },
    { data: sprintTests },
    { data: vbtSessions },
    { data: readinessLogs },
  ] = await Promise.all([
    supabase.from('athletes').select('*').eq('id', params.id).single(),
    supabase.from('tests_cmj').select('*').eq('athlete_id', params.id).order('tested_at', { ascending: false }).limit(20),
    supabase.from('tests_imtp').select('*').eq('athlete_id', params.id).order('tested_at', { ascending: false }).limit(20),
    supabase.from('tests_sprint').select('*').eq('athlete_id', params.id).order('tested_at', { ascending: false }).limit(20),
    supabase.from('tests_vbt_sessions').select('*, sets:tests_vbt_sets(*)').eq('athlete_id', params.id).order('tested_at', { ascending: false }).limit(10),
    supabase.from('readiness_logs').select('*').eq('athlete_id', params.id).order('logged_date', { ascending: false }).limit(30),
  ])

  if (!athlete) notFound()

  const a = athlete as Athlete
  const cmj = (cmjTests ?? []) as TestCMJ[]
  const imtp = (imtpTests ?? []) as TestIMTP[]
  const sprint = (sprintTests ?? []) as TestSprint[]
  const vbt = (vbtSessions ?? []) as TestVBTSession[]
  const readiness = (readinessLogs ?? []) as ReadinessLog[]

  const latestCMJ = cmj[0]
  const prevCMJ = cmj[1]
  const latestIMTP = imtp[0]
  const prevIMTP = imtp[1]
  const latestSprint = sprint[0]
  const prevSprint = sprint[1]
  const latestVBT = vbt[0]
  const todayReadiness = readiness[0]

  const age = calcAge(a.date_of_birth)
  const rsScore = todayReadiness?.readiness_score ?? null
  const rsTL = rsScore != null ? readinessTrafficLight(rsScore) : null
  const rsTLColor = rsTL ? TRAFFIC_COLORS[rsTL] : null

  const initials = `${a.first_name[0] ?? ''}${a.last_name[0] ?? ''}`.toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Athlete header + tabs = full content area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-bg-border flex items-center gap-4 flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-[#1e3a5f] flex items-center justify-center
                          text-brand-blue font-bold text-base flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-text-primary">
              {a.first_name} {a.last_name}
            </h1>
            <div className="text-xs text-text-muted mt-0.5">
              {ROLE_LABELS[a.role ?? ''] ?? '—'} · {CAT_LABELS[a.category ?? ''] ?? '—'}
              · {age} anni · Piede {FOOT[a.dominant_foot ?? 'destro']}
              · {a.height_cm ?? '—'} cm · {a.weight_kg ?? '—'} kg
              {a.bmi ? ` · BMI ${a.bmi}` : ''}
            </div>
            <div className="flex gap-2 mt-1.5">
              {rsScore != null && rsTLColor && (
                <span className="badge-green" style={{ background: rsTLColor.bg, color: rsTLColor.text }}>
                  ● Readiness {Math.round(rsScore)}%
                </span>
              )}
              {latestCMJ && (
                <span className="badge-blue">Record CMJ: {fmtNum(latestCMJ.jump_height_cm)} cm</span>
              )}
              {latestCMJ && (
                <span className="badge-yellow">
                  Test: {fmtDate(latestCMJ.tested_at)}
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/athletes/${a.id}/report`}
            className="btn-primary text-sm"
          >
            <FileText size={14} /> Report PDF
          </Link>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">

            {/* === CMJ === */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-title">Test CMJ</h2>
                <Link href={`/athletes/${a.id}/cmj/new`} className="btn-secondary text-xs py-1.5">
                  <Plus size={12} /> Nuovo test
                </Link>
              </div>

              {latestCMJ ? (
                <>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <MetricCard label="Jump Height" value={fmtNum(latestCMJ.jump_height_cm)} unit="cm">
                      <Delta curr={latestCMJ.jump_height_cm} prev={prevCMJ?.jump_height_cm} />
                    </MetricCard>
                    <MetricCard label="Peak Power" value={fmtNum(latestCMJ.peak_power_w, 0)} unit="W">
                      <Delta curr={latestCMJ.peak_power_w} prev={prevCMJ?.peak_power_w} decimals={0} />
                    </MetricCard>
                    <MetricCard label="Peak Power/kg" value={fmtNum(latestCMJ.peak_power_w_per_kg)} unit="W/kg">
                      <Delta curr={latestCMJ.peak_power_w_per_kg} prev={prevCMJ?.peak_power_w_per_kg} />
                    </MetricCard>
                    <MetricCard label="RSI Modified" value={fmtNum(latestCMJ.rsi_modified, 3)}>
                      <Delta curr={latestCMJ.rsi_modified} prev={prevCMJ?.rsi_modified} decimals={3} />
                    </MetricCard>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="card">
                      <div className="section-title mb-3">Trend Jump Height</div>
                      <CMJChart data={cmj.slice().reverse()} />
                    </div>
                    <div className="card">
                      <div className="section-title mb-3">Peak Velocity</div>
                      <div className="flex gap-6 pt-1">
                        <div>
                          <div className="text-xs text-text-muted mb-1">Propulsiva</div>
                          <div className="text-xl font-semibold text-brand-blue">
                            {fmtNum(latestCMJ.peak_velocity_prop_ms, 2)}
                            <span className="text-xs text-text-muted font-normal ml-1">m/s</span>
                          </div>
                        </div>
                        <div className="w-px bg-bg-border" />
                        <div>
                          <div className="text-xs text-text-muted mb-1">Braking</div>
                          <div className="text-xl font-semibold text-[#a855f7]">
                            {fmtNum(latestCMJ.peak_velocity_brake_ms, 2)}
                            <span className="text-xs text-text-muted font-normal ml-1">m/s</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState href={`/athletes/${a.id}/cmj/new`} label="Inserisci primo test CMJ" />
              )}
            </section>

            {/* === IMTP === */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-title">Test IMTP</h2>
                <Link href={`/athletes/${a.id}/imtp/new`} className="btn-secondary text-xs py-1.5">
                  <Plus size={12} /> Nuovo test
                </Link>
              </div>

              {latestIMTP ? (
                <div className="grid grid-cols-4 gap-3">
                  <MetricCard label="Peak Force" value={fmtNum(latestIMTP.peak_force_n, 0)} unit="N">
                    <Delta curr={latestIMTP.peak_force_n} prev={prevIMTP?.peak_force_n} decimals={0} />
                  </MetricCard>
                  <MetricCard label="Peak Force/kg" value={fmtNum(latestIMTP.peak_force_n_per_kg)} unit="N/kg">
                    <Delta curr={latestIMTP.peak_force_n_per_kg} prev={prevIMTP?.peak_force_n_per_kg} />
                  </MetricCard>
                  <MetricCard label="Max RFD" value={fmtNum(latestIMTP.max_rfd_n_per_s, 0)} unit="N/s">
                    <Delta curr={latestIMTP.max_rfd_n_per_s} prev={prevIMTP?.max_rfd_n_per_s} decimals={0} />
                  </MetricCard>
                  <MetricCard label="Early RFD" value={fmtNum(latestIMTP.early_rfd_n_per_s, 0)} unit="N/s">
                    <Delta curr={latestIMTP.early_rfd_n_per_s} prev={prevIMTP?.early_rfd_n_per_s} decimals={0} />
                  </MetricCard>
                  <MetricCard label="Force @ 100ms" value={fmtNum(latestIMTP.force_at_100ms_n, 0)} unit="N" />
                  <MetricCard label="Force @ 150ms" value={fmtNum(latestIMTP.force_at_150ms_n, 0)} unit="N" />
                  <MetricCard label="Force @ 200ms" value={fmtNum(latestIMTP.force_at_200ms_n, 0)} unit="N" />
                  <MetricCard label="Late RFD" value={fmtNum(latestIMTP.late_rfd_n_per_s, 0)} unit="N/s" />
                </div>
              ) : (
                <EmptyState href={`/athletes/${a.id}/imtp/new`} label="Inserisci primo test IMTP" />
              )}
            </section>

            {/* === SPRINT === */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-title">Sprint</h2>
                <Link href={`/athletes/${a.id}/sprint/new`} className="btn-secondary text-xs py-1.5">
                  <Plus size={12} /> Nuovo test
                </Link>
              </div>

              {latestSprint ? (
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard label="10 metri" value={fmtNum(latestSprint.time_10m_s, 2)} unit="s">
                    <Delta curr={latestSprint.time_10m_s} prev={prevSprint?.time_10m_s} invert decimals={3} />
                  </MetricCard>
                  <MetricCard label="30 metri" value={fmtNum(latestSprint.time_30m_s, 2)} unit="s">
                    <Delta curr={latestSprint.time_30m_s} prev={prevSprint?.time_30m_s} invert decimals={3} />
                  </MetricCard>
                  <div className="card col-span-2">
                    <div className="section-title mb-3">Trend Sprint</div>
                    <SprintChart data={sprint.slice().reverse()} />
                  </div>
                </div>
              ) : (
                <EmptyState href={`/athletes/${a.id}/sprint/new`} label="Inserisci primo test sprint" />
              )}
            </section>

            {/* === VBT === */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-title">VBT — Squat</h2>
                <Link href={`/athletes/${a.id}/vbt/new`} className="btn-secondary text-xs py-1.5">
                  <Plus size={12} /> Nuova sessione
                </Link>
              </div>

              {latestVBT ? (
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard label="1RM stimato" value={fmtNum(latestVBT.estimated_1rm_kg, 1)} unit="kg" />
                  <MetricCard label="1RM reale" value={fmtNum(latestVBT.actual_1rm_kg, 1)} unit="kg" />
                  <MetricCard label="R² regressione" value={fmtNum(latestVBT.r_squared, 3)} />
                  <div className="card col-span-3">
                    <div className="section-title mb-3">Curva carico-velocità</div>
                    <VBTChart session={latestVBT} />
                  </div>
                </div>
              ) : (
                <EmptyState href={`/athletes/${a.id}/vbt/new`} label="Inserisci prima sessione VBT" />
              )}
            </section>

            {/* === READINESS === */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-title">Readiness</h2>
                <Link href={`/athletes/${a.id}/readiness/new`} className="btn-secondary text-xs py-1.5">
                  <Plus size={12} /> Log oggi
                </Link>
              </div>

              {readiness.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="card text-center">
                    <div className="metric-label">Score oggi</div>
                    <div className="text-4xl font-semibold mt-1"
                         style={{ color: rsTLColor?.hex ?? '#94a3b8' }}>
                      {rsScore != null ? Math.round(rsScore) : '—'}
                    </div>
                    {rsTL && (
                      <div className="text-xs mt-1" style={{ color: rsTLColor?.text }}>
                        ● {readinessLabel(rsScore!)}
                      </div>
                    )}
                  </div>
                  <div className="card">
                    <div className="metric-label">Parametri oggi</div>
                    {todayReadiness && (
                      <div className="space-y-1.5 mt-1">
                        {[
                          { label: 'Sonno', v: todayReadiness.sleep_quality, color: '#3b82f6' },
                          { label: 'Energia', v: todayReadiness.energy_level, color: '#22c55e' },
                          { label: 'DOMS', v: todayReadiness.doms, color: '#ef4444', invert: true },
                          { label: 'Stress', v: todayReadiness.stress, color: '#eab308', invert: true },
                        ].map(row => (
                          <div key={row.label} className="flex items-center gap-2">
                            <span className="text-xs text-text-muted w-12">{row.label}</span>
                            <div className="flex-1 h-1 bg-bg-border rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(row.v ?? 5) * 10}%`,
                                  background: row.color,
                                }}
                              />
                            </div>
                            <span className="text-xs text-text-secondary w-4 text-right">{row.v ?? '—'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="card col-span-1">
                    <div className="metric-label">Peso oggi</div>
                    <div className="metric-value">
                      {fmtNum(todayReadiness?.weight_kg, 1)}
                      <span className="text-sm text-text-muted font-normal ml-1">kg</span>
                    </div>
                  </div>
                  <div className="card col-span-3">
                    <div className="section-title mb-3">Trend Readiness — 30 giorni</div>
                    <ReadinessChart data={readiness.slice().reverse()} />
                  </div>
                </div>
              ) : (
                <EmptyState href={`/athletes/${a.id}/readiness/new`} label="Inizia a tracciare la readiness" />
              )}
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ href, label }: { href: string; label: string }) {
  return (
    <div className="card flex items-center justify-center py-8 border-dashed">
      <Link href={href} className="btn-secondary text-xs">
        <Plus size={13} /> {label}
      </Link>
    </div>
  )
}
