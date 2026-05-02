import { NextResponse } from "next/server";
import { kvGet } from "@/lib/kv";

const CF_WORKER_URL = process.env.NEXT_PUBLIC_CF_WORKER_URL || "";
const PLATFORMS = ["saweria", "socialbuzz", "bagibagi", "trakteer"];

export async function GET() {
  const configs = await Promise.all(
    PLATFORMS.map(async (platform) => {
      const raw = await kvGet(`platform:${platform}`);
      const stored = raw ? JSON.parse(raw) : {};
      return {
        platform,
        has_api_key: !!stored.api_key,
        webhook_secret: stored.webhook_secret || null,
        webhook_url: stored.webhook_secret
          ? `${CF_WORKER_URL}/webhook/${platform}`
          : null,
        is_active: stored.is_active ?? false,
        last_verified_at: stored.last_verified_at || null,
        platform_api_key: stored.platform_api_key || null,
      };
    })
  );

  return NextResponse.json({ configs });
}
