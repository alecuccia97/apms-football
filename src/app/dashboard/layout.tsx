import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/client'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar />
      <main className="flex-1 ml-14 overflow-auto">
        {children}
      </main>
    </div>
  )
}
