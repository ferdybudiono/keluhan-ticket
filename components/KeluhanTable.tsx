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
  priority: string
  root_cause: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string | null
}

interface User {
  id: string
  email: string
  nama_lengkap: string
}

interface KeluhanTableProps {
  userRole?: string
}

export default function KeluhanTable({ userRole }: KeluhanTableProps) {
  const [keluhan, setKeluhan] = useState<Keluhan[]>([])
  const [filteredKeluhan, setFilteredKeluhan] = useState<Keluhan[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ status: '', root_cause: '', assigned_to: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    fetchKeluhan()
    if (userRole === 'admin' || userRole === 'packing') {
      fetchUsers()
    }
    
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

  useEffect(() => {
    filterKeluhan()
  }, [keluhan, searchTerm, statusFilter, priorityFilter])

  const fetchKeluhan = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('keluhan')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setKeluhan(data)
    }
    if (error) {
      console.error('Error fetching keluhan:', error)
    }
    setLoading(false)
  }

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, nama_lengkap')
      .in('role', ['admin', 'packing'])

    if (data) {
      setUsers(data)
    }
    if (error) {
      console.error('Error fetching users:', error)
    }
  }

  const filterKeluhan = () => {
    let filtered = [...keluhan]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.nama_pelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter)
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((item) => item.priority === priorityFilter)
    }

    setFilteredKeluhan(filtered)
  }

  const handleEdit = (item: Keluhan) => {
    setEditingId(item.id)
    setEditData({ 
      status: item.status, 
      root_cause: item.root_cause || '',
      assigned_to: item.assigned_to || ''
    })
  }

  const handleUpdate = async (id: string) => {
    const updateData: any = {
      status: editData.status,
      root_cause: editData.root_cause,
      updated_at: new Date().toISOString()
    }

    if (editData.assigned_to) {
      updateData.assigned_to = editData.assigned_to
    }

    const { error } = await supabase
      .from('keluhan')
      .update(updateData)
      .eq('id', id)

    if (!error) {
      setEditingId(null)
      fetchKeluhan()
    } else {
      console.error('Error updating keluhan:', error)
      alert('Gagal mengupdate keluhan: ' + error.message)
    }
  }

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    }
    const labels = {
      low: 'Rendah',
      medium: 'Sedang',
      high: 'Tinggi',
      urgent: 'Mendesak'
    }
    return { class: badges[priority as keyof typeof badges] || badges.medium, label: labels[priority as keyof typeof labels] || priority }
  }

  const getAssignedUserName = (userId: string | null) => {
    if (!userId) return '-'
    const user = users.find(u => u.id === userId)
    return user ? user.nama_lengkap || user.email : '-'
  }

  const statusOptions = ['Baru', 'Diproses', 'Selesai']

  if (loading) {
    return <div className="text-center py-8">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="mt-2 text-gray-600">Memuat data...</p>
    </div>
  }

  return (
    <div className="space-y-4">
      {/* Filter dan Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Cari order ID, nama, atau deskripsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="Baru">Baru</option>
            <option value="Diproses">Diproses</option>
            <option value="Selesai">Selesai</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Prioritas</option>
            <option value="low">Rendah</option>
            <option value="medium">Sedang</option>
            <option value="high">Tinggi</option>
            <option value="urgent">Mendesak</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            Total: <span className="ml-1 font-semibold">{filteredKeluhan.length}</span> tiket
          </div>
        </div>
      </div>

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
              Prioritas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            {(userRole === 'admin' || userRole === 'packing') && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ditugaskan Ke
              </th>
            )}
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
          {filteredKeluhan.length === 0 ? (
            <tr>
              <td colSpan={userRole === 'admin' || userRole === 'packing' ? 9 : 7} className="px-6 py-8 text-center text-gray-500">
                Tidak ada data keluhan ditemukan
              </td>
            </tr>
          ) : (
            filteredKeluhan.map((item) => (
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
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadge(item.priority).class}`}>
                  {getPriorityBadge(item.priority).label}
                </span>
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
              <td className="px-6 py-4 text-sm text-gray-500">
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editData.root_cause}
                    onChange={(e) => setEditData({ ...editData, root_cause: e.target.value })}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm w-full"
                    placeholder="Masukkan root cause"
                  />
                ) : (
                  <div className="max-w-xs truncate" title={item.root_cause || '-'}>
                    {item.root_cause || '-'}
                  </div>
                )}
              </td>
              {(userRole === 'admin' || userRole === 'packing') && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingId === item.id ? (
                    <select
                      value={editData.assigned_to}
                      onChange={(e) => setEditData({ ...editData, assigned_to: e.target.value })}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                    >
                      <option value="">Belum ditugaskan</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.nama_lengkap || user.email}
                        </option>
                      ))}
                    </select>
                  ) : (
                    getAssignedUserName(item.assigned_to)
                  )}
                </td>
              )}
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
          ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  )
}
