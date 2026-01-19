'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('Login Gagal: ' + error.message)
      setLoading(false)
    } else {
      router.refresh()
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 mx-3">
      <div className="card w-96 bg-white shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-primary font-bold text-2xl mb-4">Bank Sampah BMS2</h2>
          
          <form onSubmit={handleLogin}>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-700 font-semibold">Email</span>
              </label>
              <input 
                type="email" 
                placeholder="admin@banksampah.com" 
                className="input input-bordered bg-white text-gray-900 placeholder-gray-400 w-full" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text text-gray-700 font-semibold">Password</span>
              </label>
              <input 
                type="password" 
                placeholder="********" 
                className="input input-bordered bg-white text-gray-900 placeholder-gray-400 w-full" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-control mt-8">
              <button className={`btn btn-primary text-white w-full ${loading ? 'loading' : ''}`} disabled={loading}>
                {loading ? 'Masuk...' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}