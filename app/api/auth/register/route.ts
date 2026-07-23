import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const body = await request.json()
    const { email, password, nama_lengkap, role } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
    }

    // Sign up dengan metadata yang akan otomatis masuk ke profiles via trigger
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nama_lengkap: nama_lengkap || email.split('@')[0],
          role: role || 'cs'
        }
      }
    })

    if (error) {
      console.error('Supabase signup error:', error)
      return NextResponse.json({ error: error.message || 'Gagal melakukan registrasi' }, { status: 400 })
    }

    // Cek apakah email confirmation diperlukan
    if (data.user && !data.session) {
      return NextResponse.json({ 
        message: 'Registrasi berhasil! Silakan cek email untuk verifikasi.',
        requiresEmailVerification: true,
        user: data.user
      }, { status: 201 })
    }

    return NextResponse.json({ 
      message: 'Registrasi berhasil! Silakan login.',
      user: data.user,
      session: data.session
    }, { status: 201 })
  } catch (err: any) {
    console.error('Register API error:', err)
    return NextResponse.json({ 
      error: err.message || 'Terjadi kesalahan pada server' 
    }, { status: 500 })
  }
}
