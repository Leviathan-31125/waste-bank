'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
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
    status: 'active' 
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchCustomers = async () => {
    // Order by ID descending biar data baru muncul paling atas
    const { data } = await supabase.from('customers').select('*').order('id', { ascending: false })
    setCustomers(data || [])
  }

  // Helper untuk Link WhatsApp
  const getWaLink = (phone) => {
    if(!phone) return '#'
    let cleanNum = phone.replace(/\D/g, '') // Hapus karakter selain angka
    if (cleanNum.startsWith('0')) {
        cleanNum = '62' + cleanNum.slice(1) // Ubah 08xx jadi 628xx
    }
    return `https://wa.me/${cleanNum}`
  }

  const filteredCustomers = customers.filter(c => {
    const term = searchTerm.toLowerCase()
    return (
        c.name.toLowerCase().includes(term) ||
        (c.address && c.address.toLowerCase().includes(term)) ||
        (c.phone && c.phone.includes(term))
    )
  })

  // Handle Buka Modal Edit
  const handleEdit = (c) => {
    setIsEditing(true)
    // Load data nasabah ke form
    setFormData({
        id: c.id,
        name: c.name,
        address: c.address || '',
        phone: c.phone || '',
        status: c.status || 'active'
    })
    document.getElementById('modal_customer').showModal()
  }

  // Handle Buka Modal Tambah
  const handleAdd = () => {
    setIsEditing(false)
    // Reset form ke kosong
    setFormData({ id: null, name: '', address: '', phone: '', status: 'active' })
    document.getElementById('modal_customer').showModal()
  }

  // Handle Delete
  const handleDelete = async (data) => {
    if(!confirm(`Apakah Anda yakin ingin menghapus data nasabah: ${data.name}?`)) return;
    const { error } = await supabase.from('customers').delete().eq('id', data.id)
    
    if (error) {
      alert("Gagal hapus (Mungkin nasabah masih punya riwayat transaksi): " + error.message)
    } else {
      fetchCustomers()
    }
  }

  // Handle Submit (Simpan / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: groupFirstUpperCase(formData.name),
      address: formData.address,
      phone: formData.phone,
      status: formData.status
    }

    let error;
    if (isEditing) {
      // Logic UPDATE
      const { error: err } = await supabase
        .from('customers')
        .update(payload)
        .eq('id', formData.id)
      error = err
    } else {
      // Logic INSERT
      const { error: err } = await supabase
        .from('customers')
        .insert(payload)
      error = err
    }
    
    setLoading(false)
    
    if (error) {
      alert('Gagal menyimpan: ' + error.message)
    } else {
      fetchCustomers() // Refresh tabel
      document.getElementById('modal_customer').close() // Tutup modal
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Data Nasabah</h2>
        <div className="flex gap-2 w-full md:w-auto">
            <input 
                type="text" 
                placeholder="Cari Nasabah..." 
                className="input input-bordered bg-white text-black w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-primary text-white whitespace-nowrap" onClick={handleAdd}>
              + Nasabah
            </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-box">
        <table className="table">
          <thead>
            <tr>
              <th className='text-center'>Status</th>
              <th>Nama Nasabah</th>
              <th>Kontak (WA)</th>
              <th>Alamat</th>
              <th className='text-right'>Saldo Nasabah</th>
              <th className="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c) => (
              <tr key={c.id} className={c.status === 'non-active' ? 'bg-gray-100 text-gray-500' : ''}>
                <td className='text-center'>
                    <div className={`badge ${c.status === 'active' ? 'badge-success text-white' : 'badge-ghost'}`}>
                        {c.status}
                    </div>
                </td>
                <td className="font-bold truncate">{c.name}</td>
                <td className='truncate'>
                    <div className="flex flex-col">
                        <span className="text-sm font-mono">{c.phone || "-"}</span>
                        {c.phone && (
                            <a href={getWaLink(c.phone)} target="_blank" rel="noopener noreferrer" 
                              className="text-xs text-green-600 hover:text-green-800 font-bold flex items-center gap-1 mt-1">
                              Chat WA ↗
                            </a>
                        )}
                    </div>
                </td>
                <td className="min-w-52">{c.address}</td>
                <td className="font-mono font-bold text-success text-right truncate">Rp {c.current_balance.toLocaleString()}</td>
                <td>
                  <div className='flex gap-2 items-center'>
                    <button className="btn btn-sm btn-info text-white" onClick={() => handleEdit(c)}>Edit</button>
                    <Link href={`/dashboard/customers/${c.id}`} prefetch={false} className="btn btn-sm hover:bg-primary/40 border border-primary text-primary">
                      Detail
                    </Link>
                    <button className="btn btn-sm btn-error text-white" onClick={() => handleDelete(c)}>Hapus</button>  
                  </div>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && <tr><td colSpan="6" className="text-center py-4 italic text-gray-400">Data tidak ditemukan.</td></tr>}
          </tbody>
        </table>
      </div>

      <dialog id="modal_customer" className="modal">
        <div className="modal-box bg-white">
          <h3 className="font-bold text-lg mb-4 text-black">
            {isEditing ? 'Edit Data Nasabah' : 'Tambah Nasabah Baru'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-control w-full mb-3">
              <label className="label font-semibold text-gray-700">Nama Lengkap</label>
              <input 
                type="text" 
                className="input input-bordered bg-white text-black w-full" 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>

            <div className="grid lg:grid-cols-2 md:grid-cols-2 grid-cols-1 gap-3 mb-3">
                <div className="form-control">
                    <label className="label font-semibold text-gray-700">No. Handphone (WA)</label>
                    <input 
                        type="text" 
                        className="input input-bordered bg-white text-black w-full" 
                        placeholder="08xxxxxxxx"
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                    />
                </div>
                <div className="form-control">
                    <label className="label font-semibold text-gray-700">Status</label>
                    <select 
                        className="select select-bordered bg-white text-black w-full" 
                        value={formData.status} 
                        onChange={e => setFormData({...formData, status: e.target.value})}
                    >
                        <option value="active">Active</option>
                        <option value="non-active">Non-Active</option>
                    </select>
                </div>
            </div>

            <div className="form-control w-full mb-6">
              <label className="label font-semibold text-gray-700">Alamat Lengkap</label>
              <textarea 
                className="textarea textarea-bordered bg-white text-black h-24" 
                required 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})}
              ></textarea>
            </div>
            
            <div className="modal-action">
              <button type="button" className="btn" onClick={()=>document.getElementById('modal_customer').close()}>Batal</button>
              <button type="submit" className="btn btn-primary text-white" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan Data'}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  )
}