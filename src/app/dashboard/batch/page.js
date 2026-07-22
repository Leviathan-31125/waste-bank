"use client";
import { createClient } from '@/lib/supabase';
import { groupFirstUpperCase } from '@/utils/TextModify';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const BatchPage = () => {
  const supabase = createClient();
  const [listBatch, setListBatch] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    status: 'OPEN'
  });
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('');

  // API Handler
  const fetchBatch = async () => {
    const { data } = await supabase
      .from('view_batch_summary')
      .select('*')
      .order('created_at', { ascending: false })
    setListBatch(data || []);
  }

  useEffect(() => {
    fetchBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []);

  // API Handler
  const handleEdit = (batch) => {
    setIsEditing(true);
    setFormData(batch);
    document.getElementById('modal_batch').showModal();
  }

  const handleAdd = () => {
    setIsEditing(false);
    setFormData({
      id: null,
      name: "",
      status: 'OPEN'
    });
    document.getElementById('modal_batch').showModal();
  }

  const handleDelete = async (data) => {
    if (!confirm(`Yakin mau hapus batch: ${data.name}?`)) return;
    const { error } = await supabase.from('batch_transactions').delete().eq('id', data.id);
    if (error) alert("Gagal hapus: " + error.message);
    else fetchBatch();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let error;
    formData.name = groupFirstUpperCase(formData.name);

    if (isEditing) {
      const { error: err } = await supabase.from('batch_transactions').update({ name: formData.name, status: formData.status }).eq('id', formData.id)
      error = err
    } else {
      const { id, ...payload } = formData
      const { error: err } = await supabase.from('batch_transactions').insert(payload)
      error = err
    }

    setLoading(false)
    if (!error) {
      setFormData({ id: null, name: '', status: "OPEN" })
      fetchBatch()
      document.getElementById('modal_batch').close()
    } else {
      alert("Error: " + error.message)
    }
  }

  // Filter handler
  const filteredBatch = listBatch.filter(b => {
    const term = searchTerm.toLowerCase()
    return (
      b.name.toLowerCase().includes(term) ||
      b.status.toLowerCase().includes(term)
    )
  })

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Data Batch</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Cari Batch..."
            className="input input-bordered bg-white text-black w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-primary text-white whitespace-nowrap" onClick={handleAdd}>
            + Batch
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-box">
        <table className="table">
          <thead>
            <tr>
              <th>Nama Batch</th>
              <th className='text-center'>Status Batch</th>
              <th className='text-center'>Status Jual</th>
              <th className='text-center'>Jumlah Transaksi</th>
              <th className='text-center'>Total (Rp)</th>
              <th className="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredBatch.map((b) => (
              <tr key={b.id} className={b.status === 'non-active' ? 'bg-gray-100 text-gray-500' : ''}>
                <td className="font-bold truncate">{b.name}</td>
                <td className='text-center'>
                  <div className={`badge ${b.status === 'OPEN' ? 'badge-success text-white' : 'badge-error text-white'}`}>
                    {b.status}
                  </div>
                </td>
                <td className='text-center truncate'>
                  <div className={`badge ${b.sell_status ? 'badge-success text-white' : 'badge-error text-white'}`}>
                    {b.sell_status ? "Terjual" : "Di Gudang"}
                  </div>
                </td>
                <td className="font-mono font-bold text-success text-center truncate">{b.transaction_count.toLocaleString('id-ID')}</td>
                <td className="font-mono font-bold text-success text-right truncate"> {b.total_value.toLocaleString('id-ID')}</td>
                <td>
                  <div className='flex gap-2 justify-center items-center'>
                    <button className="btn btn-sm btn-info text-white" onClick={() => handleEdit(b)}>Edit</button>
                    <Link href={`/dashboard/batch/${b.id}`} prefetch={false} className="btn btn-sm hover:bg-primary/40 border border-primary text-primary">
                      Detail
                    </Link>
                    <button className="btn btn-sm btn-error text-white" onClick={() => handleDelete(b)}>Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredBatch.length === 0 && <tr><td colSpan="6" className="text-center py-4 italic text-gray-400">Data tidak ditemukan.</td></tr>}
          </tbody>
        </table>
      </div>

      <dialog id="modal_batch" className="modal">
        <div className="modal-box bg-white">
          <h3 className="font-bold text-lg mb-4">{isEditing ? 'Edit Batch' : 'Tambah Batch'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-control mb-3">
              <label className="label">Nama Batch</label>
              <input
                type="text"
                className="input input-bordered bg-white text-black"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-control mb-6">
              <label className="label">Status Batch</label>
              <select
                className="select select-bordered bg-white text-black w-full"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                disabled={formData.sell_status}
              >
                <option value="OPEN">OPEN</option>
                <option value="CLOSE">CLOSE</option>
              </select>
            </div>
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => document.getElementById('modal_batch').close()}>Batal</button>
              <button type="submit" className="btn btn-primary text-white" disabled={loading}>Simpan</button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  )
};

export default BatchPage
