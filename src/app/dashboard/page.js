'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function Dashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState({ 
    totalNasabah: 0, 
    totalStockItems: 0, 
    totalCollectors: 0, 
    totalCustomerBalance: 0, 
    totalAsset: 0 
  });
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    // Get Customers
    const { count: nasabahCount, data: customers } = await supabase.from('customers').select('*', { count: 'exact' });
    // Get Stocks
    const { data: wasteData } = await supabase.from('waste_types').select('*, uoms(name)');
    // Get Collectors
    const { count: collectorCount } = await supabase.from('collectors').select('*', { count: 'exact' });
    const { data: totalAsset } = await supabase.rpc('get_total_asset');
    const { data: totalSaldo } = await supabase.rpc('get_total_balance');

    // Masukkan ke state
    setStats({ 
        totalNasabah: nasabahCount, 
        totalStockItems: wasteData?.length, 
        totalCollectors: collectorCount, 
        totalCustomerBalance: totalSaldo || 0, 
        totalAsset: totalAsset || 0 
    });
    setStocks(wasteData || [])
  }

  return (
    <div>
        <h1 className="text-2xl font-bold mb-5">Statistik dan Monitor</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="stat bg-white shadow rounded-box text-center">
                <div className="stat-title">Total Nasabah</div>
                <div className="stat-value text-primary">{stats.totalNasabah}</div>
            </div>
            <div className="stat bg-white shadow rounded-box text-center">
                <div className="stat-title">Jenis Sampah</div>
                <div className="stat-value text-secondary">{stats.totalStockItems}</div>
            </div>
            <div className="stat bg-white shadow rounded-box text-center">
                <div className="stat-title">Total Pengepul</div>
                <div className="stat-value text-accent">{stats.totalCollectors}</div>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="stat bg-white shadow rounded-box text-center">
                <div className="stat-title">Total Saldo Nasabah</div>
                <div className="font-extrabold text-xl text-orange-500">Rp {stats.totalCustomerBalance.toLocaleString()}</div>
            </div>
            <div className="stat bg-white shadow rounded-box text-center">
                <div className="stat-title">Total Asset</div>
                <div className="font-extrabold text-xl text-orange-500">Rp {stats.totalAsset.toLocaleString()}</div>
            </div>
        </div>

        <div className="card bg-white shadow">
            <div className="card-body">
                <h2 className="card-title">Live Stock Inventory</h2>
                <div className="overflow-x-auto">
                    <table className="table table-zebra">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th className='text-center'>Stock Tersedia</th>
                                <th className='text-right'>Harga Beli (Nasabah)</th>
                                <th className='text-right'>Harga Jual (Pengepul)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stocks.map((item) => (
                                <tr key={item.id}>
                                    <td className="font-bold">{item.name}</td>
                                    <td className='text-center'>
                                        <span className={`badge ${item.current_stock > 0 ? 'badge-success' : 'badge-error'} text-white`}>
                                            {item.current_stock} {item.uoms?.name}
                                        </span>
                                    </td>
                                    <td className='text-right'>Rp {item.purchase_price.toLocaleString()}</td>
                                    <td className='text-right'>Rp {item.sales_price.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  )
}