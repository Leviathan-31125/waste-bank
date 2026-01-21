'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function DepositPage() {
  const supabase = createClient();
  const [ loading, setLoading ] = useState(false);
  
  // Data Handler
  const [ customers, setCustomers ] = useState([]);
  const [ batchs, setBatchs ] = useState([]);
  const [ wasteTypes, setWasteTypes ] = useState([]);
  
  // Header Info
  const [ selectedCustomer, setSelectedCustomer ] = useState('');
  const [ selectedBatch, setSelectedBatch ] = useState('');
  const [ transDate, setTransDate ] = useState(new Date().toISOString().split('T')[0]);

  // Item Info
  const [ cart, setCart ] = useState([]);
  const [tempItem, setTempItem] = useState('');
  const [tempUOM, setTempUOM] = useState("Pcs");
  const [tempQty, setTempQty] = useState("");

  useEffect(() => {
    const fetchMasters = async () => {
        const { data: cust } = await supabase
        .from('customers')
        .select('id, name, current_balance')
        .eq('status', 'active');
        
        const { data: waste } = await supabase.from('waste_types').select('*, uoms(name)');
        const { data: listBatch } = await supabase.from('batch_transactions').select('*').eq('status', 'OPEN');
        
        setCustomers(cust);
        setWasteTypes(waste);
        setBatchs(listBatch);
    }
    fetchMasters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // API Handler
  const addToBatch = () => {
    if(!tempItem || !tempQty) return
    const waste = wasteTypes.find(w => w.id == tempItem)
    const subtotal = waste.purchase_price * tempQty
    
    setCart([...cart, {
        waste_type_id: waste.id,
        name: waste.name,
        price: waste.purchase_price, // Snapshot Price
        qty: parseFloat(tempQty),
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
    if(!selectedCustomer || cart.length === 0) return alert("Data belum lengkap");
    setLoading(true)

    try {
        const { data: trans, error: transError } = await supabase
            .from('transactions')
            .insert({
                trans_type: 'DEPOSIT',
                customer_id: selectedCustomer,
                batch_id: selectedBatch,
                total_amount: grandTotal,
                trans_date: transDate
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

        const { error: detailError } = await supabase
            .from('transaction_details')
            .insert(detailsPayload)

        if(detailError) throw detailError

        const currentCust = customers.find(c => c.id == selectedCustomer)
        await supabase.from('customers')
            .update({ current_balance: currentCust.current_balance + grandTotal })
            .eq('id', selectedCustomer)

        // reset data
        setSelectedCustomer("");
        setSelectedBatch("");
        setTransDate(new Date());

        setCart([]);
        setTempItem('');
        setTempUOM("Pcs");
        setTempQty("");
        alert("Transaksi Berhasil!");
    } catch (error) {
        console.error(error)
        alert("Gagal menyimpan transaksi")
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="w-full mx-auto">
        <h2 className="text-2xl font-bold mb-6">Deposit Sampah</h2>
        
        <div className="card bg-white shadow mb-6">
            <div className="card-body">
                <div className="form-control">
                    <label className="label text-lg font-bold">Pilih Nasabah</label>
                    <select 
                        className="select select-bordered w-full"
                        value={selectedCustomer}
                        onChange={e => setSelectedCustomer(e.target.value)}
                    >
                        <option value="">-- Pilih Nasabah --</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name} (Saldo: Rp {c.current_balance.toLocaleString()})</option>
                        ))}
                    </select>
                </div>
                <div className='flex lg:flex-row md:flex-row flex-col gap-3'>
                    <div className="form-control w-full">
                        <label className="label text-lg font-bold">Pilih Batch</label>
                        <select 
                            className="select select-bordered w-full"
                            value={selectedBatch}
                            onChange={e => setSelectedBatch(e.target.value)}
                        >
                            <option value="">-- Pilih Batch --</option>
                            {batchs.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-control w-full">
                        <label className="label text-lg font-bold">Tgl Transaksi</label>
                        <input 
                            type="date" 
                            className="input input-bordered bg-white text-black w-full"
                            value={transDate}
                            onChange={(e) => setTransDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>

        <div className="card bg-base-100 shadow border border-base-300 mb-6">
            <div className="card-body">
                <h3 className="card-title text-lg">Input Item</h3>
                <div className="flex lg:flex-row md:flex-row sm:flex-row flex-col lg:gap-3 gap-2 lg:items-end md:items-end sm:items-end ">
                    <div className="form-control w-full">
                        <label className="label">Jenis Sampah</label>
                        <select 
                            className="select select-bordered" 
                            value={tempItem} 
                            onChange={e => { 
                                setTempUOM(wasteTypes.find(w => w.id == e.target.value)?.uoms.name || "Pcs");
                                setTempItem(e.target.value);
                            }}
                        >
                            <option value="">Pilih Sampah</option>
                            {wasteTypes.map(w => (
                                <option key={w.id} value={w.id}>{w.name} (@ Rp {w.purchase_price})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-control lg:w-32 md:w-32 w-full">
                        <label className="label">Qty ({tempUOM})</label>
                        <input 
                            type="number" 
                            className="input input-bordered w-full" 
                            value={tempQty}
                            onChange={e => { 
                                if (e.target.value >= 0) setTempQty(e.target.value);
                                else setTempQty("");
                            }}
                        />
                    </div>
                    <button className="btn btn-info text-white" onClick={addToBatch} disabled={!tempItem || !tempQty}>+ Tambah</button>
                </div>
            </div>
        </div>

        <div className="card bg-white shadow">
            <div className="card-body overflow-x-auto">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th className='text-right'>Harga Beli</th>
                            <th className='text-center'>Qty</th>
                            <th className='text-right'>Subtotal</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cart.map((item, idx) => (
                            <tr key={idx}>
                                <td className='truncate'>{item.name}</td>
                                <td className='text-right'>{item.price}</td>
                                <td className='text-center'>{item.qty}</td>
                                <td className='text-right truncate'>Rp {item.subtotal.toLocaleString()}</td>
                                <td><button className="btn btn-xs btn-error text-white" onClick={() => removeItem(idx)}>X</button></td>
                            </tr>
                        ))}
                        {cart.length === 0 && <tr><td colSpan="5" className="text-center italic text-gray-400">Belum ada item</td></tr>}
                    </tbody>
                </table>
            </div>
            <div className='flex gap-1 m-4 ms-5'>
                <p colSpan="1" className="text-right text-lg font-bold">Total Deposit:</p>
                <p className="text-lg text-primary font-semibold">Rp {grandTotal.toLocaleString()}</p>
            </div>
           <div className="card-actions justify-end m-4">
                <button 
                    className={`btn btn-primary text-white w-full ${loading ? 'loading' : ''}`} 
                    onClick={handleSubmit}
                    disabled={loading || cart.length === 0 || !selectedCustomer || !transDate || transDate === ""}
                >
                    Simpan Transaksi
                </button>
            </div>
        </div>
    </div>
  )
}