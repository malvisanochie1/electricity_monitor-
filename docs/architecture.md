# Architecture

The system has one process (Node-RED) that exposes two clearly separated
HTTP surfaces on the same port.

```
                       ┌───────────────────────────────┐
 smart meter ──MQTT──► │   Mosquitto (localhost:1883)  │
 or simulator          └───────────────┬───────────────┘
                                       │ subscribe electricity/+/reading
                                       ▼
          ┌──────────────────────────────────────────────────────┐
          │                 Node-RED (port 1880)                 │
          │                                                      │
          │   ingest ─► validate ─► SQLite (data/electricity.db) │
          │                      └► threshold check ─► alerts    │
          │                                                      │
          │   http in  GET /api/summary ─┐                       │
          │   http in  GET /api/trend    ├─► SQLite ─► JSON      │
          │   http in  GET /api/alerts ──┘                       │
          │                                                      │
          │   static  /       ─► public/ (HTML/CSS/JS)           │
          │   admin   /backend      ─► flow editor               │
          │   ui      /backend/ui   ─► technical dashboard       │
          └──────────────────────────────────────────────────────┘
                          │                    │
                          ▼                    ▼
               ┌────────────────────┐  ┌────────────────────┐
               │  End user at /     │  │ Developer at       │
               │  (landing page,    │  │ /backend and       │
               │   cost summaries,  │  │ /backend/ui        │
               │   trend chart)     │  │                    │
               └────────────────────┘  └────────────────────┘
```

## Route separation

Routing is configured in `config/settings.js`:

| Setting | Value | Effect |
|---|---|---|
| `httpStatic` | `../public` | Serves the user landing page at `/`. |
| `httpNodeRoot` | `/` | `/api/*` endpoints defined in the flow stay at the root. |
| `httpAdminRoot` | `/backend` | Node-RED editor moves from `/` to `/backend`. |
| `ui.path` | `/backend/ui` | Technical dashboard moves from `/ui` to `/backend/ui`. |

This means `/` is fully reserved for the user-facing product; everything
technical is namespaced under `/backend`.

## Components

| Component | Tech | Role |
|---|---|---|
| Meter / simulator | Python (`paho-mqtt`) or firmware | Produces readings |
| Broker | Mosquitto MQTT | Transport |
| Orchestration | Node-RED 4.x | Validate, store, compute summaries, alert |
| Storage | SQLite via `node-red-node-sqlite` | Persist readings and alerts |
| User dashboard | Vanilla HTML + Chart.js (CDN) | Simple, beginner-friendly view |
| Technical dashboard | `node-red-dashboard` | Gauges, raw numbers, toasts |

## JSON API (consumed by the landing page)

| Endpoint | Returns |
|---|---|
| `GET /api/summary` | `{ current, today_kwh, week_kwh, month_kwh, *_cost, tariff_per_kwh, alert_count_24h }` |
| `GET /api/trend?hours=1` | `[{ ts, voltage_v, current_a, power_w }, ...]` (downsampled to ≤120 points) |
| `GET /api/alerts?limit=10` | `[{ ts, metric, value, threshold, message }, ...]` |

## Design choices

- **Two interfaces, one process.** No separate Express app; the static page
  and API both ride on Node-RED. Keeps deployment one command.
- **SQLite, not MySQL/InfluxDB.** Single-file, zero-install, fine for one home.
- **Chart.js from CDN**, no build step — the landing page is just three files.
- **Tariff is inline** in the `shape summary` function node (default `$0.15/kWh`).
  Edit and redeploy to change.
