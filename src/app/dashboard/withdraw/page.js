'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function WithdrawPage() {
  const supabase = createClient();
  const [ loading, setLoading ] = useState(false);
  
  // Data Handler
  const [ customers, setCustomers ] = useState([]);
  const [ selectedCustId, setSelectedCustId ] = useState('');
  const [ transDate, setTransDate ] = useState(new Date().toISOString().split('T')[0]);
  const [ amount, setAmount ] = useState('');
  const [ currentBalance, setCurrentBalance ] = useState('');

  useEffect(() => {
    fetchCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedCustId) {
      const cust = customers.find(c => c.id == selectedCustId)
      setCurrentBalance(cust ? cust.current_balance : 0)
    } else {
      setCurrentBalance(0)
    }
  }, [selectedCustId, customers]);

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from('customers')
      .select('id, name, current_balance')
      .eq('status', 'active')
    setCustomers(data || [])
  }

  const handleWithdraw = async () => {
    if (!selectedCustId || !amount) return
    const withdrawAmount = parseFloat(amount)

    if (withdrawAmount > currentBalance) {
      alert("Saldo nasabah tidak mencukupi!")
      return
    }

    setLoading(true)
    try {
      const { error: transError } = await supabase.from('transactions').insert({
        trans_type: 'WITHDRAW_CASH',
        customer_id: selectedCustId,
        total_amount: withdrawAmount,
        trans_date: transDate,
        note: 'Penarikan Tunai'
      })
      if (transError) throw transError

      const { error: updateError } = await supabase
        .from('customers')
        .update({ current_balance: currentBalance - withdrawAmount })
        .eq('id', selectedCustId)
      
      if (updateError) throw updateError
      fetchCustomers();

      setSelectedCustId('');
      setAmount('');
      setCurrentBalance(0);
      alert("Penarikan Berhasil!");
    } catch (error) {
      console.error(error)
      alert("Gagal memproses penarikan: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full mx-auto">
      <h2 className="text-2xl font-bold mb-6">Tarik Tunai Nasabah</h2>
      
      <div className="card bg-white shadow-lg">
        <div className="card-body">
          <div className="form-control w-full">
            <label className="label text-lg font-bold">Tgl Transaksi</label>
            <input 
              type="date" 
              className="input input-bordered bg-white text-black w-full"
              value={transDate}
              onChange={(e) => setTransDate(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label font-bold">Pilih Nasabah</label>
            <select 
              className="select select-bordered"
              value={selectedCustId}
              onChange={(e) => setSelectedCustId(e.target.value)}
            >
              <option value="">-- Cari Nasabah --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="stats shadow my-3 bg-base-100 border">
            <div className="stat">
              <div className="stat-title">Saldo Saat Ini</div>
              <div className="lg:text-3xl md:text-2xl sm:text-xsl text-xl font-bold text-success">Rp {currentBalance.toLocaleString()}</div>
              <div className="stat-desc italic mt-1">Maksimal penarikan</div>
            </div>
          </div>

          <div className="form-control">
            <label className="label font-bold">Jumlah Penarikan (Rp)</label>
            <input 
              type="number" 
              className="input input-bordered text-lg" 
              placeholder="0"
              value={amount}
              onChange={(e) => { 
                if (e.target.value >= 0) setAmount(e.target.value)
                else setAmount("");
              }}
            />
          </div>

          <div className="card-actions justify-end mt-6">
            <button 
              className={`btn bg-yellow-500 text-white w-full ${loading ? 'loading' : ''}`}
              onClick={handleWithdraw}
              disabled={loading || !selectedCustId || !amount || parseFloat(amount) <= 0 || transDate === ""}
            >
              Proses Penarikan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}