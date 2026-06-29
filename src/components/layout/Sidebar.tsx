'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, Activity, FileText,
  Settings, LogOut, Zap
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/athletes',   icon: Users,           label: 'Atleti' },
  { href: '/readiness',  icon: Activity,        label: 'Readiness' },
  { href: '/reports',    icon: FileText,        label: 'Report' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-14 bg-bg-secondary border-r border-bg-border
                      flex flex-col items-center py-3 gap-1 z-50">
      {/* Logo */}
      <div className="w-9 h-9 bg-brand-blue rounded-lg flex items-center justify-center mb-4 flex-shrink-0">
        <Zap size={16} className="text-white" />
      </div>

      {/* Nav */}
      {navItems.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors
              ${active
                ? 'bg-bg-hover text-brand-blue'
                : 'text-text-muted hover:bg-bg-hover hover:text-text-secondary'
              }`}
          >
            <item.icon size={18} />
          </Link>
        )
      })}

      {/* Bottom */}
      <div className="mt-auto flex flex-col gap-1">
        <Link
          href="/settings"
          title="Impostazioni"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted
                     hover:bg-bg-hover hover:text-text-secondary transition-colors"
        >
          <Settings size={18} />
        </Link>
        <button
          onClick={handleLogout}
          title="Esci"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted
                     hover:bg-[#3a1e1e] hover:text-brand-red transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  )
}
