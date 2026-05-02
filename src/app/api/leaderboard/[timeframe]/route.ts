import { NextRequest, NextResponse } from "next/server";
import { getGameDonations } from "@/lib/kv";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ timeframe: string }> }
) {
  const { timeframe } = await params;
  const gameId = request.nextUrl.searchParams.get("game_id");

  if (!gameId) {
    return NextResponse.json({ leaderboard: [] });
  }

  try {
    const donations = await getGameDonations(gameId, 500);

    const now = new Date();
    let cutoff: Date;
    if (timeframe === "week") {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === "month") {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      cutoff = new Date(0);
    }

    const filtered = donations.filter((d) => new Date(d.timestamp) >= cutoff);

    const donors: Record<string, { total: number; count: number; platform: string }> = {};
    for (const d of filtered) {
      if (!donors[d.donor_name]) {
        donors[d.donor_name] = { total: 0, count: 0, platform: d.platform };
      }
      donors[d.donor_name].total += d.amount;
      donors[d.donor_name].count += 1;
    }

    const leaderboard = Object.entries(donors)
      .map(([name, v]) => ({
        donor_name: name,
        platform: v.platform,
        total_amount: v.total,
        donation_count: v.count,
      }))
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 20)
      .map((entry, i) => ({ rank: i + 1, ...entry }));

    return NextResponse.json({ leaderboard });
  } catch (err) {
    console.error("Failed to fetch leaderboard:", err);
    return NextResponse.json({ leaderboard: [] });
  }
}
