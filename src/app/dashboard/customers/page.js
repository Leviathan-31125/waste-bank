'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { groupFirstUpperCase } from '@/utils/TextModify';

export default function CustomersPage() {
  const supabase = createClient();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    id: null,
    name: '',
    address: '',
    phone: '',
    status: 'active',
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCustomers = async () => {
    // Urutkan berdasarkan ID menurun agar data terbaru tampil paling atas.
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('id', { ascending: false });

    setCustomers(data || []);
  };

  // Membuat tautan WhatsApp dari nomor telepon nasabah.
  const getWaLink = (phone) => {
    if (!phone) return '#';

    let cleanNum = phone.replace(/\D/g, '');

    if (cleanNum.startsWith('0')) {
      cleanNum = `62${cleanNum.slice(1)}`;
    }

    return `https://wa.me/${cleanNum}`;
  };

  // Nilai database tetap "active" dan "non-active".
  // Yang diubah hanya tulisan yang ditampilkan kepada pengguna.
  const getStatusLabel = (status) => {
    return status === 'active' ? 'Aktif' : 'Non-Aktif';
  };

  const filteredCustomers = customers.filter((customer) => {
    const term = searchTerm.toLowerCase();

    return (
      customer.name.toLowerCase().includes(term) ||
      (customer.address && customer.address.toLowerCase().includes(term)) ||
      (customer.phone && customer.phone.includes(term))
    );
  });

  const handleEdit = (customer) => {
    setIsEditing(true);
    setFormData({
      id: customer.id,
      name: customer.name,
      address: customer.address || '',
      phone: customer.phone || '',
      status: customer.status || 'active',
    });
    document.getElementById('modal_customer').showModal();
  };

  const handleAdd = () => {
    setIsEditing(false);
    setFormData({
      id: null,
      name: '',
      address: '',
      phone: '',
      status: 'active',
    });
    document.getElementById('modal_customer').showModal();
  };

  const handleDelete = async (customer) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data nasabah: ${customer.name}?`)) {
      return;
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customer.id);

    if (error) {
      alert(
        `Gagal hapus (mungkin nasabah masih mempunyai riwayat transaksi): ${error.message}`,
      );
    } else {
      fetchCustomers();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const payload = {
      name: groupFirstUpperCase(formData.name),
      address: formData.address,
      phone: formData.phone,
      status: formData.status,
    };

    let error;

    if (isEditing) {
      const { error: updateError } = await supabase
        .from('customers')
        .update(payload)
        .eq('id', formData.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('customers')
        .insert(payload);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      alert(`Gagal menyimpan: ${error.message}`);
    } else {
      fetchCustomers();
      document.getElementById('modal_customer').close();
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
        <h2 className="text-2xl font-bold">Data Nasabah</h2>

        <div className="flex w-full gap-2 md:w-auto">
          <input
            type="text"
            placeholder="Cari Nasabah..."
            className="input input-bordered w-full bg-white text-black"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <button
            type="button"
            className="btn btn-primary whitespace-nowrap text-white"
            onClick={handleAdd}
          >
            + Nasabah
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-box bg-white shadow">
        <table className="table">
          <thead>
            <tr>
              <th className="text-center">Status</th>
              <th>Nama Nasabah</th>
              <th className="text-right">Saldo (Rp)</th>
              <th>Kontak (WA)</th>
              <th>Alamat</th>
              <th className="text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {filteredCustomers.map((customer) => (
              <tr
                key={customer.id}
                className={
                  customer.status === 'non-active'
                    ? 'bg-gray-100 text-gray-500'
                    : ''
                }
              >
                <td className="text-center">
                  <div
                    className={`badge ${customer.status === 'active'
                      ? 'badge-success text-white'
                      : 'badge-ghost'
                      }`}
                  >
                    {getStatusLabel(customer.status)}
                  </div>
                </td>

                <td className="truncate font-bold">{customer.name}</td>

                <td className="truncate text-right font-mono font-bold text-success">
                  {Number(customer.current_balance || 0).toLocaleString('id-ID')}
                </td>

                <td className="truncate">
                  <div className="flex flex-col">
                    <span className="font-mono text-sm">{customer.phone || '-'}</span>

                    {customer.phone && (
                      <a
                        href={getWaLink(customer.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-800"
                      >
                        Chat WA ↗
                      </a>
                    )}
                  </div>
                </td>

                <td className="min-w-52">{customer.address}</td>

                <td>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-info btn-sm text-white"
                      onClick={() => handleEdit(customer)}
                    >
                      Edit
                    </button>

                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      prefetch={false}
                      className="btn btn-sm border border-primary text-primary hover:bg-primary/40"
                    >
                      Detail
                    </Link>

                    <button
                      type="button"
                      className="btn btn-error btn-sm text-white"
                      onClick={() => handleDelete(customer)}
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="6" className="py-4 text-center italic text-gray-400">
                  Data tidak ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <dialog id="modal_customer" className="modal">
        <div className="modal-box bg-white">
          <h3 className="mb-4 text-lg font-bold text-black">
            {isEditing ? 'Edit Data Nasabah' : 'Tambah Nasabah Baru'}
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="form-control mb-3 w-full">
              <label className="label font-semibold text-gray-700">Nama Lengkap</label>
              <input
                type="text"
                className="input input-bordered w-full bg-white text-black"
                required
                value={formData.name}
                onChange={(event) =>
                  setFormData({ ...formData, name: event.target.value })
                }
              />
            </div>

            <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-2">
              <div className="form-control">
                <label className="label font-semibold text-gray-700">
                  No. Handphone (WA)
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full bg-white text-black"
                  placeholder="08xxxxxxxx"
                  value={formData.phone}
                  onChange={(event) =>
                    setFormData({ ...formData, phone: event.target.value })
                  }
                />
              </div>

              <div className="form-control">
                <label className="label font-semibold text-gray-700">Status</label>
                <select
                  className="select select-bordered w-full bg-white text-black"
                  value={formData.status}
                  onChange={(event) =>
                    setFormData({ ...formData, status: event.target.value })
                  }
                >
                  <option value="active">Aktif</option>
                  <option value="non-active">Non-Aktif</option>
                </select>
              </div>
            </div>

            <div className="form-control mb-6 w-full">
              <label className="label font-semibold text-gray-700">Alamat Lengkap</label>
              <textarea
                className="textarea textarea-bordered h-24 bg-white text-black"
                required
                value={formData.address}
                onChange={(event) =>
                  setFormData({ ...formData, address: event.target.value })
                }
              />
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn"
                onClick={() => document.getElementById('modal_customer').close()}
              >
                Batal
              </button>

              <button
                type="submit"
                className="btn btn-primary text-white"
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : 'Simpan Data'}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}
