import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const body = await request.json()
  const { email, password, nama_lengkap, role } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
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
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ 
    message: 'Registrasi berhasil! Silakan login.',
    user: data.user,
    session: data.session
  })
}
