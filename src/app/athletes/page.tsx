import { createServerSideClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'

const ROLE_SHORT: Record<string, string> = {
  portiere: 'POR', difensore_centrale: 'DC', terzino: 'TER',
  centrocampista_difensivo: 'CDC', centrocampista: 'CEN',
  centrocampista_offensivo: 'COF', ala: 'ALA', attaccante: 'ATT', trequartista: 'TRQ',
}

const CAT_LABELS: Record<string, string> = {
  serie_a: 'Serie A', serie_b: 'Serie B', serie_c: 'Serie C',
  u19: 'U19', u17: 'U17', u15: 'U15', u14: 'U14', altro: 'Altro',
}

const AVATAR_COLORS = [
  { bg: '#1e3a5f', text: '#3b82f6' }, { bg: '#1e3a1e', text: '#22c55e' },
  { bg: '#2a1e3a', text: '#a855f7' }, { bg: '#3a2e10', text: '#f59e0b' },
  { bg: '#3a1e1e', text: '#ef4444' }, { bg: '#1e2e3a', text: '#06b6d4' },
]

function avatarColor(id: string) {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length]
}

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

export default async function AthletesPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createServerSideClient()
  const query = searchParams.q ?? ''
  let dbQuery = supabase.from('athletes').select('*').eq('is_active', true).order('last_name')
  if (query) dbQuery = dbQuery.ilike('last_name', `%${query}%`)
  const { data: athletes } = await dbQuery
  const list = athletes ?? []
  return (
    <div className="flex h-screen">
      <div className="w-64 border-r border-bg-border flex flex-col bg-bg-secondary">
        <div className="p-3 border-b border-bg-border">
          <form method="GET">
            <div className="flex items-center gap-2 bg-bg-card border border-bg-border rounded-card px-3 py-2">
              <Search size={13} className="text-text-muted flex-shrink-0" />
              <input name="q" defaultValue={query} placeholder="Cerca atleta..."
                className="bg-transparent text-sm text-text-primary placeholder-text-muted outline-none w-full" />
            </div>
          </form>
        </div>
        <div className="p-2 flex-shrink-0">
          <Link href="/athletes/new" className="btn-primary w-full justify-center text-xs py-2">
            <Plus size={14} /> Nuovo atleta
          </Link>
        </div>
        <div className="overflow-y-auto flex-1">
          <div className="px-3 py-2 text-xs text-text-muted uppercase tracking-wider">Atleti ({list.length})</div>
          {list.map((a: any) => {
            const col = avatarColor(a.id)
            return (
              <Link key={a.id} href={`/athletes/${a.id}`}
                className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-bg-hover border-l-2 border-transparent hover:border-brand-blue transition-colors">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                  style={{ background: col.bg, color: col.text }}>
                  {initials(a.first_name, a.last_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-text-primary truncate">{a.last_name} {a.first_name}</div>
                  <div className="text-[10px] text-text-muted">{ROLE_SHORT[a.role ?? ''] ?? '—'} · {CAT_LABELS[a.category ?? ''] ?? '—'}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center text-text-muted">
        <div className="text-center">
          <div className="text-4xl mb-3">⚡</div>
          <div className="text-sm font-medium text-text-secondary mb-1">Seleziona un atleta</div>
          <div className="text-xs text-text-muted">oppure crea un nuovo profilo</div>
        </div>
      </div>
    </div>
  )
}
