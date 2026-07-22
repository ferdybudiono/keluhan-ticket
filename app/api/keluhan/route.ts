import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('keluhan')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { order_id, nama_pelanggan, kategori, deskripsi, foto_url } = body

  const { data, error } = await supabase
    .from('keluhan')
    .insert({
      order_id,
      nama_pelanggan,
      kategori,
      deskripsi,
      foto_url,
      created_by: user.id
    })
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log aktivitas
  await supabase.from('aktivitas_log').insert({
    keluhan_id: data[0].id,
    user_id: user.id,
    aksi: 'create',
    detail: 'Membuat keluhan baru'
  })

  return NextResponse.json(data[0], { status: 201 })
}
