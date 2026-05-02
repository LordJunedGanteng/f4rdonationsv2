import { NextRequest, NextResponse } from "next/server";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const payload = {
      user_id: 1,
      username,
      role: "admin",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    };
    // Format as a dummy JWT: header.payload.signature
    // The frontend decodes the middle part.
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const data = btoa(JSON.stringify(payload)).replace(/=/g, "");
    const token = `${header}.${data}.signature`;

    return NextResponse.json({
      token,
      role: "admin",
      user_id: 1,
    });
  }

  return NextResponse.json(
    { error: "Invalid credentials" },
    { status: 401 }
  );
}
