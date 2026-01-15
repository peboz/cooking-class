import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get the session token from cookies
  const sessionToken = request.cookies.get("authjs.session-token")?.value || 
                       request.cookies.get("__Secure-authjs.session-token")?.value
  
  const isLoggedIn = !!sessionToken

  // Public auth routes (should redirect to /app if already logged in)
  const authRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
  ]

  // Protected routes (require authentication)
  const protectedRoutes = ["/app", "/onboarding"]
  
  // Admin routes (require authentication - role check happens in layout)
  const adminRoutes = ["/admin"]
  
  // Instructor routes (require authentication - instructor verification or admin check happens in layout)
  const instructorRoutes = ["/app/instructor"]

  // First-time admin setup (public, but checks for admin existence internally)
  if (pathname.startsWith("/first-admin-setup")) {
    return NextResponse.next()
  }

  // Root path redirect logic
  if (pathname === "/") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/app", request.url))
    }
    // Allow root access for non-logged in users
    return NextResponse.next()
  }

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && authRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/app", request.url))
  }

  // Redirect non-logged in users away from protected pages
  if (!isLoggedIn && protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // Redirect non-logged in users away from admin pages
  // Note: Role-based authorization (ADMIN check) is handled in the admin layout
  if (!isLoggedIn && adminRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

