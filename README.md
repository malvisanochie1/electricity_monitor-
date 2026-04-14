# Electricity Usage Monitoring System

A single-purpose IoT system for measuring, storing, and visualizing home
electricity usage. Readings flow from a smart meter (or the included
simulator) over MQTT into Node-RED, which stores them in SQLite, shows
them on a clean web dashboard, and raises alerts when usage is out of range.

## Two interfaces, one product

| Route | For | What it shows |
|---|---|---|
| **`/`** | End users | Current power, today / week / month kWh, estimated cost, trend chart, recent alerts |
| **`/backend`** | Developers | Node-RED flow editor (ingestion, storage, thresholds) |
| **`/backend/ui`** | Developers | Technical dashboard with live gauges and toast alerts |

The user page is intentionally free of technical jargon. Everything
implementation-related lives under `/backend`.

## Folder structure

```
├── public/                        user landing page (HTML + CSS + JS)
├── flows/electricity-monitor.json the Node-RED flow
├── scripts/
│   ├── broker.js                  embedded MQTT broker (aedes)
│   ├── simulator.js               fake smart meter (Node.js)
│   └── simulator.py               same simulator in Python (optional)
├── config/
│   ├── settings.js                Node-RED route configuration
│   ├── schema.sql                 SQLite schema (reference)
│   └── thresholds.json            alert bounds (reference)
├── data/                          runtime SQLite db (gitignored)
├── docs/                          architecture, setup, data model, user guide
└── _archived_non_electricity/     original portfolio, kept for reference
```

## Prerequisites

- Node.js 18+ and Node-RED 4.x (`npm install -g node-red`)
- The first run in this repo already installed the required palettes
  (`node-red-dashboard`, `node-red-node-sqlite`), the MQTT broker (`aedes`),
  and the Node.js MQTT client — everything ships inside the repo.

## Run it

Open three terminals from the repo root:

```bash
# 1. MQTT broker
node scripts/broker.js

# 2. Node-RED (serves /, /backend, /backend/ui, and /api/*)
node-red --settings ./config/settings.js --userDir ./.node-red

# 3. Fake smart meter
node scripts/simulator.js --meter meter-01
```

Then open:

- User dashboard → <http://localhost:1880/>
- System control → <http://localhost:1880/backend>
- Technical dashboard → <http://localhost:1880/backend/ui>

## Verify it works

- The **Right now** card on `/` should update every few seconds.
- The hourly trend chart fills in; today / week / month kWh start climbing.
- Every ~40 s the simulator injects a 45 A current spike, producing a red
  entry under **Recent high-usage alerts**.

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

## JSON API (used by the landing page)

| Endpoint | Returns |
|---|---|
| `GET /api/summary` | Current reading + today / week / month kWh + costs + 24 h alert count |
| `GET /api/trend?hours=1` | Array of recent readings, downsampled to ≤ 120 points |
| `GET /api/alerts?limit=10` | Most recent threshold alerts |

## What was removed

Twenty-five unrelated portfolio projects (water monitoring, weather, railway,
login/registration, carbon footprint, Zapier, WhatsApp, OPC-UA, etc.) were
moved to `_archived_non_electricity/`. They are not part of the product.

## More docs

- [`docs/architecture.md`](docs/architecture.md) — components and routing
- [`docs/setup.md`](docs/setup.md) — first-time install on a fresh machine
- [`docs/data-model.md`](docs/data-model.md) — MQTT payload and SQLite schema
- [`docs/user-guide.md`](docs/user-guide.md) — walking through each screen
"# electricity_monitor-" 
