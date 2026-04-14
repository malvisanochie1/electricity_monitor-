"""Fake smart meter that publishes electricity readings to MQTT.

Publishes every 2 seconds to topic:  electricity/<meter_id>/reading
Payload (JSON):
    {
        "meter_id":   "meter-01",
        "ts":         1713100000000,
        "voltage_v":  230.4,
        "current_a":  12.1,
        "power_w":    2787.8,
        "energy_kwh": 15.342
    }

Requires:  pip install paho-mqtt
Run:       python scripts/simulator.py --broker localhost --meter meter-01
"""

import argparse
import json
import random
import time

import paho.mqtt.client as mqtt


def build_reading(meter_id: str, energy_kwh: float) -> dict:
    voltage = round(random.gauss(230, 4), 2)
    current = round(max(0.0, random.gauss(12, 3)), 2)
    power = round(voltage * current, 2)
    return {
        "meter_id": meter_id,
        "ts": int(time.time() * 1000),
        "voltage_v": voltage,
        "current_a": current,
        "power_w": power,
        "energy_kwh": round(energy_kwh, 4),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--broker", default="localhost")
    parser.add_argument("--port", type=int, default=1883)
    parser.add_argument("--meter", default="meter-01")
    parser.add_argument("--interval", type=float, default=2.0)
    parser.add_argument("--spike-every", type=int, default=20,
                        help="Inject a threshold-breaching spike every N messages (0 to disable).")
    args = parser.parse_args()

    client = mqtt.Client()
    client.connect(args.broker, args.port, 60)
    client.loop_start()
    topic = f"electricity/{args.meter}/reading"
    print(f"publishing to {topic} @ {args.broker}:{args.port}")

    energy_kwh = 0.0
    count = 0
    try:
        while True:
            reading = build_reading(args.meter, energy_kwh)
            if args.spike_every and count and count % args.spike_every == 0:
                reading["current_a"] = 45.0
                reading["power_w"] = round(reading["voltage_v"] * 45.0, 2)
            energy_kwh += reading["power_w"] * args.interval / 3_600_000.0
            client.publish(topic, json.dumps(reading), qos=0)
            print(reading)
            count += 1
            time.sleep(args.interval)
    except KeyboardInterrupt:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
