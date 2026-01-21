'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { groupFirstUpperCase } from '@/utils/TextModify';

export default function CollectorsPage() {
  const supabase = createClient()
  const [collectors, setCollectors] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ id: null, name: '', contact: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { 
    fetchCollectors();
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [])

  // API Handler
  const fetchCollectors = async () => {
    const { data } = await supabase.from('collectors').select('*').order('id')
    setCollectors(data || [])
  }

  const handleEdit = (item) => {
    setIsEditing(true)
    setFormData(item)
    document.getElementById('modal_collector').showModal()
  }

  const handleAdd = () => {
    setIsEditing(false)
    setFormData({ id: null, name: '', contact: '' })
    document.getElementById('modal_collector').showModal()
  }

  const handleDelete = async (data) => {
    if(!confirm(`Yakin hapus data pengepul: ${data.name}?`)) return
    const { error } = await supabase.from('collectors').delete().eq('id', data.id)
    if (error) alert("Gagal hapus: " + error.message)
    else fetchCollectors()
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let error
    formData.name = groupFirstUpperCase(formData.name)
    
    if(isEditing) {
        const { error: err } = await supabase.from('collectors').update({ name: formData.name, contact: formData.contact }).eq('id', formData.id)
        error = err
    } else {
        const { id, ...payload } = formData
        const { error: err } = await supabase.from('collectors').insert(payload)
        error = err
    }
    
    setLoading(false)
    if (!error) {
      setFormData({ id: null, name: '', contact: '' })
      fetchCollectors()
      document.getElementById('modal_collector').close()
    } else {
        alert("Error: " + error.message)
    }
  }

  const getWaLink = (phone) => {
    if(!phone) return '#'
    let cleanNum = phone.replace(/\D/g, '') // Hapus karakter selain angka
    if (cleanNum.startsWith('0')) {
        cleanNum = '62' + cleanNum.slice(1) // Ubah 08xx jadi 628xx
    }
    return `https://wa.me/${cleanNum}`
  }

  // Filter handler
  const filteredCollector = collectors.filter(c => {
    const term = searchTerm.toLowerCase()
    return (
      c.name.toLowerCase().includes(term) ||
      (c.contact && c.contact.includes(term))
    )
  })

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Data Pengepul</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Cari Pengepul..." 
            className="input input-bordered bg-white text-black w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-primary text-white" onClick={handleAdd}>+ Pengepul</button>
        </div>
      </div>

      <div className="bg-white shadow rounded-box overflow-x-auto">
        <table className="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nama</th>
                    <th>Kontak</th>
                    <th className="text-center">Aksi</th>
                </tr>
            </thead>
            <tbody>
                {filteredCollector.map(c => (
                    <tr key={c.id}>
                        <td>#{c.id}</td>
                        <td className="font-bold">{c.name}</td>
                        <td>
                          <div className="flex flex-col">
                            <span className="text-sm font-mono">{c.contact || "-"}</span>
                            {c.contact && (
                                <a href={getWaLink(c.contact)} target="_blank" rel="noopener noreferrer" 
                                  className="text-xs text-green-600 hover:text-green-800 font-bold flex items-center gap-1 mt-1">
                                  Chat WA ↗
                                </a>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className='flex justify-center items-center gap-2'>
                            <button className="btn btn-sm btn-info text-white" onClick={() => handleEdit(c)}>Edit</button>
                            <Link href={`/dashboard/collectors/${c.id}`} prefetch={false} className="btn btn-sm hover:bg-primary/40 border border-primary text-primary">
                              Detail
                            </Link>
                            <button className="btn btn-sm btn-error text-white" onClick={() => handleDelete(c)}>Hapus</button>
                          </div>
                        </td>
                    </tr>
                ))}
                {filteredCollector.length === 0 && <tr><td colSpan="6" className="text-center py-4 italic text-gray-400">Data tidak ditemukan.</td></tr>}
            </tbody>
        </table>
      </div>

      <dialog id="modal_collector" className="modal">
        <div className="modal-box bg-white">
          <h3 className="font-bold text-lg mb-4">{isEditing ? 'Edit Pengepul' : 'Tambah Mitra Pengepul'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-control mb-3">
              <label className="label">Nama Pengepul / PT</label>
              <input type="text" className="input input-bordered bg-white text-black" required 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-control mb-6">
              <label className="label">Kontak (HP/Email)</label>
              <input type="text" className="input input-bordered bg-white text-black" required 
                 value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
            </div>
            <div className="modal-action">
              <button type="button" className="btn" onClick={()=>document.getElementById('modal_collector').close()}>Batal</button>
              <button type="submit" className="btn btn-primary text-white" disabled={loading}>Simpan</button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  )
}