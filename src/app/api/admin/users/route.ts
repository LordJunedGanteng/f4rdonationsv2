import { NextRequest, NextResponse } from "next/server";
import {
  listUsers, listLicenses, saveUser, saveLicense,
  getUserByUsername,
  type User, type License,
} from "@/lib/kv";
import type { AdminUser } from "@/lib/api";

export async function GET() {
  try {
    const users = await listUsers();
    const licenses = await listLicenses();

    const adminUsers: AdminUser[] = users.map(u => {
      const userLic = licenses.find(l => l.user_id === u.id);
      return {
        id: u.id,
        username: u.username,
        role: u.role,
        created_at: u.created_at,
        license_key: userLic?.license_key || null,
        status: userLic?.status || null,
        universe_ids: userLic?.game_id ? [userLic.game_id] : [],
        platform_api_keys: {},
      };
    });

    return NextResponse.json({ users: adminUsers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** Admin-only: create a new user and generate a license key in one request. */
export async function POST(request: NextRequest) {
  try {
    const { username, password, game_id, game_name } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "username and password are required" }, { status: 400 });
    }

    const existing = await getUserByUsername(username);
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    // 1. Create user
    const newUser: User = {
      id: Date.now(),
      username,
      password,
      role: "user",
      created_at: new Date().toISOString(),
    };
    await saveUser(newUser);

    // 2. Generate license
    const randomKey = `F4R-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newLicense: License = {
      id: Date.now() + 1,
      license_key: randomKey,
      user_id: newUser.id,
      game_id: game_id || "default",
      game_name: game_name || null,
      status: "active",
      expires_at: null,
      created_at: new Date().toISOString(),
    };
    await saveLicense(newLicense);

    return NextResponse.json({
      ok: true,
      user_id: newUser.id,
      username: newUser.username,
      license_key: randomKey,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
