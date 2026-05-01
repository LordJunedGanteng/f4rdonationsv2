const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// ── Payload normalization ─────────────────────────────────────────────────────

function extractDonor(body) {
  return (
    body.donator_name ||
    body.donatorName ||
    body.donor_name ||
    body.name ||
    body.supporter_name ||
    body.username ||
    "Anonymous"
  );
}

function extractAmount(body) {
  if (body.amount != null) return Number(body.amount);
  if (body.total != null) return Number(body.total);
  if (body.unit_value != null && body.quantity != null)
    return Number(body.unit_value) * Number(body.quantity);
  return 0;
}

function extractMessage(body) {
  return body.message || body.msg || body.supporter_message || body.comment || body.note || "";
}

function extractCurrency(body) {
  return body.currency || "IDR";
}

// ── KV helpers (Upstash/Vercel KV REST) ───────────────────────────────────────

async function kvPipeline(env, commands) {
  const res = await fetch(`${env.KV_REST_API_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`KV pipeline error ${res.status}`);
  return res.json();
}

async function kvCommand(env, command) {
  const res = await fetch(env.KV_REST_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`KV error ${res.status}`);
  const data = await res.json();
  return data.result;
}

// ── Webhook handler ───────────────────────────────────────────────────────────

async function handleWebhook(request, env, gameId, platform) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const donorName = extractDonor(body);
  const amount = extractAmount(body);
  const message = extractMessage(body);
  const currency = extractCurrency(body);

  if (!donorName || amount <= 0) {
    return json({ ok: false, error: "Invalid donation: missing donor or amount <= 0" }, 400);
  }

  const donation = {
    donation_id: body.donation_id || body.id || body.tr_id || crypto.randomUUID(),
    donor_name: donorName,
    amount,
    currency,
    message,
    platform,
    timestamp: new Date().toISOString(),
  };

  console.log(`[${gameId}] Webhook [${platform}]: ${donorName} - ${currency} ${amount}`);

  try {
    const entry = JSON.stringify(donation);
    await kvPipeline(env, [
      ["LPUSH", `game:${gameId}:pending`, entry],
      ["LTRIM", `game:${gameId}:pending`, "0", "99"],
      ["LPUSH", `game:${gameId}:history`, entry],
      ["LTRIM", `game:${gameId}:history`, "0", "499"],
      ["INCRBY", `game:${gameId}:total`, String(amount)],
      ["INCR", `game:${gameId}:count`],
    ]);
  } catch (err) {
    console.error("KV store error:", err);
    return json({ ok: false, error: "Failed to store donation" }, 500);
  }

  return json({ ok: true, donation_id: donation.donation_id });
}

// ── Polling endpoint (Roblox HttpService calls this) ──────────────────────────

async function handlePending(request, env) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (!secret) {
    return json({ ok: false, error: "Missing secret" }, 401);
  }

  const gameId = await kvCommand(env, ["GET", `secret:${secret}`]);
  if (!gameId) {
    return json({ ok: false, error: "Invalid secret" }, 401);
  }

  const pending = await kvCommand(env, ["LRANGE", `game:${gameId}:pending`, "0", "-1"]);

  if (!pending || pending.length === 0) {
    return json({ ok: true, donations: [] });
  }

  await kvCommand(env, ["DEL", `game:${gameId}:pending`]);

  const donations = pending.map((entry) => JSON.parse(entry));

  return json({ ok: true, donations });
}

// ── Health ────────────────────────────────────────────────────────────────────

async function handleHealth() {
  return json({ ok: true, service: "donation-bridge", ts: Date.now() });
}

// ── Router ────────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/health" && request.method === "GET") {
      return handleHealth();
    }

    if (path === "/api/pending" && request.method === "GET") {
      return handlePending(request, env);
    }

    if (request.method === "POST") {
      // /webhook/{gameId}/{platform}  e.g. /webhook/h3Xr1G2B/saweria
      const webhookMatch = path.match(/^\/webhook\/([^/]+)\/([^/]+)$/);
      if (webhookMatch) {
        const [, gameId, platform] = webhookMatch;
        return handleWebhook(request, env, gameId, platform);
      }

      // /webhook/{gameId}  (auto-detect platform from payload)
      const webhookSimple = path.match(/^\/webhook\/([^/]+)$/);
      if (webhookSimple) {
        const [, gameId] = webhookSimple;
        return handleWebhook(request, env, gameId, "auto");
      }
    }

    return json({ ok: false, error: "Not found" }, 404);
  },
};
