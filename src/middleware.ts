import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Fast gate: a valid signed cookie is required for admin pages and admin APIs.
// Route handlers re-check the admin against the database.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api/admin")) {
    if (!session) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
    return NextResponse.next();
  }
  if (pathname === "/admin/login") {
    if (session) return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.next();
  }
  if (!session) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
