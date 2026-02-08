import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const authRequiredPrefixes = ["/dashboard", "/admin"];

export async function proxy(request: NextRequest) {
  const { supabase, response } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  const requiresAuth = authRequiredPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!requiresAuth) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    const { data: appUser } = await supabase
      .from("users")
      .select("role,is_active")
      .eq("id", user.id)
      .maybeSingle();

    const role = typeof appUser?.role === "string" ? appUser.role : "student";
    const isActive = Boolean(appUser?.is_active);
    const allowed = Boolean(appUser) && ["admin", "superadmin"].includes(role) && isActive;

    if (!allowed) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
