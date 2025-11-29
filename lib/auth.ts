import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Middleware function to check if user is authenticated
 * Returns null if authenticated, or a NextResponse with 401 if not
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const authenticated = cookieStore.get("authenticated");

  if (!authenticated || authenticated.value !== "true") {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  return null; // Authenticated
}
