'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface KeluhanFormProps {
  userId: string
}

const kategoriOptions = [
  'Rusak',
  'Kurang',
  'Salah',
  'Telat',
  'Lainnya'
]

const priorityOptions = [
  { value: 'low', label: 'Rendah' },
  { value: 'medium', label: 'Sedang' },
  { value: 'high', label: 'Tinggi' },
  { value: 'urgent', label: 'Mendesak' }
]

export default function KeluhanForm({ userId }: KeluhanFormProps) {
  const [formData, setFormData] = useState({
    order_id: '',
    nama_pelanggan: '',
    kategori: '',
    deskripsi: '',
    priority: 'medium'
  })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    let foto_url = null

    // Upload foto jika ada
    if (file) {
      const fileName = `${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('keluhan-foto')
        .upload(fileName, file)

      if (uploadError) {
        setMessage({ type: 'error', text: 'Gagal upload foto: ' + uploadError.message })
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('keluhan-foto')
        .getPublicUrl(fileName)

      foto_url = urlData.publicUrl
    }

    // Insert keluhan
    const { error } = await supabase.from('keluhan').insert({
      ...formData,
      foto_url,
      created_by: userId
    })

    if (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan keluhan: ' + error.message })
    } else {
      setMessage({ type: 'success', text: 'Keluhan berhasil disimpan!' })
      setFormData({
        order_id: '',
        nama_pelanggan: '',
        kategori: '',
        deskripsi: '',
        priority: 'medium'
      })
      setFile(null)
      
      // Reset form
      const form = e.target as HTMLFormElement
      form.reset()
    }

    setLoading(false)
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Order ID
            </label>
            <input
              type="text"
              name="order_id"
              value={formData.order_id}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nama Pelanggan
            </label>
            <input
              type="text"
              name="nama_pelanggan"
              value={formData.nama_pelanggan}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Kategori Keluhan
            </label>
            <select
              name="kategori"
              value={formData.kategori}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">Pilih Kategori</option>
              {kategoriOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Prioritas
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Deskripsi
          </label>
          <textarea
            name="deskripsi"
            value={formData.deskripsi}
            onChange={handleChange}
            required
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Upload Foto (Opsional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {message && (
          <div className={`rounded-md p-3 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan Keluhan'}
        </button>
      </form>
    </div>
  )
}
