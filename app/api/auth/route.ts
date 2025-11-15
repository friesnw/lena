import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
interface AuthRequest {
  password?: string;
}

export async function POST(request: NextRequest) {
  try {
    // get password from request body
    const body: AuthRequest = await request.json();

    // check if password is provided
    if (!body.password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // compare to stored password from env
    if (body.password === process.env.PASSWORD) {
      // if match, set cookie and return success
      const cookieStore = await cookies();
      cookieStore.set("authenticated", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
      return NextResponse.json({ message: "Authenticated" }, { status: 200 });
    } else {
      // if no match, return error
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
  } catch (error) {
    // handle JSON parsing errors or other unexpected errors
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
