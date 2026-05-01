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
    };
    const token = btoa(JSON.stringify(payload));

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
