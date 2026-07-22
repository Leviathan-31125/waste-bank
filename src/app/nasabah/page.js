'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatNumberID, formatRupiah } from '@/utils/numberFormat'

const TRANSACTION_LABELS = {
  DEPOSIT: 'Setor Sampah',
  WITHDRAW_CASH: 'Tarik Tunai',
}

const HISTORY_PAGE_SIZE = 5

const getTransactionChange = (transaction) => {
  const amount = Number(transaction.total_amount || 0)

  if (transaction.trans_type === 'DEPOSIT') return amount
  if (transaction.trans_type === 'WITHDRAW_CASH') return -amount
  return 0
}

const formatDate = (value) =>
  new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

const formatTime = (value) =>
  new Date(value).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

const getTypeStyle = (type) =>
  type === 'DEPOSIT'
    ? 'badge-success badge-outline'
    : 'badge-warning text-white'

export default function CustomerPortalPage() {
  const supabase = useMemo(() => createClient(), [])
  const [customer, setCustomer] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [visibleTransactionCount, setVisibleTransactionCount] = useState(
    HISTORY_PAGE_SIZE,
  )
  const [visibleBalanceCount, setVisibleBalanceCount] = useState(
    HISTORY_PAGE_SIZE,
  )

  useEffect(() => {
    const fetchPortalData = async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          throw new Error('Sesi login tidak ditemukan.')
        }

        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('customer_id, role')
          .eq('user_id', user.id)
          .single()

        if (profileError || profile?.role !== 'customer' || !profile.customer_id) {
          throw new Error('Akun ini belum terhubung dengan data nasabah.')
        }

        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id, name, current_balance, status')
          .eq('id', profile.customer_id)
          .single()

        if (customerError || !customerData) {
          throw new Error('Data nasabah tidak dapat dibuka.')
        }

        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .select(`
            id,
            trans_type,
            total_amount,
            trans_date,
            note,
            batch_transactions(name),
            transaction_details(
              id,
              waste_type_id,
              qty,
              snapshot_price,
              subtotal,
              waste_types(name, uoms(name))
            )
          `)
          .eq('customer_id', profile.customer_id)
          .order('trans_date', { ascending: false })
          .order('id', { ascending: false })

        if (transactionError) throw transactionError

        setCustomer(customerData)
        setTransactions(transactionData || [])
        setVisibleTransactionCount(HISTORY_PAGE_SIZE)
        setVisibleBalanceCount(HISTORY_PAGE_SIZE)
      } catch (error) {
        console.error(error)
        setErrorMessage(error.message || 'Gagal membuka portal nasabah.')
      } finally {
        setLoading(false)
      }
    }

    fetchPortalData()
  }, [supabase])

  const balanceHistory = useMemo(() => {
    let runningBalance = Number(customer?.current_balance || 0)

    return transactions.map((transaction) => {
      const change = getTransactionChange(transaction)
      const balanceAfter = runningBalance
      const balanceBefore = balanceAfter - change

      runningBalance = balanceBefore

      return {
        ...transaction,
        change,
        balanceBefore,
        balanceAfter,
      }
    })
  }, [customer, transactions])

  const visibleTransactions = useMemo(
    () => transactions.slice(0, visibleTransactionCount),
    [transactions, visibleTransactionCount],
  )

  const visibleBalanceHistory = useMemo(
    () => balanceHistory.slice(0, visibleBalanceCount),
    [balanceHistory, visibleBalanceCount],
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    )
  }

  if (errorMessage || !customer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200 px-4">
        <div className="card w-full max-w-md bg-white shadow-lg">
          <div className="card-body text-center">
            <h1 className="text-xl font-bold text-error">Portal tidak dapat dibuka</h1>
            <p className="text-gray-600">{errorMessage}</p>
            <a href="/api/auth/signout" className="btn btn-primary mt-3 text-white">
              Kembali ke Login
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-200">
      <header className="sticky top-0 z-20 border-b border-base-300 bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/icon-bms2.png"
              alt="Bank Sampah BMS2"
              className="h-10 w-10 shrink-0 rounded-lg object-contain"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-primary sm:text-base">
                Bank Sampah BMS2
              </p>
              <p className="truncate text-xs text-gray-500">Portal Nasabah</p>
            </div>
          </div>

          <a
            href="/api/auth/signout"
            className="btn btn-outline btn-error btn-sm shrink-0"
          >
            Keluar
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-5 sm:px-6 sm:py-7">
        <section className="card overflow-hidden bg-primary text-white shadow-lg">
          <div className="card-body gap-5 p-5 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-white/80">Nasabah</p>
                <h1 className="truncate text-2xl font-bold sm:text-3xl">
                  {customer.name}
                </h1>
              </div>
              <span className="badge border-white/40 bg-white/15 text-white">
                {customer.status === 'active' ? 'Aktif' : 'Non-Aktif'}
              </span>
            </div>

            <div>
              <p className="text-sm text-white/80">Saldo</p>
              <p className="break-words text-3xl font-extrabold sm:text-4xl">
                {formatRupiah(customer.current_balance)}
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Riwayat Transaksi</h2>
              <p className="text-sm text-gray-500">
                Rincian setoran dan penarikan saldo
              </p>
            </div>
            <span className="badge badge-neutral badge-outline">
              {transactions.length} transaksi
            </span>
          </div>

          <div className="space-y-3">
            {visibleTransactions.map((transaction) => {
              const change = getTransactionChange(transaction)
              const isDeposit = transaction.trans_type === 'DEPOSIT'

              return (
                <article
                  key={transaction.id}
                  className="card bg-white shadow-sm ring-1 ring-base-300"
                >
                  <div className="card-body gap-3 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`badge ${getTypeStyle(transaction.trans_type)}`}
                        >
                          {TRANSACTION_LABELS[transaction.trans_type] ||
                            transaction.trans_type}
                        </span>
                        <p className="mt-2 text-sm font-semibold text-gray-700">
                          {formatDate(transaction.trans_date)} ·{' '}
                          {formatTime(transaction.trans_date)}
                        </p>
                      </div>

                      <p
                        className={`text-right text-lg font-bold sm:text-xl ${isDeposit ? 'text-success' : 'text-error'
                          }`}
                      >
                        {change >= 0 ? '+' : '-'}
                        {formatNumberID(Math.abs(change), {
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 rounded-lg bg-base-200 p-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Batch</p>
                        <p className="font-semibold">
                          {transaction.batch_transactions?.name || '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Total (Rp)</p>
                        <p className="font-semibold">
                          {formatNumberID(transaction.total_amount, {
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                    </div>

                    {isDeposit && transaction.transaction_details?.length > 0 && (
                      <details className="overflow-hidden rounded-lg border border-base-300 bg-white">
                        <summary className="cursor-pointer bg-base-100 px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-base-200">
                          Lihat rincian sampah
                        </summary>

                        <div className="border-t border-base-300 p-2 sm:p-3">
                          <div className="overflow-hidden rounded-lg border border-base-300">
                            <table className="table table-xs w-full table-fixed">
                              <colgroup>
                                <col className="w-[46%]" />
                                <col className="w-[24%]" />
                                <col className="w-[30%]" />
                              </colgroup>
                              <thead className="bg-base-200 text-[11px] uppercase tracking-wide text-gray-500">
                                <tr>
                                  <th className="px-2 py-2">Sampah</th>
                                  <th className="px-1 py-2 text-right">Jumlah</th>
                                  <th className="px-2 py-2 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...transaction.transaction_details]
                                  .sort(
                                    (a, b) =>
                                      Number(a.waste_type_id || 0) -
                                      Number(b.waste_type_id || 0),
                                  )
                                  .map((detail) => (
                                    <tr key={detail.id} className="align-top">
                                      <td className="px-2 py-2">
                                        <p className="break-words text-xs font-semibold leading-snug sm:text-sm">
                                          {detail.waste_types?.name || 'Sampah'}
                                        </p>
                                        <p className="mt-0.5 break-words text-[10px] leading-snug text-gray-500 sm:text-xs">
                                          Harga{' '}
                                          {formatNumberID(detail.snapshot_price, {
                                            maximumFractionDigits: 0,
                                          })}
                                          /{detail.waste_types?.uoms?.name || 'satuan'}
                                        </p>
                                      </td>
                                      <td className="px-1 py-2 text-right text-xs font-medium sm:text-sm">
                                        <span className="block">
                                          {formatNumberID(detail.qty)}
                                        </span>
                                        <span className="block text-[10px] font-normal text-gray-500 sm:text-xs">
                                          {detail.waste_types?.uoms?.name || ''}
                                        </span>
                                      </td>
                                      <td className="break-words px-2 py-2 text-right text-xs font-bold sm:text-sm">
                                        {formatNumberID(detail.subtotal, {
                                          maximumFractionDigits: 0,
                                        })}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>

                            </table>
                          </div>
                        </div>
                      </details>
                    )}

                    {!isDeposit && transaction.note && (
                      <p className="text-sm italic text-gray-500">
                        {transaction.note}
                      </p>
                    )}
                  </div>
                </article>
              )
            })}

            {transactions.length === 0 && (
              <div className="rounded-xl bg-white p-8 text-center text-gray-400 shadow-sm">
                Belum ada riwayat transaksi.
              </div>
            )}
          </div>

          {transactions.length > HISTORY_PAGE_SIZE && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-xs text-gray-500">
                Menampilkan {Math.min(visibleTransactionCount, transactions.length)} dari{' '}
                {transactions.length} transaksi
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {visibleTransactionCount < transactions.length && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm text-white"
                    onClick={() =>
                      setVisibleTransactionCount((current) =>
                        Math.min(current + HISTORY_PAGE_SIZE, transactions.length),
                      )
                    }
                  >
                    Lihat lebih banyak
                  </button>
                )}
                {visibleTransactionCount > HISTORY_PAGE_SIZE && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setVisibleTransactionCount(HISTORY_PAGE_SIZE)}
                  >
                    Tampilkan lebih sedikit
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="pb-6">
          <div className="mb-3">
            <h2 className="text-xl font-bold">Riwayat Saldo</h2>
            <p className="text-sm text-gray-500">
              Perubahan saldo berdasarkan transaksi yang tercatat
            </p>
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-base-300">
            <div className="grid grid-cols-[1.2fr_0.8fr_1fr] gap-2 bg-base-200 px-3 py-3 text-xs font-bold uppercase tracking-wide text-gray-500 sm:px-5">
              <span>Tanggal</span>
              <span className="text-right">Perubahan</span>
              <span className="text-right">Saldo</span>
            </div>

            <div className="divide-y divide-base-300">
              {visibleBalanceHistory.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1.2fr_0.8fr_1fr] items-center gap-2 px-3 py-3 text-sm sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{formatDate(item.trans_date)}</p>
                    <p className="truncate text-xs text-gray-500">
                      {TRANSACTION_LABELS[item.trans_type] || item.trans_type}
                    </p>
                  </div>

                  <p
                    className={`text-right font-bold ${item.change >= 0 ? 'text-success' : 'text-error'
                      }`}
                  >
                    {item.change >= 0 ? '+' : '-'}
                    {formatNumberID(Math.abs(item.change), {
                      maximumFractionDigits: 0,
                    })}
                  </p>

                  <p className="text-right font-bold">
                    {formatNumberID(item.balanceAfter, {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              ))}

              {balanceHistory.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  Belum ada riwayat saldo.
                </div>
              )}
            </div>
          </div>

          {balanceHistory.length > HISTORY_PAGE_SIZE && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-xs text-gray-500">
                Menampilkan {Math.min(visibleBalanceCount, balanceHistory.length)} dari{' '}
                {balanceHistory.length} riwayat saldo
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {visibleBalanceCount < balanceHistory.length && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm text-white"
                    onClick={() =>
                      setVisibleBalanceCount((current) =>
                        Math.min(current + HISTORY_PAGE_SIZE, balanceHistory.length),
                      )
                    }
                  >
                    Lihat lebih banyak
                  </button>
                )}
                {visibleBalanceCount > HISTORY_PAGE_SIZE && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setVisibleBalanceCount(HISTORY_PAGE_SIZE)}
                  >
                    Tampilkan lebih sedikit
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
