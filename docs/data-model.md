# Data model

## MQTT

- **Topic:** `electricity/<meter_id>/reading`
- **QoS:** 0
- **Payload:** JSON

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

| Field | Type | Unit | Notes |
|---|---|---|---|
| `meter_id` | string | — | Identifier of the source meter. |
| `ts` | integer | ms since epoch | Optional; Node-RED stamps it if missing. |
| `voltage_v` | number | volts | RMS voltage. |
| `current_a` | number | amps | RMS current. |
| `power_w` | number | watts | Active power. |
| `energy_kwh` | number | kilowatt-hours | Cumulative meter reading. |

## SQLite

Database file: `data/electricity.db`.

### `readings`

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `meter_id` | TEXT | |
| `ts` | INTEGER | epoch ms |
| `voltage_v` | REAL | V |
| `current_a` | REAL | A |
| `power_w` | REAL | W |
| `energy_kwh` | REAL | kWh |

Index: `idx_readings_meter_ts (meter_id, ts)`.

### `alerts`

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `meter_id` | TEXT | |
| `ts` | INTEGER | epoch ms |
| `metric` | TEXT | `voltage_v` \| `current_a` \| `power_w` |
| `value` | REAL | observed value |
| `threshold` | REAL | breached bound |
| `message` | TEXT | human-readable summary |

## Thresholds

Defined inline in the `threshold check` function node in the flow. Reference copy at
`config/thresholds.json`:

```json
{
  "voltage_v": { "min": 210, "max": 250 },
  "current_a": { "min": 0,   "max": 30  },
  "power_w":   { "min": 0,   "max": 6000 }
}
```
