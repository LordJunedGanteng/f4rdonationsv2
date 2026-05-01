# f4r Donation Bridge

Donation bridge platform — menerima webhook dari Saweria/Socialbuzz/BagiBagi dan forward ke Roblox via polling (HttpService).

## Architecture

```
[Saweria/Socialbuzz/BagiBagi]
         ↓ webhook POST
[CF Worker] donation-bridge.ulkatobganteng.workers.dev
    1. Validate & normalize payload
    2. Store donation di Vercel KV (per game)
         ↓
    [Vercel KV]
         ↑ poll every 5s
[Roblox HttpService] → GET /api/pending?secret={secret}
    → Terima donasi baru
    → Tampilkan di game
```

## Setup

### 1. Vercel KV

1. Buka Vercel Dashboard → project → Storage → Create KV Store
2. Copy `KV_REST_API_URL` dan `KV_REST_API_TOKEN`

### 2. Environment Variables — Vercel

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL deployment Vercel |
| `NEXT_PUBLIC_CF_WORKER_URL` | `https://donation-bridge.ulkatobganteng.workers.dev` |
| `KV_REST_API_URL` | Dari Vercel KV dashboard |
| `KV_REST_API_TOKEN` | Dari Vercel KV dashboard |
| `ADMIN_USERNAME` | Username login admin |
| `ADMIN_PASSWORD` | Password login admin |

### 3. Deploy CF Worker

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put KV_REST_API_URL
npx wrangler secret put KV_REST_API_TOKEN
npx wrangler deploy
```

### 4. Deploy Next.js

```bash
npm install
vercel deploy --prod
```

### 5. Tambah Game di Dashboard

1. Login ke dashboard
2. Buat game baru (isi Game Name, Roblox Game ID, Saweria Username)
3. Copy **Secret Key** dan **Webhook URL**
4. Paste Webhook URL di settings Saweria

### 6. Roblox Script (HttpService Polling)

Buat Script di ServerScriptService:

```lua
local HttpService = game:GetService("HttpService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local WORKER_URL = "https://donation-bridge.ulkatobganteng.workers.dev"
local SECRET_KEY = "YOUR_SECRET_KEY_HERE" -- dari dashboard
local POLL_INTERVAL = 5

local DonationEvent = Instance.new("RemoteEvent")
DonationEvent.Name = "DonationReceived"
DonationEvent.Parent = ReplicatedStorage

while true do
    local success, result = pcall(function()
        local response = HttpService:GetAsync(
            WORKER_URL .. "/api/pending?secret=" .. SECRET_KEY
        )
        return HttpService:JSONDecode(response)
    end)

    if success and result.ok and result.donations then
        for _, donation in ipairs(result.donations) do
            print("[Donation]", donation.donor_name, "Rp" .. donation.amount)
            for _, player in ipairs(game.Players:GetPlayers()) do
                DonationEvent:FireClient(player, donation)
            end
        end
    end

    task.wait(POLL_INTERVAL)
end
```

## API Endpoints

### CF Worker
| Method | Path | Description |
|---|---|---|
| `POST` | `/webhook/{gameId}/{platform}` | Terima webhook dari platform |
| `GET` | `/api/pending?secret={key}` | Ambil donasi pending (Roblox poll) |
| `GET` | `/health` | Health check |

### Next.js API
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/games` | List semua game |
| `POST` | `/api/games` | Buat game baru |
| `GET` | `/api/games/{id}` | Detail game + donasi |
| `PUT` | `/api/games/{id}` | Update game |
| `DELETE` | `/api/games/{id}` | Hapus game |
| `GET` | `/api/donations/recent?game_id={id}` | Donasi terbaru |
| `GET` | `/api/donations/stats?game_id={id}` | Stats donasi |
| `GET` | `/api/leaderboard/{timeframe}?game_id={id}` | Leaderboard |

## Testing

```bash
# Health check
curl https://donation-bridge.ulkatobganteng.workers.dev/health

# Fake webhook (ganti GAME_ID)
curl -X POST https://donation-bridge.ulkatobganteng.workers.dev/webhook/GAME_ID/saweria \
  -H "Content-Type: application/json" \
  -d '{"donor_name":"TestUser","amount":10000,"message":"Test donasi"}'

# Poll pending (ganti SECRET)
curl "https://donation-bridge.ulkatobganteng.workers.dev/api/pending?secret=SECRET"
```
