import { NextRequest, NextResponse } from "next/server";
import { getLicenseByKey } from "@/lib/kv";

export async function POST(request: NextRequest) {
  try {
    const { license_key, game_id } = await request.json();

    if (!license_key) {
      return NextResponse.json({ valid: false, reason: "License key required" });
    }

    const license = await getLicenseByKey(license_key);

    if (!license) {
      return NextResponse.json({ valid: false, reason: "Invalid license key" });
    }

    if (license.status !== "active") {
      return NextResponse.json({ valid: false, reason: `License is ${license.status}` });
    }

    // Check if license is tied to this game_id (if game_id is provided and not 'default' in license)
    if (license.game_id !== "default" && game_id && license.game_id !== String(game_id)) {
      return NextResponse.json({ valid: false, reason: "License is tied to another Game ID" });
    }

    // Check expiration
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, reason: "License has expired" });
    }

    return NextResponse.json({
      valid: true,
      license_key: license.license_key,
      owner: String(license.user_id),
      expires_at: license.expires_at,
    });
  } catch (err: any) {
    return NextResponse.json({ valid: false, reason: "Server error" }, { status: 500 });
  }
}
