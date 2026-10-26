import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "@/lib/supabase/env";

// Paths anyone may open: sign-in and sign-up, client fill links, published
// reports and the development-only demo.
const PUBLIC_PREFIXES = ["/login", "/signup", "/auth", "/f/", "/r/", "/no-access", "/demo"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PREFIXES.some((p) => path.startsWith(p));

  // Before Supabase is set up, only the sign-in page (with setup help) and the demo work.
  if (!isSupabaseConfigured()) {
    return isPublic ? response : NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = createServerClient(supabaseUrl(), supabaseKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // Verifies the session token against the project's signing keys (no Auth
  // server round trip) and refreshes the cookie when it is close to expiring.
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims && !isPublic && !path.startsWith("/api/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = path === "/" ? "" : `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
