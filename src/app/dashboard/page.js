'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import TopChartPage from '@/components/BarChartWasteTop5';

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

            <div className="grid grid-cols-3 sm:grid-cols-3 lg:gap-4 md:gap-4 sm:gap-3 gap-2 mb-4">
                <div className="p-3 bg-white shadow rounded-box text-center">
                    <div className="lg:text-lg md:text-lg sm:text-base text-xs font-semibold">Total Nasabah</div>
                    <div className="lg:text-5xl md:text-2xl sm:text-2xl text-xl font-bold text-primary">{Number(stats.totalNasabah).toLocaleString('id-ID')}</div>
                </div>
                <div className="p-3 bg-white shadow rounded-box text-center">
                    <div className="lg:text-lg md:text-lg sm:text-base text-xs font-semibold">Jenis Sampah</div>
                    <div className="lg:text-5xl md:text-2xl sm:text-2xl text-xl font-bold text-secondary">{Number(stats.totalStockItems).toLocaleString('id-ID')}</div>
                </div>
                <div className="p-3 bg-white shadow rounded-box text-center">
                    <div className="lg:text-lg md:text-lg sm:text-base text-xs font-semibold">Total Pengepul</div>
                    <div className="lg:text-5xl md:text-2xl sm:text-2xl text-xl font-bold text-primary">{Number(stats.totalCollectors).toLocaleString('id-ID')}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="stat bg-white shadow rounded-box text-center">
                    <div className="stat-title">Total Saldo Nasabah</div>
                    <div className="font-extrabold text-xl text-orange-500">Rp {stats.totalCustomerBalance.toLocaleString('id-ID')}</div>
                </div>
                <div className="stat bg-white shadow rounded-box text-center">
                    <div className="stat-title">Total Sampah di Gudang</div>
                    <div className="font-extrabold text-xl text-orange-500">Rp {stats.totalAsset.toLocaleString('id-ID')}</div>
                </div>
            </div>

            <TopChartPage />

            <div className="collapse collapse-arrow bg-white shadow-md border border-gray-100 rounded-box">
                <input type="checkbox" name="my-inventory-accordion" />
                <div className="collapse-title text-lg font-medium flex lg:flex-row md:flex-row flex-col gap-1 justify-between lg:items-center md:items-center">
                    <span className="font-bold text-primary">Stok di Gudang</span>
                    <span className="w-max bg-orange-500 text-white px-2 py-1 text-sm font-bold rounded-xl">Jenis Sampah: {(stocks.length || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="collapse-content overflow-x-auto">
                    <div className="overflow-x-auto">
                        <table className="table table-zebra">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th className='text-center'>Stok Tersedia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stocks.map((item) => (
                                    <tr key={item.id}>
                                        <td className="font-bold">{item.name}</td>
                                        <td className='text-right'>
                                            <span className={`badge ${item.current_stock > 0 ? 'badge-success' : 'badge-error'} text-white`}>
                                                {Number(item.current_stock).toLocaleString('id-ID')} {item.uoms?.name}
                                            </span>
                                        </td>
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