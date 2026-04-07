import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const isLoginPage = request.nextUrl.pathname === '/leader-login'
  const isLeaderRoute = request.nextUrl.pathname.startsWith('/leader')

  // 1. IF ON LOGIN PAGE AND AUTHENTICATED -> GO TO DASHBOARD
  if (isLoginPage && session) {
    return NextResponse.redirect(new URL('/leader', request.url))
  }

  // 2. IF ON LEADER ROUTE AND NOT AUTHENTICATED -> GO TO LOGIN
  if (isLeaderRoute && !session && !isLoginPage) {
    return NextResponse.redirect(new URL('/leader-login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}