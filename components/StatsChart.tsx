'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'

interface ChartData {
  kategoriData: { kategori: string; count: number }[]
  statusData: { status: string; count: number }[]
  rootCauseData: { root_cause: string; count: number }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function StatsChart() {
  const [chartData, setChartData] = useState<ChartData>({
    kategoriData: [],
    statusData: [],
    rootCauseData: []
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
    
    // Realtime subscription
    const channel = supabase
      .channel('stats-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'keluhan' },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    
    // Kategori data
    const { data: kategoriRaw } = await supabase
      .from('keluhan')
      .select('kategori')
    
    const kategoriCount: Record<string, number> = {}
    kategoriRaw?.forEach(item => {
      kategoriCount[item.kategori] = (kategoriCount[item.kategori] || 0) + 1
    })
    const kategoriData = Object.entries(kategoriCount).map(([kategori, count]) => ({
      kategori,
      count
    }))

    // Status data
    const { data: statusRaw } = await supabase
      .from('keluhan')
      .select('status')
    
    const statusCount: Record<string, number> = {}
    statusRaw?.forEach(item => {
      statusCount[item.status] = (statusCount[item.status] || 0) + 1
    })
    const statusData = Object.entries(statusCount).map(([status, count]) => ({
      status,
      count
    }))

    // Root cause data (top 5)
    const { data: rootCauseRaw } = await supabase
      .from('keluhan')
      .select('root_cause')
      .not('root_cause', 'is', null)
    
    const rootCauseCount: Record<string, number> = {}
    rootCauseRaw?.forEach(item => {
      if (item.root_cause) {
        rootCauseCount[item.root_cause] = (rootCauseCount[item.root_cause] || 0) + 1
      }
    })
    
    const rootCauseData = Object.entries(rootCauseCount)
      .map(([root_cause, count]) => ({ root_cause, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    setChartData({ kategoriData, statusData, rootCauseData })
    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-4">Loading statistik...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow-md">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">
            Statistik Kategori Keluhan
          </h3>
          <BarChart width={400} height={250} data={chartData.kategoriData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="kategori" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-md">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">
            Statistik Status Keluhan
          </h3>
          <PieChart width={400} height={250}>
            <Pie
              data={chartData.statusData}
              cx={200}
              cy={125}
              labelLine={false}
              label={({ status, count }) => `${status}: ${count}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {chartData.statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-md">
        <h3 className="mb-4 text-lg font-semibold text-gray-700">
          Top 5 Root Cause
        </h3>
        <BarChart width={600} height={250} data={chartData.rootCauseData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="root_cause" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#82ca9d" />
        </BarChart>
      </div>
    </div>
  )
}
