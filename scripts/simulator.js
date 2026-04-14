/**
 * Fake smart meter that publishes electricity readings to MQTT.
 * Node.js version of scripts/simulator.py, for environments without Python.
 *
 * Usage:
 *     node scripts/simulator.js [--broker localhost] [--meter meter-01]
 *
 * Publishes every 2 seconds to topic:  electricity/<meter_id>/reading
 */
const mqtt = require("mqtt");

const argv = Object.fromEntries(
    process.argv.slice(2).reduce((acc, tok, i, a) => {
        if (tok.startsWith("--")) acc.push([tok.slice(2), a[i + 1]]);
        return acc;
    }, [])
);

const BROKER      = argv.broker   || "localhost";
const PORT        = parseInt(argv.port || "1883", 10);
const METER_ID    = argv.meter    || "meter-01";
const INTERVAL_MS = parseFloat(argv.interval || "2") * 1000;
const SPIKE_EVERY = parseInt(argv["spike-every"] || "20", 10);

function gauss(mean, sd) {
    // Box-Muller
    const u = 1 - Math.random(), v = 1 - Math.random();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const client = mqtt.connect(`mqtt://${BROKER}:${PORT}`);
const topic  = `electricity/${METER_ID}/reading`;

client.on("connect", () => {
    console.log(`publishing to ${topic} @ ${BROKER}:${PORT}`);
    let count = 0;
    let energy_kwh = 0;
    setInterval(() => {
        const voltage = +gauss(230, 4).toFixed(2);
        let   current = +Math.max(0, gauss(12, 3)).toFixed(2);
        if (SPIKE_EVERY && count && count % SPIKE_EVERY === 0) current = 45.0;
        const power   = +(voltage * current).toFixed(2);
        energy_kwh   += power * (INTERVAL_MS / 1000) / 3_600_000;
        const reading = {
            meter_id:   METER_ID,
            ts:         Date.now(),
            voltage_v:  voltage,
            current_a:  current,
            power_w:    power,
            energy_kwh: +energy_kwh.toFixed(4)
        };
        client.publish(topic, JSON.stringify(reading));
        console.log(reading);
        count++;
    }, INTERVAL_MS);
});

client.on("error", (e) => console.error("mqtt error:", e.message));
