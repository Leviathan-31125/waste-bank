'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatNumberID } from '@/utils/numberFormat'

const formatTransactionTime = (value) =>
    new Date(value).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })

const getPartyName = (transaction) =>
    transaction.customers?.name || transaction.collectors?.name || '-'

const getShortName = (name) => {
    const words = String(name || '-')
        .trim()
        .split(/\s+/)
        .filter(Boolean)

    if (words.length === 0) return '-'
    return words.slice(0, 2).join(' ')
}

const getTransactionType = (type) => {
    if (type === 'DEPOSIT') {
        return {
            shortLabel: 'Setor',
            fullLabel: 'Setor Sampah',
            badgeClass: 'badge-success badge-outline',
        }
    }

    if (type === 'WITHDRAW_CASH') {
        return {
            shortLabel: 'Tarik',
            fullLabel: 'Tarik Tunai',
            badgeClass: 'badge-warning text-white',
        }
    }

    return {
        shortLabel: 'Jual',
        fullLabel: 'Jual Sampah',
        badgeClass: 'badge-info badge-outline',
    }
}

export default function ReportPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [transactions, setTransactions] = useState([])
    const [startDate, setStartDate] = useState(
        new Date().toISOString().split('T')[0],
    )
    const [endDate, setEndDate] = useState(
        new Date().toISOString().split('T')[0],
    )
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedTrans, setSelectedTrans] = useState(null)

    useEffect(() => {
        fetchReport()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate])

    const fetchReport = async () => {
        const startDateFilter = new Date(startDate)
        const endDateFilter = new Date(endDate)
        endDateFilter.setHours(23, 59, 59, 999)

        const { data, error } = await supabase
            .from('transactions')
            .select(`*, customers(name), collectors(name), transaction_details (
        id,
        qty,
        subtotal,
        waste_types (name, uoms(name))
      ), batch_transactions(name)`)
            .gte('trans_date', startDateFilter.toISOString())
            .lte('trans_date', endDateFilter.toISOString())
            .order('trans_date', { ascending: false })

        if (error) {
            console.error('Gagal mengambil riwayat transaksi:', error)
            setTransactions([])
            return
        }

        setTransactions(data || [])
    }

    const filteredTransactions = transactions.filter((transaction) => {
        const searchLower = searchTerm.toLowerCase()
        const partyName = getPartyName(transaction)

        return (
            partyName.toLowerCase().includes(searchLower) ||
            transaction.trans_type.toLowerCase().includes(searchLower) ||
            transaction.id.toString().includes(searchLower) ||
            transaction.batch_transactions?.name
                ?.toLowerCase()
                .includes(searchLower)
        )
    })

    const exportPDF = () => {
        const doc = new jsPDF()
        doc.text(
            `Riwayat Transaksi ${startDate} sampai ${endDate}`,
            14,
            10,
        )

        const tableColumn = ['Waktu', 'Tipe', 'Nama', 'Total (Rp)', 'Batch']
        const tableRows = filteredTransactions.map((transaction) => {
            const transactionType = getTransactionType(transaction.trans_type)

            return [
                formatTransactionTime(transaction.trans_date),
                transactionType.fullLabel,
                getShortName(getPartyName(transaction)),
                formatNumberID(transaction.total_amount, {
                    maximumFractionDigits: 0,
                }),
                transaction.batch_transactions?.name || '-',
            ]
        })

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        })

        doc.save(`riwayat_transaksi_${startDate}_sampai_${endDate}.pdf`)
    }

    const exportCSV = () => {
        const csvContent =
            'data:text/csv;charset=utf-8,\uFEFF' +
            'Waktu;Tipe;Nama;Total (Rp);Batch\n' +
            filteredTransactions
                .map((transaction) => {
                    const transactionType = getTransactionType(transaction.trans_type)
                    const name = getShortName(getPartyName(transaction))
                    const total = formatNumberID(transaction.total_amount, {
                        maximumFractionDigits: 0,
                    })
                    const batch = transaction.batch_transactions?.name || '-'

                    return `${formatTransactionTime(transaction.trans_date)};${transactionType.fullLabel};${name};${total};${batch}`
                })
                .join('\n')

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute(
            'download',
            `riwayat_transaksi_${startDate}_sampai_${endDate}.csv`,
        )
        document.body.appendChild(link)
        link.click()
        link.remove()
    }

    const handleRollback = async (data) => {
        const partyName = getPartyName(data)

        if (
            !confirm(
                `Yakin hapus data transaksi: ${data.trans_type} - ${partyName}?`,
            )
        ) {
            return
        }

        setLoading(true)

        try {
            const transactionDetailIds = (data.transaction_details || []).map(
                (detail) => detail.id,
            )

            if (transactionDetailIds.length > 0) {
                const { error: detailError } = await supabase
                    .from('transaction_details')
                    .delete()
                    .in('id', transactionDetailIds)

                if (detailError) throw detailError
            }

            const { error: transactionError } = await supabase
                .from('transactions')
                .delete()
                .eq('id', data.id)

            if (transactionError) throw transactionError

            if (data.trans_type === 'DEPOSIT') {
                const { error } = await supabase.rpc('update_balance', {
                    user_id: data.customer_id,
                    amount: data.total_amount * -1,
                })

                if (error) throw error
            }

            if (data.trans_type === 'WITHDRAW_CASH') {
                const { error } = await supabase.rpc('update_balance', {
                    user_id: data.customer_id,
                    amount: data.total_amount,
                })

                if (error) throw error
            }

            await fetchReport()
            setSelectedTrans(null)
            alert('Delete Transaksi Berhasil!')
        } catch (error) {
            console.error(error)
            alert('Gagal delete transaksi')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
                <h2 className="text-2xl font-bold">Riwayat Transaksi</h2>

                <div className="flex w-full flex-wrap justify-center gap-2 md:w-auto">
                    <input
                        type="text"
                        placeholder="Cari transaksi"
                        className="input input-bordered input-sm bg-white text-black"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />

                    <input
                        type="date"
                        className="input input-bordered input-sm bg-white text-black"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                    />

                    <input
                        type="date"
                        className="input input-bordered input-sm bg-white text-black"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                    />

                    <button
                        className="btn btn-sm border-success text-success"
                        onClick={exportCSV}
                    >
                        CSV
                    </button>

                    <button
                        className="btn btn-error btn-sm text-white"
                        onClick={exportPDF}
                    >
                        PDF
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-box bg-white shadow">
                <table className="table table-fixed table-zebra table-hover w-full text-[10px] sm:text-sm">
                    <colgroup>
                        <col className="w-[14%]" />
                        <col className="w-[20%]" />
                        <col className="w-[24%]" />
                        <col className="w-[24%]" />
                        <col className="w-[18%]" />
                    </colgroup>

                    <thead>
                        <tr>
                            <th className="!px-1 !py-2 sm:!px-3">Jam</th>
                            <th className="!px-1 !py-2 sm:!px-3">Nama</th>
                            <th className="!px-1 !py-2 text-center sm:!px-3">
                                Total (Rp)
                            </th>
                            <th className="!px-1 !py-2 text-center sm:!px-3">Tipe</th>
                            <th className="!px-1 !py-2 sm:!px-3">Batch</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredTransactions.map((transaction) => {
                            const fullName = getPartyName(transaction)
                            const shortName = getShortName(fullName)
                            const transactionType = getTransactionType(
                                transaction.trans_type,
                            )
                            const batchName = transaction.batch_transactions?.name || '-'

                            return (
                                <tr
                                    key={transaction.id}
                                    className="cursor-pointer hover:bg-gray-100"
                                    onClick={() => setSelectedTrans(transaction)}
                                >
                                    <td className="!px-1 !py-2 font-medium sm:!px-3">
                                        {formatTransactionTime(transaction.trans_date)}
                                    </td>

                                    <td
                                        className="!px-1 !py-2 truncate sm:!px-3"
                                        title={fullName}
                                    >
                                        {shortName}
                                    </td>

                                    <td className="!px-1 !py-2 truncate text-right font-mono font-bold sm:!px-3">
                                        {formatNumberID(transaction.total_amount, {
                                            maximumFractionDigits: 0,
                                        })}
                                    </td>

                                    <td className="!px-1 !py-2 text-center sm:!px-3">
                                        <span
                                            className={`badge badge-xs max-w-full truncate px-1 text-[9px] sm:badge-sm sm:px-2 sm:text-xs ${transactionType.badgeClass}`}
                                            title={transactionType.fullLabel}
                                        >
                                            <span className="sm:hidden">
                                                {transactionType.shortLabel}
                                            </span>
                                            <span className="hidden sm:inline">
                                                {transactionType.fullLabel}
                                            </span>
                                        </span>
                                    </td>

                                    <td
                                        className="!px-1 !py-2 truncate sm:!px-3"
                                        title={batchName}
                                    >
                                        {batchName}
                                    </td>
                                </tr>
                            )
                        })}

                        {filteredTransactions.length === 0 && (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="py-4 text-center italic text-gray-400"
                                >
                                    Data tidak ditemukan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <dialog className={`modal ${selectedTrans ? 'modal-open' : ''}`}>
                <div className="modal-box max-w-3xl bg-white text-black">
                    <h3 className="mb-4 text-lg font-bold">
                        Detail Transaksi #{selectedTrans?.id}
                    </h3>

                    {selectedTrans && (
                        <>
                            <div className="mb-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                                <div>
                                    <p className="text-gray-500">Waktu</p>
                                    <p className="font-bold">
                                        {new Date(selectedTrans.trans_date).toLocaleString(
                                            'id-ID',
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500">Pihak Terkait</p>
                                    <p className="font-bold">{getPartyName(selectedTrans)}</p>
                                </div>

                                <div>
                                    <p className="text-gray-500">Tipe</p>
                                    <p className="font-bold">
                                        {getTransactionType(selectedTrans.trans_type).fullLabel}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500">Total Transaksi</p>
                                    <p className="text-lg font-bold text-primary">
                                        Rp{' '}
                                        {formatNumberID(selectedTrans.total_amount, {
                                            maximumFractionDigits: 0,
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="divider">Rincian Item</div>

                            {selectedTrans.trans_type === 'WITHDRAW_CASH' ? (
                                <p className="py-4 text-center italic text-gray-500">
                                    Penarikan Tunai (Tidak ada item fisik)
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="table table-compact w-full">
                                        <thead>
                                            <tr>
                                                <th>Item Sampah</th>
                                                <th>Jml</th>
                                                <th className="text-right">Subtotal</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {selectedTrans.transaction_details?.map(
                                                (detail, index) => (
                                                    <tr key={detail.id || index}>
                                                        <td>{detail.waste_types?.name}</td>
                                                        <td>
                                                            {formatNumberID(detail.qty)}{' '}
                                                            {detail.waste_types?.uoms.name}
                                                        </td>
                                                        <td className="truncate text-right">
                                                            Rp{' '}
                                                            {formatNumberID(detail.subtotal, {
                                                                maximumFractionDigits: 0,
                                                            })}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}

                                            {(!selectedTrans.transaction_details ||
                                                selectedTrans.transaction_details.length === 0) && (
                                                    <tr>
                                                        <td colSpan="3" className="text-center">
                                                            Tidak ada detail item
                                                        </td>
                                                    </tr>
                                                )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    <div className="modal-action">
                        <button
                            className="btn btn-error text-white"
                            disabled={loading}
                            onClick={() => handleRollback(selectedTrans)}
                        >
                            Hapus
                        </button>

                        <button
                            className="btn"
                            disabled={loading}
                            onClick={() => setSelectedTrans(null)}
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </dialog>
        </div>
    )
}
