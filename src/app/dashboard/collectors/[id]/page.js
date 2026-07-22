'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CollectorDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [collector, setCollector] = useState(null)
  const [transactions, setTransactions] = useState([])
  
  useEffect(() => { 
    if(id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchData = async () => {
    const { data: col } = await supabase.from('collectors').select('*').eq('id', id).single()
    setCollector(col)

    const { data: trans } = await supabase
        .from('transactions')
        .select(`*, transaction_details (*, waste_types (name)), batch_transactions(name)`)
        .eq('collector_id', id)
        .eq('trans_type', 'SELL_WASTE') // Filter khusus penjualan
        .order('trans_date', { ascending: false })
    
    setTransactions(trans || [])
  }

  if (!collector) return <div>Loading...</div>

  const totalOmzet = transactions.reduce((sum, t) => sum + t.total_amount, 0)

  // Helper untuk Link WhatsApp
  const getWaLink = (phone) => {
    if(!phone) return '#'
    let cleanNum = phone.replace(/\D/g, '') // Hapus karakter selain angka
    if (cleanNum.startsWith('0')) {
        cleanNum = '62' + cleanNum.slice(1) // Ubah 08xx jadi 628xx
    }
    return `https://wa.me/${cleanNum}`
  }

  return (
    <div>
        <button onClick={() => router.back()} className="btn btn-ghost lg:mb-4 md:mb-3 mb-2">← Kembali</button>
        
        <div className="card bg-white shadow-lg mb-8">
            <div className="card-body lg:flex-row md:flex-row flex-col justify-between lg:items-center md:items-center">
                <div>
                    <h2 className="card-title text-3xl">{collector.name}</h2>
                    <span className="text-base">{collector.contact || "-"}</span>
                    <a href={getWaLink(collector.contact)} target="_blank" rel="noopener noreferrer" 
                        className="text-xs text-green-600 hover:text-green-800 font-bold flex items-center gap-1 mb-3">
                        Chat WA ↗
                    </a>
                    <div className="badge badge-warning text-white mt-2">Mitra Pengepul</div>
                </div>
                <hr className='lg:hidden md:hidden border border-gray-200 mt-2'/>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Total Penjualan</div>
                    <div className="lg:text-4xl md:text-4xl sm:text-3xl text-2xl font-bold text-success">Rp {totalOmzet.toLocaleString('id-ID')}</div>
                </div>
            </div>
        </div>

        <h3 className="text-xl font-bold mb-4">Riwayat Penjualan</h3>
        <div className="bg-white shadow rounded-box overflow-x-auto">
            <table className="table table-zebra">
                <thead>
                    <tr>
                        <th>Tanggal</th>
                        <th className='text-center'>Tipe</th>
                        <th>Batch</th>
                        <th>Detail Item Terjual</th>
                        <th className="text-right">Total Nilai</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(t => (
                        <tr key={t.id}>
                            <td className="whitespace-nowrap">
                                {new Date(t.trans_date).toLocaleDateString('id-ID')}
                                {new Date(t.trans_date).toLocaleDateString('id-ID')} <br/>
                                <span className="text-xs text-gray-500">{new Date(t.trans_date).toLocaleTimeString('id-ID')}</span>
                            </td>
                            <td className='text-center truncate'>
                               <span className="badge badge-info badge-outline">Jual Sampah</span>
                            </td>
                            <td className='truncate'>{t.batch_transactions?.name || "-"}</td>
                            <td className='truncate'>
                                <ul className="list-disc list-inside text-sm">
                                    {t.transaction_details?.map(d => (
                                        <li key={d.id}>
                                            {d.waste_types?.name} ({Number(d.qty).toLocaleString('id-ID')} kg) - Rp {d.subtotal.toLocaleString('id-ID')}
                                        </li>
                                    ))}
                                </ul>
                            </td>
                            <td className="text-right font-bold text-primary truncate">
                                Rp {t.total_amount.toLocaleString('id-ID')}
                            </td>
                        </tr>
                    ))}
                    {transactions.length === 0 && <tr><td colSpan="3" className="text-center p-4 italic text-gray-400">Belum ada transaksi penjualan.</td></tr>}
                </tbody>
            </table>
        </div>
    </div>
  )
}