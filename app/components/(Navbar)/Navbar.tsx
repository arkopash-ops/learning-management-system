import Link from "next/link";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { UserRole } from "@/shared/enum/UserRole.enum";
import NavbarActions from "./NavbarActions";

const roleRoutes: Record<UserRole, string> = {
  [UserRole.ADMIN]: "/admin/dashboard",
  [UserRole.INSTRUCTOR]: "/instructor/dashboard",
  [UserRole.LEARNER]: "/learner/dashboard",
};

const profileRoutes: Partial<Record<UserRole, string>> = {
  [UserRole.INSTRUCTOR]: "/instructor/profile",
  [UserRole.LEARNER]: "/learner/profile",
};

const roleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Admin",
  [UserRole.INSTRUCTOR]: "Instructor",
  [UserRole.LEARNER]: "Learner",
};

const getUserRole = async () => {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    return null;
  }

  try {
    const { role } = verifyToken(token);
    return Object.values(UserRole).includes(role as UserRole)
      ? (role as UserRole)
      : null;
  } catch {
    return null;
  }
};

const getHomeRoute = (role: UserRole | null) => {
  if (!role) return "/";
  return roleRoutes[role];
};

const Navbar = async () => {
  const role = await getUserRole();
  const dashboardHref = role ? roleRoutes[role] : null;
  const profileHref = role ? (profileRoutes[role] ?? null) : null;
  const homeHref = getHomeRoute(role);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={homeHref} className="text-lg font-bold text-gray-900">
          Mini LMS
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {dashboardHref && role ? (
            <>
              <span className="hidden rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 sm:inline">
                {roleLabels[role]}
              </span>

              <Link
                href={dashboardHref}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Dashboard
              </Link>

              {role === UserRole.INSTRUCTOR && (
                <Link
                  href="/course"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Courses
                </Link>
              )}

              <NavbarActions profileHref={profileHref} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
