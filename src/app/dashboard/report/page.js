'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ReportPage() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState([])
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  
  // State untuk Fitur Baru
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTrans, setSelectedTrans] = useState(null) // Untuk pop-up detail

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate])

  const fetchReport = async () => {
    const startDateFilter = new Date(startDate)
    const endDateFilter = new Date(endDate)
    endDateFilter.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
        .from('transactions')
        .select(`*, customers(name), collectors(name), transaction_details (
            qty,
            subtotal,
            waste_types (name, uoms(name))
        ), batch_transactions(name)`)
        .gte('trans_date', startDateFilter.toISOString())
        .lte('trans_date', endDateFilter.toISOString())
        .order('trans_date', { ascending: false })

    if (data) setTransactions(data)
  }

  // Filter Handler
  const filteredTransactions = transactions.filter(t => {
      const searchLower = searchTerm.toLowerCase()
      const partyName = t.customers?.name || t.collectors?.name || ""
      
      return (
          partyName.toLowerCase().includes(searchLower) ||
          t.trans_type.toLowerCase().includes(searchLower) ||
          t.id.toString().includes(searchLower) ||
          t.batch_transactions?.name?.toLowerCase().includes(searchLower)
      )
  })

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text(`Laporan Harian Bank Sampah ${startDate} sampai ${endDate}`, 14, 10)
    
    const tableColumn = ["ID", "Waktu", "Tipe", "Pihak Terkait", "Batch", "Total (Rp)"]
    const tableRows = []

    filteredTransactions.forEach(t => {
        const party = t.customers?.name || t.collectors?.name || "-"
        const batch = t.batch_transactions?.name || "-"
        const row = [
            t.id,
            new Date(t.trans_date).toLocaleTimeString(),
            t.trans_type,
            party,
            batch,
            t.total_amount.toLocaleString()
        ]
        tableRows.push(row)
    })

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    })

    doc.save(`report_${startDate} to ${endDate}.pdf`)
  }

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8," 
        + "ID,Waktu,Tipe,Pihak,Total\n"
        + filteredTransactions.map(t => {
            const party = t.customers?.name || t.collectors?.name || "-"
            return `${t.id},${t.trans_date},${t.trans_type},${party},${t.total_amount}`
        }).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${startDate} to ${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
  }

  return (
    <div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold">Daily Report</h2>
            <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center">
                {/* Search */}
                <input 
                    type="text" 
                    placeholder="Cari transaksi" 
                    className="input input-bordered input-sm bg-white text-black"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <input 
                    type="date" 
                    className="input input-bordered input-sm bg-white text-black"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
                <input 
                    type="date" 
                    className="input input-bordered input-sm bg-white text-black"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
                <button className="btn border-success btn-sm text-success" onClick={exportCSV}>CSV</button>
                <button className="btn btn-error btn-sm text-white" onClick={exportPDF}>PDF</button>
            </div>
        </div>

        <div className="overflow-x-auto bg-white shadow rounded-box">
            <table className="table table-zebra table-hover">
                <thead>
                    <tr>
                        <th>Waktu</th>
                        <th>Tipe</th>
                        <th>Nasabah / Pengepul</th>
                        <th className='text-right'>Total Amount</th>
                        <th>Batch</th>
                        <th>Catatan</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTransactions.map(t => (
                        <tr key={t.id} className="cursor-pointer hover:bg-gray-100" onClick={() => setSelectedTrans(t)}>
                            <td className='truncate'>{new Date(t.trans_date).toLocaleTimeString()}</td>
                            <td>
                                <span className={`badge ${
                                    t.trans_type === 'DEPOSIT' ? 'badge-success text-white' : 
                                    t.trans_type === 'WITHDRAW_CASH' ? 'badge-warning' : 'badge-info text-white'
                                }`}>
                                    {t.trans_type}
                                </span>
                            </td>
                            <td>{t.customers?.name || t.collectors?.name || "-"}</td>
                            <td className="font-mono font-bold text-right truncate">Rp {t.total_amount.toLocaleString()}</td>
                            <td className='truncate'>{t.batch_transactions?.name || "-"}</td>
                            <td>{t.note || "-"}</td>
                            <td className="text-center text-xs text-gray-400 truncate">(Klik Detail)</td>
                        </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                        <tr><td colSpan="6" className="text-center py-4 italic text-gray-400">Data tidak ditemukan.</td></tr>
                    )}
                </tbody>
            </table>
        </div>

        <dialog className={`modal ${selectedTrans ? 'modal-open' : ''}`}>
            <div className="modal-box bg-white text-black max-w-3xl">
                <h3 className="font-bold text-lg mb-4">Detail Transaksi #{selectedTrans?.id}</h3>
                
                {selectedTrans && (
                    <>
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                                <p className="text-gray-500">Waktu</p>
                                <p className="font-bold">{new Date(selectedTrans.trans_date).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Pihak Terkait</p>
                                <p className="font-bold">{selectedTrans.customers?.name || selectedTrans.collectors?.name || "Umum"}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Tipe</p>
                                <p className="font-bold">{selectedTrans.trans_type}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Total Transaksi</p>
                                <p className="font-bold text-lg text-primary">Rp {selectedTrans.total_amount.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="divider">Rincian Item</div>

                        {selectedTrans.trans_type === 'WITHDRAW_CASH' ? (
                            <p className="text-center italic text-gray-500 py-4">Penarikan Tunai (Tidak ada item fisik)</p>
                        ) : (
                            <table className="table table-compact w-full">
                                <thead>
                                    <tr>
                                        <th>Item Sampah</th>
                                        <th>Qty</th>
                                        <th className="text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedTrans.transaction_details?.map((detail, idx) => (
                                        <tr key={idx}>
                                            <td>{detail.waste_types?.name}</td>
                                            <td>{detail.qty} {detail.waste_types?.uoms.name}</td>
                                            <td className="text-right truncate">Rp {detail.subtotal.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {(!selectedTrans.transaction_details || selectedTrans.transaction_details.length === 0) && (
                                        <tr><td colSpan="3" className="text-center">Tidak ada detail item</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </>
                )}

                <div className="modal-action">
                    <button className="btn" onClick={() => setSelectedTrans(null)}>Tutup</button>
                </div>
            </div>
        </dialog>
    </div>
  )
}