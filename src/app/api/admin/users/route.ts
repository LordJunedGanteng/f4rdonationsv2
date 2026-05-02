import { NextRequest, NextResponse } from "next/server";
import { listUsers, listLicenses, type AdminUser } from "@/lib/kv";

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
