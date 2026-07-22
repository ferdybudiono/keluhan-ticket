import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KeluhanForm from '@/components/KeluhanForm'
import KeluhanTable from '@/components/KeluhanTable'
import StatsChart from '@/components/StatsChart'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, nama_lengkap')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-6">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard Ticketing Keluhan
        </h1>
        <div className="flex items-center space-x-4">
          <span className="text-gray-600">Halo, {profile?.nama_lengkin || user.email}</span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            {profile?.role}
          </span>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      <div className="mb-8">
        <StatsChart />
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-700">
          Input Keluhan Baru
        </h2>
        <KeluhanForm userId={user.id} />
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-700">
          Daftar Keluhan
        </h2>
        <KeluhanTable userRole={profile?.role} />
      </div>
    </div>
  )
}
