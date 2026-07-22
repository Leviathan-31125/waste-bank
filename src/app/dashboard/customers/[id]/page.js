'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function CustomerDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = createClient();

    const [customer, setCustomer] = useState(null);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        if (id) fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchData = async () => {
        const { data: customerData } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        setCustomer(customerData);

        const { data: transactionData } = await supabase
            .from('transactions')
            .select('*, transaction_details (*, waste_types (name, uoms(name)))')
            .eq('customer_id', id)
            .order('trans_date', { ascending: false });

        setTransactions(transactionData || []);
    };

    const getWaLink = (phone) => {
        if (!phone) return '#';

        let cleanNum = phone.replace(/\D/g, '');

        if (cleanNum.startsWith('0')) {
            cleanNum = `62${cleanNum.slice(1)}`;
        }

        return `https://wa.me/${cleanNum}`;
    };

    if (!customer) {
        return (
            <div className="flex h-screen w-full items-center justify-center italic text-gray-400">
                Loading data...
            </div>
        );
    }

    return (
        <div>
            <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-ghost mb-2 md:mb-3 lg:mb-4"
            >
                ← Kembali
            </button>

            <div className="card relative mb-8 bg-white shadow-lg">
                <div className="absolute right-5 top-5 z-10">
                    <div className="badge badge-primary text-white">Nasabah</div>
                </div>

                <div className="card-body flex-col justify-between pt-16 md:flex-row md:items-center md:pt-8 lg:flex-row lg:items-center lg:pt-8">
                    <div className="md:pr-8 lg:pr-8">
                        <h2 className="card-title pr-20 text-xl sm:text-2xl md:pr-0 md:text-3xl lg:pr-0 lg:text-3xl">
                            {customer.name}
                        </h2>

                        <span className="text-base">{customer.phone || '-'}</span>

                        {customer.phone && (
                            <a
                                href={getWaLink(customer.phone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mb-3 flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-800"
                            >
                                Chat WA ↗
                            </a>
                        )}

                        <p className="text-sm text-gray-500 md:text-base lg:text-base">
                            {customer.address}
                        </p>
                    </div>

                    <hr className="mt-4 border border-gray-200 md:hidden lg:hidden" />

                    <div className="mt-4 text-left md:mt-7 md:text-right lg:mt-7 lg:text-right">
                        <div className="text-sm text-gray-500">Saldo</div>
                        <div className="text-2xl font-bold text-success sm:text-3xl md:text-4xl lg:text-4xl">
                            Rp {Number(customer.current_balance || 0).toLocaleString('id-ID')}
                        </div>
                    </div>
                </div>
            </div>

            <h3 className="mb-4 text-xl font-bold">Riwayat Transaksi</h3>

            <div className="overflow-x-auto overflow-hidden rounded-box bg-white shadow">
                <table className="table table-zebra">
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th className="text-center">Tipe</th>
                            <th>Batch</th>
                            <th>Detail Item (Sampah)</th>
                            <th className="text-right">Nominal</th>
                        </tr>
                    </thead>

                    <tbody>
                        {transactions.map((transaction) => (
                            <tr key={transaction.id}>
                                <td className="truncate whitespace-nowrap">
                                    {new Date(transaction.trans_date).toLocaleDateString('id-ID')}
                                    <br />
                                    <span className="text-xs text-gray-500">
                                        {new Date(transaction.trans_date).toLocaleTimeString('id-ID')}
                                    </span>
                                </td>

                                <td className="truncate text-center">
                                    {transaction.trans_type === 'DEPOSIT' ? (
                                        <span className="badge badge-success badge-outline">
                                            Setor Sampah
                                        </span>
                                    ) : (
                                        <span className="badge badge-warning text-white">Tarik Tunai</span>
                                    )}
                                </td>

                                <td className="truncate">
                                    {transaction.batch_transactions?.name || '-'}
                                </td>

                                <td className="truncate">
                                    {transaction.trans_type === 'WITHDRAW_CASH' ? (
                                        <span className="italic text-gray-500">
                                            Penarikan Saldo Tunai
                                        </span>
                                    ) : (
                                        <ul className="list-inside list-disc text-sm">
                                            {transaction.transaction_details?.map((detail) => (
                                                <li key={detail.id}>
                                                    {detail.waste_types?.name} (
                                                    {Number(detail.qty).toLocaleString('id-ID')}{' '}
                                                    {detail.waste_types.uoms.name}) @
                                                    {Number(detail.snapshot_price).toLocaleString('id-ID')} - Rp{' '}
                                                    {Number(detail.subtotal).toLocaleString('id-ID')}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </td>

                                <td
                                    className={`truncate text-right font-bold ${transaction.trans_type === 'DEPOSIT'
                                            ? 'text-success'
                                            : 'text-error'
                                        }`}
                                >
                                    {transaction.trans_type === 'DEPOSIT' ? '+' : '-'} Rp{' '}
                                    {Number(transaction.total_amount).toLocaleString('id-ID')}
                                </td>
                            </tr>
                        ))}

                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-4 text-center italic text-gray-400">
                                    Belum ada riwayat transaksi
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
