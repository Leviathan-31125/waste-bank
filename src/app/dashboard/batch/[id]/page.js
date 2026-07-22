'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

export default function BatchDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [batch, setBatch] = useState(null)
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    if(id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchData = async () => {
    const { data: bat } = await supabase.from('batch_transactions').select('*').eq('id', id).single()
    setBatch(bat)

    const { data: trans } = await supabase
        .from('transactions')
        .select(`*, customers(name), collectors(name), transaction_details (
            qty,
            subtotal,
            waste_types (name, uoms(name))
        )`)
        .eq('batch_id', id)
        .order('trans_date', { ascending: false })

    setTransactions(trans || [])
  }

  if (!batch) return <div className='w-full h-screen flex items-center justify-center italic text-gray-400'>Loading data...</div>

  const totalAmount = transactions.reduce((sum, t) => sum + t.total_amount, 0)

  return (
    <div>
        <button onClick={() => router.back()} className="btn btn-ghost lg:mb-4 md:mb-3 mb-2">← Kembali</button>

        <div className="card bg-white shadow-lg mb-8">
            <div className="card-body lg:flex-row md:flex-row flex-col justify-between lg:items-center md:items-center">
                <div>
                    <h2 className="card-title lg:text-3xl md:text-3xl sm:text-2xl text-xl">{batch.name}</h2>
                    <p className="text-gray-500 lg:text-base md:text-base text-sm">Dibuat: {new Date(batch.created_at).toLocaleDateString('id-ID')}</p>
                    <div className={`badge ${batch.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'} text-white mt-2`}>{batch.status}</div>
                </div>
                <hr className='lg:hidden md:hidden border border-gray-200 mt-2'/>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Total Transaksi</div>
                    <div className="lg:text-4xl md:text-4xl sm:text-3xl text-2xl font-bold text-primary">{transactions.length.toLocaleString('id-ID')}</div>
                    <div className="text-sm text-gray-500 mt-1">Total Nominal</div>
                    <div className="lg:text-2xl md:text-2xl sm:text-xl text-lg font-bold text-success">Rp {totalAmount.toLocaleString('id-ID')}</div>
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
                        <th>Pihak Terkait</th>
                        <th>Detail Item</th>
                        <th className="text-right">Nominal</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((t, i) => (
                        <tr key={i}>
                            <td className="align-top truncate whitespace-nowrap">
                                {new Date(t.trans_date).toLocaleDateString('id-ID')} <br/>
                                <span className="text-xs text-gray-500">{new Date(t.trans_date).toLocaleTimeString('id-ID')}</span>
                            </td>
                            <td className="align-top truncate">
                                {t.trans_type === 'DEPOSIT' ? (
                                    <span className="badge badge-success badge-outline">Setor Sampah</span>
                                ) : (
                                    <span className="badge badge-error badge-outline">Tarik Tunai</span>
                                )}
                            </td>
                            <td className="align-top truncate">
                                {t.customers?.name || t.collectors?.name || "-"}
                            </td>
                            <td className="align-top truncate">
                                {t.trans_type === 'WITHDRAW_CASH' ? (
                                    <span className="italic text-gray-500">Penarikan Saldo Tunai</span>
                                ) : (
                                    <ul className="list-disc list-inside text-sm">
                                        {t.transaction_details?.map((d, i) => (
                                            <li key={i}>
                                                {d.waste_types?.name} ({Number(d.qty).toLocaleString('id-ID')} {d.waste_types.uoms.name}) - Rp {d.subtotal.toLocaleString('id-ID')}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </td>
                            <td className={`align-top text-right truncate font-bold ${t.trans_type === 'SELL_WASTE' || t.trans_type === 'DEPOSIT' ? 'text-success' : 'text-error'}`}>
                                {t.trans_type === 'SELL_WASTE' || t.trans_type === 'DEPOSIT' ? '+' : '-'} Rp {t.total_amount.toLocaleString('id-ID')}
                            </td>
                        </tr>
                    ))}
                    {transactions.length === 0 && <tr><td colSpan="5" className="text-center p-4 italic text-gray-400">Belum ada riwayat transaksi</td></tr>}
                </tbody>
            </table>
        </div>
    </div>
  )
}
