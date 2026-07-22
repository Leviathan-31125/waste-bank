'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (authError) throw authError

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', authData.user.id)
        .single()

      if (profileError || !profile) {
        await supabase.auth.signOut()
        throw new Error('Akun belum memiliki profil akses. Hubungi pengurus.')
      }

      if (!['admin', 'customer'].includes(profile.role)) {
        await supabase.auth.signOut()
        throw new Error('Peran akun tidak dikenali. Hubungi pengurus.')
      }

      router.replace(profile.role === 'admin' ? '/dashboard' : '/nasabah')
      router.refresh()
    } catch (error) {
      alert(`Login gagal: ${error.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-3">
      <div className="card w-full max-w-sm bg-white shadow-xl">
        <div className="card-body">
          <img
            src="/logo-bms2.png"
            className="mx-auto w-full max-w-52"
            alt="Bank Sampah BMS2"
          />

          <p className="mt-1 text-center text-sm text-gray-500">
            Masuk sebagai pengurus atau nasabah
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-control mt-4">
              <label className="label" htmlFor="email">
                <span className="label-text font-semibold text-gray-700">
                  Email
                </span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="nama@email.com"
                className="input input-bordered w-full bg-white text-gray-900 placeholder-gray-400"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-control mt-4">
              <label className="label" htmlFor="password">
                <span className="label-text font-semibold text-gray-700">
                  Password
                </span>
              </label>
              <input
                id="password"
                type="password"
                placeholder="********"
                className="input input-bordered w-full bg-white text-gray-900 placeholder-gray-400"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="form-control mt-8">
              <button
                type="submit"
                className="btn btn-primary w-full text-white"
                disabled={loading}
              >
                {loading ? 'Masuk...' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
