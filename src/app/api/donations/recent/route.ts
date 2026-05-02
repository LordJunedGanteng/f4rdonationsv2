import { NextRequest, NextResponse } from "next/server";
import { getGameDonations } from "@/lib/kv";

export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get("game_id");
  const limit = Number(request.nextUrl.searchParams.get("limit") || "10");

  if (!gameId) {
    return NextResponse.json({ donations: [] });
  }

  try {
    const donations = await getGameDonations(gameId, Math.min(limit, 100));
    return NextResponse.json({ donations });
  } catch (err) {
    console.error("Failed to fetch donations:", err);
    return NextResponse.json({ donations: [] });
  }
}
