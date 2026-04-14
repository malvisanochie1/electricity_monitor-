# User guide

The project has two interfaces. Use the first for everyday monitoring and
the second for configuration or demonstrations.

## The user dashboard — <http://localhost:1880/>

This is the default page. It refreshes automatically every few seconds.

- **Right now** — the current power draw in watts, with "updated X s ago".
- **Today / This week / This month** — total kWh consumed in the window and
  the estimated cost at the configured tariff.
- **Power use over the last hour** — a trend chart so you can spot spikes
  and quiet periods at a glance.
- **Recent high-usage alerts** — friendly messages whenever voltage, current,
  or power leaves the safe range. "All clear" when nothing is wrong.

The page is intentionally simple — no technical jargon, no flow diagrams,
no raw database fields. It is the one screen you show non-technical users.

## The system control panel — <http://localhost:1880/backend>

This is the Node-RED editor. Everything technical lives here:

- The flow that receives, validates, stores, and alerts on readings.
- The `threshold check` function node — edit to change alert bounds.
- The `shape summary` function node — edit to change the electricity
  tariff used by the cost estimates on the user dashboard.
- Deploy button to apply changes.

## The technical dashboard — <http://localhost:1880/backend/ui>

The original Node-RED Dashboard view: live gauges for voltage / current /
power, a second trend chart, and red toast notifications when an alert
fires. Useful for demos and for verifying data end-to-end.

## Querying the database

```
sqlite3 data/electricity.db
```

```sql
-- last hour of readings for one meter
SELECT datetime(ts/1000,'unixepoch','localtime') AS t, voltage_v, current_a, power_w
FROM   readings
WHERE  meter_id = 'meter-01'
  AND  ts > (strftime('%s','now') - 3600) * 1000
ORDER  BY ts DESC;

-- daily kWh consumed (difference between first and last energy_kwh of the day)
SELECT date(ts/1000,'unixepoch','localtime') AS day,
       MAX(energy_kwh) - MIN(energy_kwh)     AS kwh_used
FROM   readings
WHERE  meter_id = 'meter-01'
GROUP  BY day
ORDER  BY day DESC;

-- recent alerts
SELECT datetime(ts/1000,'unixepoch','localtime') AS t, metric, value, threshold, message
FROM   alerts
ORDER  BY id DESC
LIMIT  20;
```

## Adding a real meter

Any device that can publish JSON to MQTT works. Configure it to publish to
`electricity/<your-meter-id>/reading` with the payload shape documented in
`docs/data-model.md`. Common options:

- **Shelly EM / Shelly Plug S** — enable MQTT in the device settings and map
  its power/voltage fields into the expected JSON with a Node-RED `change`
  node if needed.
- **ESP32 + PZEM-004T** — write an Arduino sketch that reads the PZEM and
  publishes JSON.

## Adding more meters

No code change needed — the flow subscribes to `electricity/+/reading` and
partitions by `meter_id` in the database. Start a second simulator:

```
python scripts/simulator.py --meter meter-02
```

## For project defense

Open three tabs before you start:

1. `/` — lead with this. Explain "This is what the homeowner sees."
2. `/backend/ui` — show the technical dashboard with live gauges and the
   red toast when an alert fires.
3. `/backend` — open the flow and walk through the wires: MQTT in → validate
   → SQLite → dashboard + API + alerts. One sentence per node.

The point is that the *product* (`/`) hides the *implementation* (`/backend`),
which is exactly the separation of concerns the design is meant to show.
