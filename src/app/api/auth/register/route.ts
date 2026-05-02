import { NextRequest, NextResponse } from "next/server";
import { saveUser, getUserByUsername, type User } from "@/lib/kv";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const existing = await getUserByUsername(username);
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const newUser: User = {
      id: Date.now(), // Simple unique ID
      username,
      password, // In a real app, hash this!
      role: "user",
      created_at: new Date().toISOString(),
    };

    await saveUser(newUser);

    return NextResponse.json({
      message: "User created",
      user_id: newUser.id,
      username: newUser.username,
      role: newUser.role,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
