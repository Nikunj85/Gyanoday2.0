import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect mycp routes (Admin Control Panel)
  if (request.nextUrl.pathname.startsWith('/mycp')) {
    // Exclude login page from redirect loop
    if (request.nextUrl.pathname === '/mycp/login') {
      if (user) {
        // If user is already logged in as admin, redirect to dashboard
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userData?.role === 'admin') {
          return NextResponse.redirect(new URL('/mycp', request.url))
        }
      }
      return response
    }

    if (!user) {
      return NextResponse.redirect(new URL('/mycp/login', request.url))
    }

    // Role check for admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      // Not an admin, redirect to root
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Define protected consumer routes
  const protectedRoutes = [
    '/dashboard',
    '/student-dashboard',
    '/subjects',
    '/quiz',
    '/profile',
    '/parent-dashboard',
  ]
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth pages, and steer parent
  // accounts away from student-only surfaces — a parent has no class_id
  // or quiz progress, so those pages don't make sense for them.
  const authRoutes = ['/login']
  const isAuthRoute = authRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
  const studentOnlyRoutes = ['/dashboard', '/student-dashboard', '/subjects', '/quiz']
  const isStudentOnlyRoute = studentOnlyRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (user && (isAuthRoute || isStudentOnlyRoute)) {
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

    if (isAuthRoute) {
      return NextResponse.redirect(
        new URL(userData?.role === 'parent' ? '/parent-dashboard' : '/dashboard', request.url)
      )
    }
    if (isStudentOnlyRoute && userData?.role === 'parent') {
      return NextResponse.redirect(new URL('/parent-dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
