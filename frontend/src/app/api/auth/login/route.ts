import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const res = await fetch(`${API_URL}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    return NextResponse.json(
      { detail: error?.detail || "Invalid credentials" },
      { status: res.status }
    );
  }

  const tokens = await res.json();
  const isProduction = process.env.NODE_ENV === "production";

  const response = NextResponse.json({
    access: tokens.access,
    role: tokens.role,
    display_name: tokens.display_name,
  });

  // Set refresh token as HttpOnly cookie (not accessible via JS)
  response.cookies.set("cstom_refresh_token", tokens.refresh, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  // Set access token as regular cookie (readable by middleware + client)
  response.cookies.set("cstom_access_token", tokens.access, {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });

  return response;
}
