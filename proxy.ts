import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase auth session cookie on navigation and keeps
// signed-out visitors out of account and admin areas. Authorisation is
// still enforced server-side in every page, action and route handler.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims?.sub;
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/admin") ||
    (pathname.startsWith("/account") && !isPublicAccountPath(pathname));

  if (isProtected && !signedIn) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/account/login";
    loginUrl.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

function isPublicAccountPath(pathname: string) {
  return ["/account/login", "/account/register", "/account/forgot-password", "/account/reset-password"].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/paystack/webhook|demo/|brand/|favicon.ico|icon.svg|apple-icon|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$).*)",
  ],
};
