# Electricity Usage Monitoring System

A small IoT system that monitors home electricity usage, flags inefficient
or excessive consumption, and helps the user understand where power is
being wasted.

Readings flow from a simulated smart meter over MQTT into Node-RED, which
holds them in memory, shows them on a mobile-friendly dashboard, and
raises alerts when voltage, current, or power go outside safe bounds.

## What the user sees

| Route | Who it is for | What it shows |
|---|---|---|
| **`/`** | End user (mobile-friendly) | Redirects to `/app/` |
| **`/app/`** | End user | Current power use, today / this week / this month kWh, estimated cost, hourly trend, recent high-usage alerts |
| **`/backend/ui`** | Technical dashboard | Live gauges for voltage / current / power and a toast pop-up for every threshold breach |
| **`/backend`** | Developer / examiner | Node-RED flow editor — best on a desktop browser |

## Run it

```bash
npm install
node server.js
```

Then open <http://localhost:1880/>.

`server.js` starts three things in one process:

1. An embedded MQTT broker (aedes) bound to `127.0.0.1:1883`.
2. Node-RED on `$PORT` (default 1880), which ingests readings, keeps them
   in memory, and serves the frontend + API + dashboards.
3. A fake smart meter (`scripts/simulator.js`) that publishes a reading
   every 2 seconds, with an occasional current spike so the alert path is
   visible.

No database, no native modules, no external services.

## How it helps reduce power waste

- The **Right now** card shows current draw in watts, so the user can see
  the instant impact of switching an appliance on or off.
- **Today / This week / This month** totals and estimated cost make
  cumulative consumption visible.
- The **hourly trend** chart exposes usage patterns — flat baselines,
  idle-state drift, and spikes that the user can investigate.
- **High-usage alerts** trigger when voltage, current, or power leave the
  configured safe range, calling attention to inefficient or excessive
  consumption.

## MQTT contract

Publish JSON to `electricity/<meter_id>/reading`:

```json
{
  "meter_id":   "meter-01",
  "ts":         1713100000000,
  "voltage_v":  230.4,
  "current_a":  12.1,
  "power_w":    2787.8,
  "energy_kwh": 15.342
}
```

## JSON API (used by `/app/`)

| Endpoint | Returns |
|---|---|
| `GET /api/summary` | Current reading + today / week / month kWh + costs + 24 h alert count |
| `GET /api/trend?hours=1` | Array of recent readings, downsampled to ≤ 120 points |
| `GET /api/alerts?limit=10` | Most recent threshold alerts |

## Thresholds

Hard-coded in the flow's `threshold check` function:

| Metric | Min | Max |
|---|---|---|
| Voltage (V) | 210 | 250 |
| Current (A) | 0 | 30 |
| Power (W) | 0 | 6000 |

## Deployment

The repo runs unchanged on Render.com (free tier). All state is in memory
— a redeploy or idle restart clears readings and alerts; this is a
deliberate tradeoff to avoid native SQLite on a constrained host.

## Project structure

```
├── server.js                         single process entrypoint
├── config/settings.js                Node-RED route + middleware config
├── flows/electricity-monitor.json    Node-RED flow (ingest, store, alert, API)
├── scripts/simulator.js              fake smart meter
├── public/                           /app/ landing page (HTML + CSS + JS)
├── Dockerfile                        Render-compatible image
├── package.json                      aedes, mqtt, node-red, node-red-dashboard
└── README.md
```
