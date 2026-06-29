'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { DominantFoot, AthleteRole, Category } from '@/types'
import { ROLE_LABELS, CATEGORY_LABELS } from '@/types'

export default function NewAthletePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    height_cm: '',
    weight_kg: '',
    dominant_foot: 'destro' as DominantFoot,
    role: '' as AthleteRole | '',
    category: '' as Category | '',
    notes: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Non autenticato'); setLoading(false); return }

    // Prendi il team dell'utente
    const { data: team } = await supabase
      .from('teams').select('id').eq('owner_id', user.id).single()
    if (!team) { setError('Team non trovato'); setLoading(false); return }

    const { data: athlete, error: insertErr } = await supabase
      .from('athletes')
      .insert({
        team_id: team.id,
        user_id: user.id,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        date_of_birth: form.date_of_birth,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        dominant_foot: form.dominant_foot,
        role: form.role || null,
        category: form.category || null,
        notes: form.notes || null,
      })
      .select('id')
      .single()

    if (insertErr || !athlete) {
      setError(insertErr?.message ?? 'Errore inserimento')
      setLoading(false)
      return
    }

    router.push(`/athletes/${athlete.id}`)
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-xs text-text-muted hover:text-text-secondary mb-3 block">
          ← Indietro
        </button>
        <h1 className="text-lg font-semibold text-text-primary">Nuovo atleta</h1>
        <p className="text-xs text-text-muted mt-1">Crea il profilo dell'atleta — potrai aggiungere i test subito dopo</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card-lg">
          <h2 className="section-title mb-4">Dati anagrafici</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome *</label>
              <input type="text" className="input" placeholder="Marco"
                value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Cognome *</label>
              <input type="text" className="input" placeholder="Rossi"
                value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Data di nascita *</label>
              <input type="date" className="input"
                value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} required />
            </div>
            <div>
              <label className="label">Piede dominante</label>
              <select className="input" value={form.dominant_foot}
                onChange={e => set('dominant_foot', e.target.value)}>
                <option value="destro">Destro</option>
                <option value="sinistro">Sinistro</option>
                <option value="ambidestro">Ambidestro</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card-lg">
          <h2 className="section-title mb-4">Antropometria</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Altezza (cm)</label>
              <input type="number" step="0.5" className="input" placeholder="182"
                value={form.height_cm} onChange={e => set('height_cm', e.target.value)} />
            </div>
            <div>
              <label className="label">Peso (kg)</label>
              <input type="number" step="0.1" className="input" placeholder="76.5"
                value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} />
            </div>
          </div>
          {form.height_cm && form.weight_kg && (
            <div className="mt-3 text-xs text-text-muted">
              BMI calcolato: <span className="text-text-secondary font-medium">
                {(parseFloat(form.weight_kg) / (parseFloat(form.height_cm) / 100) ** 2).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <div className="card-lg">
          <h2 className="section-title mb-4">Ruolo e categoria</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ruolo</label>
              <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="">— Seleziona —</option>
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Categoria</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">— Seleziona —</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card-lg">
          <h2 className="section-title mb-3">Note</h2>
          <textarea className="input resize-none" rows={3}
            placeholder="Note tecniche, storia clinica, obiettivi…"
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
            {loading ? 'Creazione...' : 'Crea atleta'}
          </button>
        </div>
      </form>
    </div>
  )
}
