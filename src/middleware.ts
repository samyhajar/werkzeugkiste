import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/supabase'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user profile for role-based routing
  let profile = null
  let userRole = 'student' // Default fallback role

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data

    // Fallback to user metadata if profile not found yet (timing issue)
    if (!profile && user.user_metadata?.role) {
      userRole = user.user_metadata.role as string
    } else if (profile?.role) {
      userRole = profile.role
    }
  }

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin')
  const isHomePage = request.nextUrl.pathname === '/'
  const isPublicPage = [
    '/digi-sammlung',
    '/ueber-uns',
    '/fragen',
    '/suche',
  ].some(p => request.nextUrl.pathname.startsWith(p))

  // If user is not authenticated
  if (!user) {
    if (!isAuthPage && !isHomePage && !isPublicPage) {
      // Allow the request to continue and let the frontend handle the unauthenticated state
      // This is often better than a redirect, which can be disruptive.
    }
    return supabaseResponse
  }

  // If user is authenticated but on auth pages (excluding set-password), redirect based on role
  if (user && isAuthPage && request.nextUrl.pathname !== '/auth/set-password') {
    const url = request.nextUrl.clone()
    if (userRole === 'admin') {
      url.pathname = '/admin'
    } else {
      url.pathname = '/'
    }
    return NextResponse.redirect(url)
  }

  // Role-based access control
  if (user) {
    // Student trying to access admin pages
    if (userRole === 'student' && isAdminPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // Admin visiting home page should go to admin dashboard
    // BUT: Don't redirect if this is part of a logout process
    const isLogoutRedirect =
      request.nextUrl.searchParams.get('logout') === 'true'

    if (isHomePage && userRole === 'admin' && !isLogoutRedirect) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
