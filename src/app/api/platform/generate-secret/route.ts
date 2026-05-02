import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/kv";

const CF_WORKER_URL = process.env.NEXT_PUBLIC_CF_WORKER_URL || "";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const platform = body.platform as string;

  if (!platform) {
    return NextResponse.json({ ok: false, error: "Missing platform" }, { status: 400 });
  }

  const secret = crypto.randomUUID();
  const webhookUrl = `${CF_WORKER_URL}/webhook/${platform}`;

  const raw = await kvGet(`platform:${platform}`);
  const stored = raw ? JSON.parse(raw) : {};
  stored.webhook_secret = secret;
  stored.platform_api_key = stored.platform_api_key || crypto.randomUUID().replace(/-/g, "");

  await kvSet(`platform:${platform}`, JSON.stringify(stored));

  return NextResponse.json({
    ok: true,
    webhook_secret: secret,
    webhook_url: webhookUrl,
  });
}
