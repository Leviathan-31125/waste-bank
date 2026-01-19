'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ReportPage() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState([])
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  
  // State untuk Fitur Baru
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTrans, setSelectedTrans] = useState(null) // Untuk pop-up detail

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter])

  const fetchReport = async () => {
    const startDate = new Date(dateFilter)
    const endDate = new Date(dateFilter)
    endDate.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
        .from('transactions')
        .select(`*, customers(name), collectors(name), transaction_details (
            qty,
            subtotal,
            waste_types (name)
        )`)
        .gte('trans_date', startDate.toISOString())
        .lte('trans_date', endDate.toISOString())
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
          t.id.toString().includes(searchLower)
      )
  })

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text(`Laporan Harian Bank Sampah - ${dateFilter}`, 14, 10)
    
    const tableColumn = ["ID", "Waktu", "Tipe", "Pihak Terkait", "Total (Rp)"]
    const tableRows = []

    filteredTransactions.forEach(t => {
        const party = t.customers?.name || t.collectors?.name || "-"
        const row = [
            t.id,
            new Date(t.trans_date).toLocaleTimeString(),
            t.trans_type,
            party,
            t.total_amount.toLocaleString()
        ]
        tableRows.push(row)
    })

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    })

    doc.save(`report_${dateFilter}.pdf`)
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
    link.setAttribute("download", `report_${dateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
  }

  return (
    <div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold">Daily Report</h2>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <input 
                    type="text" 
                    placeholder="Cari Transaksi..." 
                    className="input input-bordered bg-white text-black w-full md:w-48"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <input 
                    type="date" 
                    className="input input-bordered bg-white text-black"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                />
                <button className="btn border-success text-success" onClick={exportCSV}>CSV</button>
                <button className="btn btn-error text-white" onClick={exportPDF}>PDF</button>
            </div>
        </div>

        <div className="overflow-x-auto bg-white shadow rounded-box">
            <table className="table table-zebra table-hover">
                <thead>
                    <tr>
                        <th>Waktu</th>
                        <th>Tipe</th>
                        <th>Nasabah / Pengepul</th>
                        <th>Catatan</th>
                        <th>Total Amount</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTransactions.map(t => (
                        <tr key={t.id} className="cursor-pointer hover:bg-gray-100" onClick={() => setSelectedTrans(t)}>
                            <td>{new Date(t.trans_date).toLocaleTimeString()}</td>
                            <td>
                                <span className={`badge ${
                                    t.trans_type === 'DEPOSIT' ? 'badge-success text-white' : 
                                    t.trans_type === 'WITHDRAW_CASH' ? 'badge-warning' : 'badge-info text-white'
                                }`}>
                                    {t.trans_type}
                                </span>
                            </td>
                            <td>{t.customers?.name || t.collectors?.name || "-"}</td>
                            <td>{t.note || "-"}</td>
                            <td className="font-mono font-bold text-right">Rp {t.total_amount.toLocaleString()}</td>
                            <td className="text-center text-xs text-gray-400">(Klik utk Detail)</td>
                        </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                        <tr><td colSpan="6" className="text-center py-4 italic text-gray-400">Data tidak ditemukan.</td></tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* MODAL DETAIL TRANSAKSI */}
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
                                        <th>Berat (Kg/Pcs)</th>
                                        <th className="text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedTrans.transaction_details?.map((detail, idx) => (
                                        <tr key={idx}>
                                            <td>{detail.waste_types?.name}</td>
                                            <td>{detail.qty}</td>
                                            <td className="text-right">Rp {detail.subtotal.toLocaleString()}</td>
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