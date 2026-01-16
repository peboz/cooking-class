import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/auth"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get the session token from cookies
  const sessionToken = request.cookies.get("authjs.session-token")?.value || 
                       request.cookies.get("__Secure-authjs.session-token")?.value
  
  const isLoggedIn = !!sessionToken

  // Public auth routes (should redirect to /app if already logged in, except deactivated)
  const authRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
  ]
  
  // Special auth routes that don't redirect logged-in users
  const specialAuthRoutes = [
    "/auth/deactivated",
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

  // Allow access to special auth routes (like deactivated page)
  if (specialAuthRoutes.some((route) => pathname.startsWith(route))) {
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

  // Check if logged-in user is active (for protected routes)
  if (isLoggedIn && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const session = await auth()
    
    if (session?.user?.isActive === false) {
      // Redirect to account deactivated page
      if (!pathname.startsWith("/auth/deactivated")) {
        return NextResponse.redirect(new URL("/auth/deactivated", request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

