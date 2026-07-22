'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Keluhan {
  id: string
  order_id: string
  nama_pelanggan: string
  kategori: string
  deskripsi: string
  foto_url: string | null
  status: string
  root_cause: string | null
  created_at: string
}

interface KeluhanTableProps {
  userRole?: string
}

export default function KeluhanTable({ userRole }: KeluhanTableProps) {
  const [keluhan, setKeluhan] = useState<Keluhan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ status: '', root_cause: '' })
  const supabase = createClient()

  useEffect(() => {
    fetchKeluhan()
    
    // Realtime subscription
    const channel = supabase
      .channel('keluhan-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'keluhan' },
        (payload) => {
          console.log('Change received!', payload)
          fetchKeluhan()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchKeluhan = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('keluhan')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setKeluhan(data)
    }
    setLoading(false)
  }

  const handleEdit = (item: Keluhan) => {
    setEditingId(item.id)
    setEditData({ status: item.status, root_cause: item.root_cause || '' })
  }

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('keluhan')
      .update({
        status: editData.status,
        root_cause: editData.root_cause,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (!error) {
      setEditingId(null)
      fetchKeluhan()
    }
  }

  const statusOptions = ['Baru', 'Diproses', 'Selesai']

  if (loading) {
    return <div className="text-center py-4">Loading...</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nama Pelanggan
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kategori
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Root Cause
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tanggal
            </th>
            {(userRole === 'admin' || userRole === 'packing') && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {keluhan.map((item) => (
            <tr key={item.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {item.order_id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.nama_pelanggan}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.kategori}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingId === item.id ? (
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.status === 'Baru' ? 'bg-yellow-100 text-yellow-800' :
                    item.status === 'Diproses' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {item.status}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editData.root_cause}
                    onChange={(e) => setEditData({ ...editData, root_cause: e.target.value })}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                    placeholder="Masukkan root cause"
                  />
                ) : (
                  item.root_cause || '-'
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(item.created_at).toLocaleDateString('id-ID')}
              </td>
              {(userRole === 'admin' || userRole === 'packing') && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingId === item.id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdate(item.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
