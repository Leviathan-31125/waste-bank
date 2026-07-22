'use client';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

export default function TopChartPage() {
  const supabase = createClient();

  // Data Handler
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [rawData, setRawData] = useState([]);

  const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029];
  const months = [
    { value: 'ALL', label: 'Semua' },
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ]

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth])

  const fetchData = async () => {
    // Contoh: year_month ilike '2026-%'
    if (selectedMonth === "ALL") {
      const { data, error } = await supabase
        .from('waste_monthly_leaderboard')
        .select('*')
        .ilike('year_month', `${selectedYear}-%`);

      if (error) console.log('Error:', error.message);
      else setRawData(data || []);
    } else {
      const { data, error } = await supabase
        .from('waste_monthly_leaderboard')
        .select('*')
        .eq('year_month', `${selectedYear}-${selectedMonth}`);

      if (error) console.log('Error:', error.message);
      else setRawData(data || []);
    }
  }

  const chartData = useMemo(() => {
    const totals = {}
    const uoms = {}

    rawData.forEach(row => {
      const name = row.item_name;
      const qty = Number(row.sum_monthly_qty) || 0;
      const uom = row.uom;

      if (!totals[name]) {
        totals[name] = 0
        uoms[name] = uom
      }
      totals[name] += qty
    })

    return Object.keys(totals)
      .map(key => ({
        name: key,
        total: totals[key],
        uom: uoms[key]
      }))
      .sort((a, b) => b.total - a.total) // Urutkan Terbesar
      .slice(0, 5) // Ambil 5 Besar
  }, [rawData])

  // Warna-warni Chart
  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  return (
    <div className='mb-4'>
      <div className="flex lg:flex-row md:flex-row gap-2 flex-col justify-between items-center mb-3">
        <div className='lg:text-start md:text-start text-center'>
          <h2 className="text-2xl font-bold">Top 5 Sampah Terbanyak</h2>
        </div>
        <div className='flex gap-2 justify-between'>
          <select
            className="select select-bordered bg-white text-black"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            className="select select-bordered w-32 bg-white text-black"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card bg-white shadow-xl h-96 p-4 [&_svg]:outline-none mb-3">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" style={{ outline: "none" }} >
            <BarChart
              layout="horizontal"
              data={chartData}
              margin={{ top: 5, right: 2, left: 2, bottom: 5 }}
              style={{ outline: "none" }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} />
              <XAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <YAxis
                type='number'
                width={25}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                formatter={(value, _, entry) => `${value.toLocaleString('id-ID')} ${entry.payload.uom}`}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={40} style={{ outline: "none" }}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} style={{ outline: "none" }} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center italic text-gray-400">
            Belum ada data transaksi di tahun {selectedYear}
          </div>
        )}
      </div>

      {chartData.length > 0 && (
        <div className="gap-4">
          <div className="flex justify-between  alert shadow-lg bg-blue-50 border-blue-200 px-5">
            <div>
              <h3 className="font-bold">Juara 1 Periode Ini 🏆</h3>
            </div>
            <div className="flex-none">
              <span className="text-2xl font-bold text-primary">
                {chartData[0]?.name}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}