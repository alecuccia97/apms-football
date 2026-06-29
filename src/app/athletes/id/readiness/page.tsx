'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcReadinessScore, readinessTrafficLight, readinessLabel, TRAFFIC_COLORS } from '@/lib/utils/benchmark'

function SliderField({ label, id, value, onChange, invert = false, description }: {
  label: string
  id: string
  value: number
  onChange: (v: number) => void
  invert?: boolean
  description?: string
}) {
  const displayValue = value
  const goodSide = invert ? 'sinistra' : 'destra'

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="label mb-0">{label}</label>
        <span className="text-lg font-semibold text-text-primary tabular-nums">{displayValue}</span>
      </div>
      <input
        type="range" min="1" max="10" step="1"
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full accent-brand-blue"
        id={id}
      />
      {description && (
        <p className="text-xs text-text-muted mt-1">{description}</p>
      )}
    </div>
  )
}

export default function NewReadinessPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    logged_date: today,
    sleep_quality: 7,
    energy_level: 7,
    doms: 3,
    stress: 3,
    rpe_prev: 6,
    weight_kg: '',
    notes: '',
  })

  const set = (k: string, v: number | string) => setForm(f => ({ ...f, [k]: v }))

  const score = calcReadinessScore({
    sleep_quality: form.sleep_quality,
    energy_level: form.energy_level,
    doms: form.doms,
    stress: form.stress,
    rpe_prev: form.rpe_prev,
  })
  const tl = readinessTrafficLight(score)
  const tlColor = TRAFFIC_COLORS[tl]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('readiness_logs').upsert({
      athlete_id: params.id,
      logged_date: form.logged_date,
      sleep_quality: form.sleep_quality,
      energy_level: form.energy_level,
      doms: form.doms,
      stress: form.stress,
      rpe_prev: form.rpe_prev,
      weight_kg: form.weight_kg === '' ? null : parseFloat(form.weight_kg),
      notes: form.notes || null,
    }, { onConflict: 'athlete_id,logged_date' })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/athletes/${params.id}`)
    router.refresh()
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-xs text-text-muted hover:text-text-secondary mb-3 block">
          ← Indietro
        </button>
        <h1 className="text-lg font-semibold text-text-primary">Readiness giornaliera</h1>
        <p className="text-xs text-text-muted mt-1">Monitoraggio soggettivo quotidiano — scala 1–10</p>
      </div>

      {/* Score preview */}
      <div className="card-lg mb-6 text-center" style={{ borderColor: tlColor.hex }}>
        <div className="text-xs text-text-muted mb-2">Readiness Score calcolato</div>
        <div className="text-5xl font-semibold" style={{ color: tlColor.hex }}>
          {Math.round(score)}
        </div>
        <div className="text-sm mt-2" style={{ color: tlColor.text }}>
          ● {readinessLabel(score)}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card-lg">
          <h2 className="section-title mb-4">Data</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data</label>
              <input type="date" className="input" value={form.logged_date}
                onChange={e => set('logged_date', e.target.value)} required />
            </div>
            <div>
              <label className="label">Peso mattutino (kg)</label>
              <input type="number" step="0.1" className="input" placeholder="75.5"
                value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card-lg space-y-5">
          <h2 className="section-title mb-1">Parametri soggettivi</h2>

          <SliderField
            label="Qualità del sonno" id="sleep"
            value={form.sleep_quality} onChange={v => set('sleep_quality', v)}
            description="1 = pessimo / 10 = ottimo"
          />
          <SliderField
            label="Energia percepita" id="energy"
            value={form.energy_level} onChange={v => set('energy_level', v)}
            description="1 = esausto / 10 = brillante"
          />
          <SliderField
            label="DOMS (dolori muscolari)" id="doms"
            value={form.doms} onChange={v => set('doms', v)}
            invert
            description="1 = nessun dolore / 10 = dolori intensi"
          />
          <SliderField
            label="Stress psicologico" id="stress"
            value={form.stress} onChange={v => set('stress', v)}
            invert
            description="1 = nessuno / 10 = molto stressato"
          />
          <SliderField
            label="RPE sessione precedente" id="rpe"
            value={form.rpe_prev} onChange={v => set('rpe_prev', v)}
            description="Quanto è stato duro l'allenamento di ieri? 1–10"
          />
        </div>

        <div className="card-lg">
          <h2 className="section-title mb-3">Note</h2>
          <textarea className="input resize-none" rows={2}
            placeholder="Come ti senti oggi? Note aggiuntive…"
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
            {loading ? 'Salvataggio...' : 'Salva readiness'}
          </button>
        </div>
      </form>
    </div>
  )
}
