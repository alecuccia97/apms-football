'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { BenchmarkLevel } from '@/types'
import { BENCHMARK_LEVEL_LABELS } from '@/types'

export default function NewCMJPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    tested_at: new Date().toISOString().slice(0, 16),
    jump_height_cm: '',
    peak_power_w: '',
    peak_power_w_per_kg: '',
    rsi_modified: '',
    peak_velocity_prop_ms: '',
    peak_velocity_brake_ms: '',
    contact_time_ms: '',
    flight_time_ms: '',
    body_weight_kg: '',
    n_jumps: '3',
    benchmark_level: 'u19' as BenchmarkLevel,
    notes: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const num = (v: string) => v === '' ? null : parseFloat(v)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('tests_cmj').insert({
      athlete_id: params.id,
      tested_at: form.tested_at,
      jump_height_cm: num(form.jump_height_cm),
      peak_power_w: num(form.peak_power_w),
      peak_power_w_per_kg: num(form.peak_power_w_per_kg),
      rsi_modified: num(form.rsi_modified),
      peak_velocity_prop_ms: num(form.peak_velocity_prop_ms),
      peak_velocity_brake_ms: num(form.peak_velocity_brake_ms),
      contact_time_ms: num(form.contact_time_ms),
      flight_time_ms: num(form.flight_time_ms),
      body_weight_kg: num(form.body_weight_kg),
      n_jumps: parseInt(form.n_jumps),
      benchmark_level: form.benchmark_level,
      notes: form.notes || null,
      source: 'manual',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/athletes/${params.id}`)
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-xs text-text-muted hover:text-text-secondary mb-3 block">
          ← Indietro
        </button>
        <h1 className="text-lg font-semibold text-text-primary">Nuovo test CMJ</h1>
        <p className="text-xs text-text-muted mt-1">Counter Movement Jump — inserisci le metriche dal dispositivo</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data */}
        <div className="card-lg">
          <h2 className="section-title mb-4">Dati sessione</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data e ora test *</label>
              <input type="datetime-local" className="input" value={form.tested_at}
                onChange={e => set('tested_at', e.target.value)} required />
            </div>
            <div>
              <label className="label">Benchmark di confronto</label>
              <select className="input" value={form.benchmark_level}
                onChange={e => set('benchmark_level', e.target.value as BenchmarkLevel)}>
                {Object.entries(BENCHMARK_LEVEL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Peso corporeo al test (kg)</label>
              <input type="number" step="0.1" className="input" placeholder="75.5"
                value={form.body_weight_kg} onChange={e => set('body_weight_kg', e.target.value)} />
            </div>
            <div>
              <label className="label">N° salti registrati</label>
              <input type="number" min="1" max="10" className="input" value={form.n_jumps}
                onChange={e => set('n_jumps', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Metriche principali */}
        <div className="card-lg">
          <h2 className="section-title mb-4">Metriche principali</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Jump Height (cm)</label>
              <input type="number" step="0.01" className="input" placeholder="38.4"
                value={form.jump_height_cm} onChange={e => set('jump_height_cm', e.target.value)} />
            </div>
            <div>
              <label className="label">RSI Modified</label>
              <input type="number" step="0.001" className="input" placeholder="0.710"
                value={form.rsi_modified} onChange={e => set('rsi_modified', e.target.value)} />
            </div>
            <div>
              <label className="label">Peak Power (W)</label>
              <input type="number" step="1" className="input" placeholder="4218"
                value={form.peak_power_w} onChange={e => set('peak_power_w', e.target.value)} />
            </div>
            <div>
              <label className="label">Peak Power/kg (W/kg)</label>
              <input type="number" step="0.01" className="input" placeholder="55.50"
                value={form.peak_power_w_per_kg} onChange={e => set('peak_power_w_per_kg', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Velocità */}
        <div className="card-lg">
          <h2 className="section-title mb-4">Velocità di picco</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Peak Velocity propulsiva (m/s)</label>
              <input type="number" step="0.001" className="input" placeholder="2.870"
                value={form.peak_velocity_prop_ms} onChange={e => set('peak_velocity_prop_ms', e.target.value)} />
            </div>
            <div>
              <label className="label">Peak Velocity braking (m/s)</label>
              <input type="number" step="0.001" className="input" placeholder="-1.430"
                value={form.peak_velocity_brake_ms} onChange={e => set('peak_velocity_brake_ms', e.target.value)} />
              <p className="text-xs text-text-muted mt-1">Inserisci valore negativo es. -1.43</p>
            </div>
            <div>
              <label className="label">Flight time (ms)</label>
              <input type="number" step="1" className="input" placeholder="560"
                value={form.flight_time_ms} onChange={e => set('flight_time_ms', e.target.value)} />
            </div>
            <div>
              <label className="label">Contact time (ms)</label>
              <input type="number" step="1" className="input" placeholder="790"
                value={form.contact_time_ms} onChange={e => set('contact_time_ms', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="card-lg">
          <h2 className="section-title mb-3">Note</h2>
          <textarea className="input resize-none" rows={3} placeholder="Condizioni test, osservazioni…"
            value={form.notes} onChange={e => set('notes', e.target.value)} />
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
            {loading ? 'Salvataggio...' : 'Salva test CMJ'}
          </button>
        </div>
      </form>
    </div>
  )
}
