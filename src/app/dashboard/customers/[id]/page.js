'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

export default function CustomerDetailPage() {
  const { id } = useParams() // Ambil ID dari URL
  const router = useRouter()
  const supabase = createClient()

  const [customer, setCustomer] = useState(null)
  const [transactions, setTransactions] = useState([])
  
  useEffect(() => {
    if(id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchData = async () => {
    const { data: cust } = await supabase.from('customers').select('*').eq('id', id).single()
    setCustomer(cust)
    const { data: trans } = await supabase
        .from('transactions')
        .select(`*, transaction_details (*, waste_types (name, uoms(name)))`)
        .eq('customer_id', id)
        .order('trans_date', { ascending: false })
    
    setTransactions(trans || [])
  }

  if (!customer) return <div className='w-full h-screen flex items-center justify-center italic text-gray-400'>Loading data...</div>
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
                    <h2 className="card-title lg:text-3xl md:text-3xl sm:text-2xl text-xl">{customer.name}</h2>
                    <span className="text-base">{customer.phone || "-"}</span>
                    <a href={getWaLink(customer.phone)} target="_blank" rel="noopener noreferrer" 
                        className="text-xs text-green-600 hover:text-green-800 font-bold flex items-center gap-1 mb-3">
                        Chat WA ↗
                    </a>
                    <p className="text-gray-500 lg:text-base md:text-base text-sm">{customer.address}</p>
                    <div className="badge badge-primary text-white mt-2">Nasabah</div>
                </div>
                <hr className='lg:hidden md:hidden border border-gray-200 mt-2'/>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Saldo Aktif</div>
                    <div className="lg:text-4xl md:text-4xl sm:text-3xl text-2xl font-bold text-success">Rp {customer.current_balance.toLocaleString()}</div>
                </div>
            </div>
        </div>

        <h3 className="text-xl font-bold mb-4">Riwayat Transaksi</h3>
        <div className="overflow-x-auto bg-white shadow rounded-box overflow-hidden">
            <table className="table table-zebra">
                <thead>
                    <tr>
                        <th>Tanggal</th>
                        <th>Tipe</th>
                        <th>Detail Item (Sampah)</th>
                        <th className="text-right">Nominal</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(t => (
                        <tr key={t.id}>
                            <td className="align-top truncate whitespace-nowrap">
                                {new Date(t.trans_date).toLocaleDateString()} <br/>
                                <span className="text-xs text-gray-500">{new Date(t.trans_date).toLocaleTimeString()}</span>
                            </td>
                            <td className="align-top truncate">
                                {t.trans_type === 'DEPOSIT' ? (
                                    <span className="badge badge-success badge-outline">Setor Sampah</span>
                                ) : (
                                    <span className="badge badge-error badge-outline">Tarik Tunai</span>
                                )}
                            </td>
                            <td className="align-top truncate">
                                {t.trans_type === 'WITHDRAW_CASH' ? (
                                    <span className="italic text-gray-500">Penarikan Saldo Tunai</span>
                                ) : (
                                    <ul className="list-disc list-inside text-sm">
                                        {t.transaction_details?.map(d => (
                                            <li key={d.id}>
                                                {d.waste_types?.name} ({d.qty} {d.waste_types.uoms.name}) @{d.snapshot_price.toLocaleString()} - Rp {d.subtotal.toLocaleString()}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </td>
                            <td className={`align-top text-right truncate font-bold ${t.trans_type === 'DEPOSIT' ? 'text-success' : 'text-error'}`}>
                                {t.trans_type === 'DEPOSIT' ? '+' : '-'} Rp {t.total_amount.toLocaleString()}
                            </td>
                        </tr>
                    ))}
                    {transactions.length === 0 && <tr><td colSpan="4" className="text-center p-4 italic text-gray-400">Belum ada riwayat transaksi</td></tr>}
                </tbody>
            </table>
        </div>
    </div>
  )
}