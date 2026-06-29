'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { linearRegression } from '@/lib/utils/benchmark'
import { Plus, Trash2 } from 'lucide-react'
import type { BenchmarkLevel } from '@/types'
import { BENCHMARK_LEVEL_LABELS } from '@/types'

interface SetRow { load_kg: string; velocity_ms: string; rpe: string }

export default function NewVBTPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    tested_at: new Date().toISOString().slice(0, 16),
    exercise: 'squat',
    actual_1rm_kg: '',
    device: '',
    benchmark_level: 'u19' as BenchmarkLevel,
    notes: '',
  })

  const [sets, setSets] = useState<SetRow[]>([
    { load_kg: '', velocity_ms: '', rpe: '' },
    { load_kg: '', velocity_ms: '', rpe: '' },
    { load_kg: '', velocity_ms: '', rpe: '' },
  ])

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const updateSet = (i: number, k: keyof SetRow, v: string) => {
    setSets(rows => rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r))
  }

  const addSet = () => setSets(rows => [...rows, { load_kg: '', velocity_ms: '', rpe: '' }])
  const removeSet = (i: number) => setSets(rows => rows.filter((_, idx) => idx !== i))

  // Calcola regressione in tempo reale
  const validPoints = sets
    .filter(s => s.load_kg !== '' && s.velocity_ms !== '')
    .map(s => ({ x: parseFloat(s.load_kg), y: parseFloat(s.velocity_ms) }))
    .filter(p => !isNaN(p.x) && !isNaN(p.y))

  const regression = validPoints.length >= 2 ? linearRegression(validPoints) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validPoints.length < 2) {
      setError('Inserisci almeno 2 coppie carico-velocità valide per la regressione.')
      return
    }
    setLoading(true)
    setError(null)

    // Inserisci sessione
    const { data: session, error: sessionErr } = await supabase
      .from('tests_vbt_sessions')
      .insert({
        athlete_id: params.id,
        tested_at: form.tested_at,
        exercise: form.exercise,
        actual_1rm_kg: form.actual_1rm_kg === '' ? null : parseFloat(form.actual_1rm_kg),
        estimated_1rm_kg: regression?.estimated_1rm ?? null,
        r_squared: regression?.r_squared ?? null,
        device: form.device || null,
        benchmark_level: form.benchmark_level,
        notes: form.notes || null,
        source: 'manual',
      })
      .select('id')
      .single()

    if (sessionErr || !session) {
      setError(sessionErr?.message ?? 'Errore salvataggio sessione')
      setLoading(false)
      return
    }

    // Inserisci sets
    const validSets = sets
      .filter(s => s.load_kg !== '' && s.velocity_ms !== '')
      .map((s, i) => ({
        session_id: session.id,
        load_kg: parseFloat(s.load_kg),
        velocity_ms: parseFloat(s.velocity_ms),
        rpe: s.rpe === '' ? null : parseInt(s.rpe),
        set_number: i + 1,
      }))

    await supabase.from('tests_vbt_sets').insert(validSets)

    router.push(`/athletes/${params.id}`)
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-xs text-text-muted hover:text-text-secondary mb-3 block">
          ← Indietro
        </button>
        <h1 className="text-lg font-semibold text-text-primary">Nuova sessione VBT</h1>
        <p className="text-xs text-text-muted mt-1">Velocity Based Training — curva carico-velocità con regressione automatica</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card-lg">
          <h2 className="section-title mb-4">Sessione</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data e ora *</label>
              <input type="datetime-local" className="input" value={form.tested_at}
                onChange={e => setF('tested_at', e.target.value)} required />
            </div>
            <div>
              <label className="label">Esercizio</label>
              <select className="input" value={form.exercise} onChange={e => setF('exercise', e.target.value)}>
                <option value="squat">Squat</option>
                <option value="bench">Bench Press</option>
                <option value="deadlift">Deadlift</option>
                <option value="hip_thrust">Hip Thrust</option>
                <option value="rdl">Romanian Deadlift</option>
              </select>
            </div>
            <div>
              <label className="label">Device VBT usato</label>
              <input type="text" className="input" placeholder="Vitruve, Push Band, Tendo…"
                value={form.device} onChange={e => setF('device', e.target.value)} />
            </div>
            <div>
              <label className="label">Benchmark</label>
              <select className="input" value={form.benchmark_level}
                onChange={e => setF('benchmark_level', e.target.value as BenchmarkLevel)}>
                {Object.entries(BENCHMARK_LEVEL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">1RM reale misurato (kg)</label>
              <input type="number" step="0.5" className="input" placeholder="opzionale"
                value={form.actual_1rm_kg} onChange={e => setF('actual_1rm_kg', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Sets */}
        <div className="card-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Coppie carico–velocità</h2>
            <button type="button" onClick={addSet} className="btn-secondary text-xs py-1.5">
              <Plus size={12} /> Aggiungi set
            </button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs text-text-muted px-1 mb-1">
              <span className="col-span-1">#</span>
              <span className="col-span-4">Carico (kg)</span>
              <span className="col-span-4">Velocità (m/s)</span>
              <span className="col-span-2">RPE</span>
              <span className="col-span-1" />
            </div>
            {sets.map((s, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <span className="col-span-1 text-xs text-text-muted text-center">{i + 1}</span>
                <input
                  type="number" step="0.5" className="input col-span-4 py-1.5" placeholder="80"
                  value={s.load_kg} onChange={e => updateSet(i, 'load_kg', e.target.value)}
                />
                <input
                  type="number" step="0.001" className="input col-span-4 py-1.5" placeholder="0.740"
                  value={s.velocity_ms} onChange={e => updateSet(i, 'velocity_ms', e.target.value)}
                />
                <input
                  type="number" min="1" max="10" className="input col-span-2 py-1.5" placeholder="7"
                  value={s.rpe} onChange={e => updateSet(i, 'rpe', e.target.value)}
                />
                <button
                  type="button" onClick={() => removeSet(i)}
                  className="col-span-1 flex items-center justify-center text-text-muted
                             hover:text-brand-red transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Regressione live */}
        {regression && (
          <div className="card-lg border-brand-blue">
            <h2 className="section-title mb-3">Regressione calcolata in tempo reale</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-text-muted mb-1">1RM stimato</div>
                <div className="text-2xl font-semibold text-brand-blue">
                  {regression.estimated_1rm.toFixed(1)} <span className="text-xs text-text-muted">kg</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">R²</div>
                <div className={`text-2xl font-semibold ${regression.r_squared >= 0.95 ? 'text-brand-green' : 'text-brand-yellow'}`}>
                  {regression.r_squared.toFixed(3)}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">Punti usati</div>
                <div className="text-2xl font-semibold text-text-secondary">{validPoints.length}</div>
              </div>
            </div>
            {regression.r_squared < 0.90 && (
              <p className="text-xs text-brand-yellow mt-3 bg-[#3a2e10] rounded-card px-3 py-2">
                R² basso — controlla i valori inseriti o aggiungi altri punti per una regressione più accurata.
              </p>
            )}
          </div>
        )}

        <div className="card-lg">
          <h2 className="section-title mb-3">Note</h2>
          <textarea className="input resize-none" rows={2} placeholder="Condizioni, osservazioni…"
            value={form.notes} onChange={e => setF('notes', e.target.value)} />
        </div>

        {error && (
          <div className="text-xs text-brand-red bg-[#3a1e1e] border border-[#5a2e2e] rounded-card px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary flex-1 justify-center">
            Annulla
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'Salvataggio...' : 'Salva sessione VBT'}
          </button>
        </div>
      </form>
    </div>
  )
}
