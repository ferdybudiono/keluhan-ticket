'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Login error:', error)
        setError(error.message)
        setLoading(false)
        return
      }

      if (!data.session) {
        setError('Login gagal: Session tidak dibuat. Mungkin email belum diverifikasi.')
        setLoading(false)
        return
      }

      if (data.user) {
        // Cek apakah profile user ada
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, nama_lengkap')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.error('Profile error:', profileError)
          setError('Profile tidak ditemukan. Silakan hubungi admin.')
          setLoading(false)
          return
        }

        // Force reload untuk memastikan middleware mendeteksi user baru
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      console.error('Unexpected login error:', err)
      setError(err.message || 'Terjadi kesalahan saat login')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Login Ticketing Keluhan
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="nama@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-600">Belum punya akun? </span>
          <Link href="/register" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Daftar di sini
          </Link>
        </div>
      </div>
    </div>
  )
}
