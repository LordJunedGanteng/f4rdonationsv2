import { NextRequest, NextResponse } from "next/server";
import { getGameDonations, getGameStats } from "@/lib/kv";

export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get("game_id");

  if (!gameId) {
    return NextResponse.json({ totals: null, by_platform: [], by_day: [] });
  }

  try {
    const [{ count, total }, donations] = await Promise.all([
      getGameStats(gameId),
      getGameDonations(gameId, 500),
    ]);

    const uniqueDonors = new Set(donations.map((d) => d.donor_name)).size;

    const byPlatform: Record<string, { total: number; count: number }> = {};
    const byDay: Record<string, { total: number; count: number }> = {};

    for (const d of donations) {
      const p = d.platform || "unknown";
      if (!byPlatform[p]) byPlatform[p] = { total: 0, count: 0 };
      byPlatform[p].total += d.amount;
      byPlatform[p].count += 1;

      const day = d.timestamp.slice(0, 10);
      if (!byDay[day]) byDay[day] = { total: 0, count: 0 };
      byDay[day].total += d.amount;
      byDay[day].count += 1;
    }

    return NextResponse.json({
      totals: {
        count,
        total,
        avg: count > 0 ? Math.round(total / count) : 0,
        unique_donors: uniqueDonors,
      },
      by_platform: Object.entries(byPlatform).map(([platform, v]) => ({ platform, ...v })),
      by_day: Object.entries(byDay)
        .map(([day, v]) => ({ day, ...v }))
        .sort((a, b) => b.day.localeCompare(a.day)),
    });
  } catch (err) {
    console.error("Failed to fetch stats:", err);
    return NextResponse.json({ totals: null, by_platform: [], by_day: [] });
  }
}
