import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient() // <--- Tambahkan await di sini
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Cek role user
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'packing') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { status, root_cause } = body

  const { data, error } = await supabase
    .from('keluhan')
    .update({
      status,
      root_cause,
      updated_at: new Date().toISOString()
    })
    .eq('id', params.id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log aktivitas
  await supabase.from('aktivitas_log').insert({
    keluhan_id: params.id,
    user_id: user.id,
    aksi: 'update',
    detail: `Mengupdate status ke ${status} dan root cause`
  })

  return NextResponse.json(data[0])
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient() // <--- Tambahkan await di sini
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Cek role admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('keluhan')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log aktivitas
  await supabase.from('aktivitas_log').insert({
    keluhan_id: params.id,
    user_id: user.id,
    aksi: 'delete',
    detail: 'Menghapus keluhan'
  })

  return NextResponse.json({ success: true })
}
