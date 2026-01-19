'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SellPage() {
  const supabase = createClient()
  const router = useRouter()
  
  // Data Handler
  const [collectors, setCollectors] = useState([])
  const [wasteTypes, setWasteTypes] = useState([])
  
  const [selectedCollector, setSelectedCollector] = useState('')
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  const [tempItem, setTempItem] = useState('');
  const [tempUOM, setTempUOM] = useState('Pcs');
  const [tempQty, setTempQty] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: col } = await supabase.from('collectors').select('*')
      const { data: waste } = await supabase.from('waste_types').select('*, uoms(name)').gt('current_stock', 0)
      
      setCollectors(col || [])
      setWasteTypes(waste || [])
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // API Handler
  const addToBatch = () => {
    if(!tempItem || !tempQty) return
    const waste = wasteTypes.find(w => w.id == tempItem)
    const qty = parseFloat(tempQty)

    if (qty > waste.current_stock) {
      alert(`Stok tidak cukup! Sisa stok: ${waste.current_stock}`)
      return
    }

    if (cart.find(w => w.waste_type_id == waste.id)) {
      alert(`Stok sudah ada di keranjang`)
      return
    }

    const subtotal = waste.sales_price * qty
    
    setCart([...cart, {
      waste_type_id: waste.id,
      name: waste.name,
      price: waste.sales_price,
      qty: qty,
      uom: waste.uoms.name,
      subtotal: subtotal
    }])
    
    setTempItem('')
    setTempQty('')
  }

  const removeItem = (index) => {
    const newCart = [...cart]
    newCart.splice(index, 1)
    setCart(newCart)
  }

  const grandTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)

  const handleSubmit = async () => {
    if(!selectedCollector || cart.length === 0) return
    setLoading(true)

    try {
      const { data: trans, error: transError } = await supabase
        .from('transactions')
        .insert({
          trans_type: 'SELL_WASTE',
          collector_id: selectedCollector,
          total_amount: grandTotal,
          trans_date: new Date()
        })
        .select()
        .single()
      
      if(transError) throw transError

      const detailsPayload = cart.map(item => ({
        transaction_id: trans.id,
        waste_type_id: item.waste_type_id,
        qty: item.qty,
        snapshot_price: item.price,
        subtotal: item.subtotal
      }))

      const { error: detError } = await supabase.from('transaction_details').insert(detailsPayload)
      if(detError) throw detError

      alert("Penjualan ke Pengepul Berhasil!")
      router.push('/dashboard')

    } catch (error) {
      alert("Error: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full mx-auto">
      <h2 className="text-2xl font-bold mb-6">Jual Sampah ke Pengepul</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Input */}
        <div className="space-y-6">
          <div className="card bg-white shadow p-4">
             <label className="label font-bold">Pilih Pengepul</label>
             <select 
                className="select select-bordered w-full"
                value={selectedCollector}
                onChange={e => setSelectedCollector(e.target.value)}
             >
                <option value="">-- Pilih Pengepul --</option>
                {collectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
          </div>

          <div className="card bg-white shadow p-4">
            <h3 className="font-bold mb-4">Input Barang Keluar</h3>
            <div className="form-control mb-2">
               <label className="label">Item Tersedia</label>
               <select className="select select-bordered" value={tempItem} onChange={e => { 
                  setTempUOM(wasteTypes.find(w => w.id == e.target.value)?.uoms.name || "Pcs");
                  setTempItem(e.target.value);
               }}>
                 <option value="">Pilih Item</option>
                 {wasteTypes.map(w => (
                   <option key={w.id} value={w.id}>
                     {w.name} ({w.current_stock} {w.uoms.name}) - @ Rp {w.sales_price}
                   </option>
                 ))}
               </select>
            </div>
            <div className="form-control mb-4">
                <label className="label">Berat ({tempUOM})</label>
                <input type="number" className="input input-bordered" value={tempQty} onChange={e => { 
                  let maxQty = wasteTypes.find(w => w.id == tempItem)?.current_stock || 0;
      
                  if (e.target.value > 0) { 
                    setTempQty(e.target.value > maxQty ? maxQty : e.target.value);
                  }
                  else setTempQty("");
                }} />
            </div>
            <button className="btn btn-info text-white w-full" onClick={addToBatch} disabled={!tempItem || !tempQty}>+ Tambah ke Keranjang</button>
          </div>
        </div>

        {/* Kolom Kanan: Summary */}
        <div className="card bg-white shadow h-fit">
          <div className="card-body">
            <h3 className="card-title">Keranjang Penjualan</h3>
            <div className="overflow-x-auto">
              <table className="table table-compact w-full">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className='text-center'>Qty</th>
                    <th className='text-center'>Satuan</th>
                    <th className='text-right'>Subtotal</th>
                    <th className='text-center'>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr key={idx}>
                      <td className='truncate'>{item.name}</td>
                      <td className='text-center'>{item.qty}</td>
                      <td className='text-center'>{item.uom}</td>
                      <td className='text-right truncate'>Rp {item.subtotal.toLocaleString()}</td>
                      <td className='text-center'><button className="btn btn-xs btn-error text-white" onClick={() => removeItem(idx)}>X</button></td>
                    </tr>
                  ))}
                  {cart.length === 0 && <tr><td colSpan="5" className="text-center text-gray-400 italic">Belum ada item</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className='flex gap-1 m-4 ms-5'>
              <p colSpan="1" className="text-right text-lg font-bold">Total Jual:</p>
              <p className="text-lg text-primary font-semibold">Rp {grandTotal.toLocaleString()}</p>
          </div>
          <div className="card-actions justify-end m-4">
            <button 
              className={`btn btn-primary text-white w-full ${loading ? 'loading' : ''}`}
              onClick={handleSubmit}
              disabled={loading || cart.length === 0 || !selectedCollector}
            >
              Konfirmasi Penjualan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}