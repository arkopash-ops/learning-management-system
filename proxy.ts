import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server'
import { verifyToken } from "@/lib/auth";
import { UserRole } from "@/shared/enum/UserRole.enum";

const roleRoutes: Record<UserRole, string> = {
  [UserRole.ADMIN]: "/admin/dashboard",
  [UserRole.INSTRUCTOR]: "/instructor/dashboard",
  [UserRole.LEARNER]: "/learner/dashboard",
};

const protectedRoutes: Array<{ prefix: string; role: UserRole }> = [
  { prefix: "/admin", role: UserRole.ADMIN },
  { prefix: "/instructor", role: UserRole.INSTRUCTOR },
  { prefix: "/learner", role: UserRole.LEARNER },
];

const publicAuthRoutes = ["/", "/login", "/register"];

const getDashboardForRole = (role: string) =>
  roleRoutes[role as UserRole] ?? "/login";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const matchedProtectedRoute = protectedRoutes.find(({ prefix }) =>
    pathname.startsWith(prefix),
  );

  if (!token) {
    if (matchedProtectedRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }

  try {
    const user = verifyToken(token);
    const userDashboard = getDashboardForRole(user.role);

    if (publicAuthRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL(userDashboard, request.url));
    }

    if (matchedProtectedRoute && user.role !== matchedProtectedRoute.role) {
      return NextResponse.redirect(new URL(userDashboard, request.url));
    }

    return NextResponse.next();
  } catch {
    const response = matchedProtectedRoute
      ? NextResponse.redirect(new URL("/login", request.url))
      : NextResponse.next();

    response.cookies.delete("token");
    return response;
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/instructor/:path*",
    "/learner/:path*",
    "/login",
    "/register",
    "/",
  ],
};
