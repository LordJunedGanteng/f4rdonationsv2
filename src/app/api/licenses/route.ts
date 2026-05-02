import { NextRequest, NextResponse } from "next/server";
import { listLicenses, saveLicense, type License } from "@/lib/kv";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  try {
    const licenses = await listLicenses(userId ? parseInt(userId, 10) : undefined);
    return NextResponse.json({ licenses });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, game_id, game_name, expires_at } = await request.json();

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // Generate a random license key
    const randomKey = `F4R-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newLicense: License = {
      id: Date.now(),
      license_key: randomKey,
      user_id,
      game_id: game_id || "default",
      game_name: game_name || null,
      status: "active",
      expires_at: expires_at || null,
      created_at: new Date().toISOString(),
    };

    await saveLicense(newLicense);

    return NextResponse.json({
      license_key: newLicense.license_key,
      license: newLicense,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
