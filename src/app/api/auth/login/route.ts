import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername } from "@/lib/kv";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;

  let userToLogin = null;

  // 1. Check static admin
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    userToLogin = {
      user_id: 1,
      username,
      role: "admin",
    };
  } else {
    // 2. Check KV
    const kvUser = await getUserByUsername(username);
    if (kvUser && kvUser.password === password) {
      userToLogin = {
        user_id: kvUser.id,
        username: kvUser.username,
        role: kvUser.role,
      };
    }
  }

  if (userToLogin) {
    const payload = {
      ...userToLogin,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    };

    // Format as a dummy JWT: header.payload.signature
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const data = btoa(JSON.stringify(payload)).replace(/=/g, "");
    const token = `${header}.${data}.signature`;

    return NextResponse.json({
      token,
      role: userToLogin.role,
      user_id: userToLogin.user_id,
    });
  }

  return NextResponse.json(
    { error: "Invalid credentials" },
    { status: 401 }
  );
}
