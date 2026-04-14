-- SQLite schema for the electricity monitoring system.
-- Created automatically by the Node-RED flow on first run, but kept here for reference.

CREATE TABLE IF NOT EXISTS readings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    meter_id    TEXT    NOT NULL,
    ts          INTEGER NOT NULL,          -- unix epoch milliseconds
    voltage_v   REAL    NOT NULL,
    current_a   REAL    NOT NULL,
    power_w     REAL    NOT NULL,
    energy_kwh  REAL    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_readings_meter_ts ON readings (meter_id, ts);

CREATE TABLE IF NOT EXISTS alerts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    meter_id    TEXT    NOT NULL,
    ts          INTEGER NOT NULL,
    metric      TEXT    NOT NULL,          -- 'voltage' | 'current' | 'power'
    value       REAL    NOT NULL,
    threshold   REAL    NOT NULL,
    message     TEXT    NOT NULL
);
