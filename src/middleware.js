import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  // 1. Inisialisasi Response Awal
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // A. Update cookie di Request (supaya server langsung "sadar" ada perubahan)
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })

          // B. Buat ulang Response berdasarkan Request yang sudah diupdate
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })

          // C. Set cookie di Response (supaya Browser menyimpan cookie-nya)
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production'
      }
    }
  )
  const { data: { user }} = await supabase.auth.getUser()
  
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Jika sudah login & mencoba akses login -> tendang ke dashboard
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Root path handler
  if (request.nextUrl.pathname === '/') {
    return user 
      ? NextResponse.redirect(new URL('/dashboard', request.url))
      : NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
}