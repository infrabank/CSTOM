import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("cstom_refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { detail: "No refresh token" },
      { status: 401 }
    );
  }

  const res = await fetch(`${API_URL}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!res.ok) {
    const response = NextResponse.json(
      { detail: "Token refresh failed" },
      { status: 401 }
    );
    // Clear invalid refresh token
    response.cookies.delete("cstom_refresh_token");
    response.cookies.delete("cstom_access_token");
    return response;
  }

  const tokens = await res.json();
  const isProduction = process.env.NODE_ENV === "production";

  const response = NextResponse.json({ access: tokens.access });

  // Update refresh token (rotation)
  if (tokens.refresh) {
    response.cookies.set("cstom_refresh_token", tokens.refresh, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
  }

  // Update access token cookie
  response.cookies.set("cstom_access_token", tokens.access, {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  return response;
}
