import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/login", "/onboarding", "/api", "/impressum", "/datenschutz", "/agb", "/pricing", "/dsa"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Pass pathname to layout via header
  supabaseResponse.headers.set("x-pathname", pathname);

  // Redirect unauthenticated to login
  if (!user && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated away from auth pages
  if (user && (pathname === "/login" || pathname === "/")) {
    return NextResponse.redirect(new URL("/chats", request.url));
  }

  // Onboarding guard: check if user has a username set
  // Only for authenticated users not already on onboarding
  if (user && !pathname.startsWith("/onboarding") && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const { data: profile } = await supabase
      .from("users")
      .select("username")
      .eq("id", user.id)
      .single();
    if (!profile?.username) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)"],
};
