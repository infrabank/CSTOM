import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.delete("cstom_access_token");
  response.cookies.delete("cstom_refresh_token");

  return response;
}
