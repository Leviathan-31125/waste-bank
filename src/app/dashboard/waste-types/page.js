'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { groupFirstUpperCase } from '@/utils/TextModify';

export default function WasteTypesPage() {
  const supabase = createClient();
  const [wasteTypes, setWasteTypes] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  
  // Data Handler
  const [formData, setFormData] = useState({ 
    id: null, name: '', uom_id: '', purchase_price: 0, sales_price: 0 
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // API handle
  const fetchData = async () => {
    const { data: waste } = await supabase.from('waste_types').select('*, uoms(name)').order('id')
    const { data: uom } = await supabase.from('uoms').select('*')
    setWasteTypes(waste || [])
    setUoms(uom || [])
  }

  const handleEdit = (item) => {
    setIsEditing(true)
    setFormData(item)
    document.getElementById('modal_waste').showModal()
  }

  const handleAdd = () => {
    setIsEditing(false)
    setFormData({ id: null, name: '', uom_id: '', purchase_price: 0, sales_price: 0 })
    document.getElementById('modal_waste').showModal()
  }

  const handleDelete = async (data) => {
    if(!confirm(`Yakin hapus item: ${data.name}?`)) return;
    const { error } = await supabase.from('waste_types').delete().eq('id', data.id)
    if(error) alert("Gagal hapus (Mungkin item sudah pernah ditransaksikan): " + error.message)
    else fetchData()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    formData.name = groupFirstUpperCase(formData.name);

    let error;
    if(isEditing) {
        const { error: err } = await supabase.from('waste_types').update({
            name: formData.name,
            uom_id: formData.uom_id,
            purchase_price: formData.purchase_price,
            sales_price: formData.sales_price
        }).eq('id', formData.id)
        error = err
    } else {
        const { id, ...payload } = formData
        const { error: err } = await supabase.from('waste_types').insert(payload)
        error = err
    }

    setLoading(false)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      fetchData()
      document.getElementById('modal_waste').close()
    }
  }

  const filteredWaste = wasteTypes.filter(w => {
    const term = searchTerm.toLowerCase()
    return (
        w.name.toLowerCase().includes(term) ||
        (w.uoms.name && w.uoms.name.toLowerCase().includes(term)) ||
        (w.purchase_price && String(w.purchase_price).includes(term)) ||
        (w.current_stock && String(w.current_stock).includes(term)) ||
        (w.sales_price && String(w.sales_price).includes(term))
    )
  })

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">List Sampah</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <input 
              type="text" 
              placeholder="Cari Sampah..." 
              className="input input-bordered bg-white text-black w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-primary text-white whitespace-nowrap" onClick={handleAdd}>
            + Sampah
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-box">
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th className='text-right'>Beli (Nasabah)</th>
              <th className='text-right'>Jual (Pengepul)</th>
              <th className='text-center'>Stok</th>
              <th className='text-center'>Satuan</th>
              <th className="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredWaste.map((w) => (
              <tr key={w.id}>
                <td className="font-bold truncate">{w.name}</td>
                <td className='text-right'>Rp {w.purchase_price.toLocaleString()}</td>
                <td className='text-right'>Rp {w.sales_price.toLocaleString()}</td>
                <td className='text-center'>
                    <span className={`badge ${w.current_stock > 0 ? 'badge-success' : 'badge-warning'} text-white`}>
                        {w.current_stock}
                    </span>
                </td>
                <td className='text-center'>{w.uoms?.name}</td>
                <td className="flex justify-center gap-2">
                    <button className="btn btn-sm btn-info text-white" onClick={() => handleEdit(w)}>Edit</button>
                    <button className="btn btn-sm btn-error text-white" onClick={() => handleDelete(w)}>Hapus</button>
                </td>
              </tr>
            ))}
            {filteredWaste.length === 0 && <tr><td colSpan="6" className="text-center py-4 italic text-gray-400">Data tidak ditemukan.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* MODAL REUSABLE */}
      <dialog id="modal_waste" className="modal">
        <div className="modal-box bg-white">
          <h3 className="font-bold text-lg mb-4">{isEditing ? 'Edit Item' : 'Tambah Item Baru'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-control mb-3">
              <label className="label">Nama Item</label>
              <input type="text" className="input input-bordered bg-white text-black" required 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div className="form-control mb-3">
              <label className="label">Satuan (UOM)</label>
              <select className="select select-bordered bg-white text-black" required
                value={formData.uom_id} onChange={e => setFormData({...formData, uom_id: e.target.value})}>
                <option value="">-- Pilih Satuan --</option>
                {uoms.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="form-control">
                <label className="label">Harga Beli (Rp)</label>
                <input type="number" className="input input-bordered bg-white text-black" required 
                   value={formData.purchase_price} onChange={e => setFormData({...formData, purchase_price: e.target.value})} />
              </div>
              <div className="form-control">
                <label className="label">Harga Jual (Rp)</label>
                <input type="number" className="input input-bordered bg-white text-black" required 
                   value={formData.sales_price} onChange={e => setFormData({...formData, sales_price: e.target.value})} />
              </div>
            </div>

            <div className="modal-action">
              <button type="button" className="btn" onClick={()=>document.getElementById('modal_waste').close()}>Batal</button>
              <button type="submit" className="btn btn-primary text-white" disabled={loading}>Simpan</button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  )
}