import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth"];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public") ||
    pathname === "/favicon.ico"
  );
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Handle ?pw= login shortcut
  const pw = searchParams.get("pw");
  if (pw) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete("pw");

    if (pw === process.env.PASSWORD) {
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.set("authenticated", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
      return response;
    }

    // Wrong password — strip ?pw= and fall through
    return NextResponse.redirect(redirectUrl);
  }

  const isPublic = isPublicPath(pathname);
  const authenticated =
    request.cookies.get("authenticated")?.value === "true";

  if (!authenticated && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (authenticated && pathname === "/login") {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

