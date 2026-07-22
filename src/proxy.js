import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const ADMIN_HOME = '/dashboard'
const CUSTOMER_HOME = '/nasabah'

export async function proxy(request) {
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
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
      },
    },
  )

  const pathname = request.nextUrl.pathname
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isCustomerRoute = pathname.startsWith('/nasabah')
  const isProtectedRoute = isDashboardRoute || isCustomerRoute

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (isProtectedRoute || pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return response
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const homePath = profile.role === 'admin' ? ADMIN_HOME : CUSTOMER_HOME

  if (pathname === '/' || pathname === '/login') {
    return NextResponse.redirect(new URL(homePath, request.url))
  }

  if (profile.role === 'admin' && isCustomerRoute) {
    return NextResponse.redirect(new URL(ADMIN_HOME, request.url))
  }

  if (profile.role === 'customer' && isDashboardRoute) {
    return NextResponse.redirect(new URL(CUSTOMER_HOME, request.url))
  }

  return response
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*', '/nasabah/:path*'],
}
