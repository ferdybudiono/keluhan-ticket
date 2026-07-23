export interface Keluhan {
  id: string
  order_id: string
  nama_pelanggan: string
  kategori: string
  deskripsi: string
  foto_url: string | null
  status: 'Baru' | 'Diproses' | 'Selesai'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  root_cause: string | null
  assigned_to: string | null
  created_by: string
  created_at: string
  updated_at: string | null
}

export interface User {
  id: string
  email: string
  nama_lengkap: string
  role: 'admin' | 'packing' | 'cs'
}

export interface AktivitasLog {
  id: string
  keluhan_id: string
  user_id: string
  aksi: string
  detail: string
  created_at: string
}
