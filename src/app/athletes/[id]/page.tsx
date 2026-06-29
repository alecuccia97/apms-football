import { createServerSideClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const ROLE_LABELS: Record<string, string> = {
  portiere:'Portiere', difensore_centrale:'Difensore centrale', terzino:'Terzino',
  centrocampista_difensivo:'CDC', centrocampista:'Centrocampista',
  centrocampista_offensivo:'COF', ala:'Ala', attaccante:'Attaccante', trequartista:'Trequartista',
}
const CAT_LABELS: Record<string, string> = {
  serie_a:'Serie A', serie_b:'Serie B', serie_c:'Serie C',
  u19:'U19', u17:'U17', u15:'U15', u14:'U14', altro:'Altro',
}

function calcAge(dob: string) {
  const d = new Date(dob), t = new Date()
  let age = t.getFullYear() - d.getFullYear()
  if (t.getMonth() - d.getMonth() < 0 || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) age--
  return age
}

export default async function AthleteDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSideClient()
  const { data: athlete } = await supabase.from('athletes').select('*').eq('id', params.id).single()
  if (!athlete) notFound()

  const age = calcAge(athlete.date_of_birth)
  const initials = `${athlete.first_name[0] ?? ''}${athlete.last_name[0] ?? ''}`.toUpperCase()

  return (
    <div style={{ padding: '2rem', color: '#e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, borderBottom: '1px solid #252a3a', paddingBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1e3a5f', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
          {initials}
        </div>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{athlete.first_name} {athlete.last_name}</h1>
          <p style={{ fontSize: 12, color: '#4a5568', margin: '4px 0 0' }}>
            {ROLE_LABELS[athlete.role ?? ''] ?? '—'} · {CAT_LABELS[athlete.category ?? ''] ?? '—'} · {age} anni · {athlete.height_cm ?? '—'} cm · {athlete.weight_kg ?? '—'} kg
          </p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <Link href={`/athletes/${athlete.id}/cmj/new`} style={{ background: '#1a1d28', border: '1px solid #252a3a', borderRadius: 8, padding: 16, display: 'block', color: '#3b82f6', textDecoration: 'none' }}>
          <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 8 }}>TEST CMJ</div>+ Inserisci test
        </Link>
        <Link href={`/athletes/${athlete.id}/imtp/new`} style={{ background: '#1a1d28', border: '1px solid #252a3a', borderRadius: 8, padding: 16, display: 'block', color: '#3b82f6', textDecoration: 'none' }}>
          <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 8 }}>TEST IMTP</div>+ Inserisci test
        </Link>
        <Link href={`/athletes/${athlete.id}/sprint/new`} style={{ background: '#1a1d28', border: '1px solid #252a3a', borderRadius: 8, padding: 16, display: 'block', color: '#3b82f6', textDecoration: 'none' }}>
          <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 8 }}>SPRINT</div>+ Inserisci test
        </Link>
        <Link href={`/athletes/${athlete.id}/vbt/new`} style={{ background: '#1a1d28', border: '1px solid #252a3a', borderRadius: 8, padding: 16, display: 'block', color: '#3b82f6', textDecoration: 'none' }}>
          <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 8 }}>VBT</div>+ Inserisci sessione
        </Link>
        <Link href={`/athletes/${athlete.id}/readiness/new`} style={{ background: '#1a1d28', border: '1px solid #252a3a', borderRadius: 8, padding: 16, display: 'block', color: '#3b82f6', textDecoration: 'none' }}>
          <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 8 }}>READINESS</div>+ Log oggi
        </Link>
      </div>
    </div>
  )
}
