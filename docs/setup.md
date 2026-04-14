# Setup

## 1. Install Node.js and Node-RED

```
# Node.js 18+ from https://nodejs.org
npm install -g --unsafe-perm node-red
```

Verify: `node-red --version`.

## 2. Install an MQTT broker

**Windows:** download Mosquitto from <https://mosquitto.org/download/> and run `mosquitto -v`.
**macOS:** `brew install mosquitto && brew services start mosquitto`.
**Linux:** `sudo apt install mosquitto && sudo systemctl start mosquitto`.

Check that it is listening on `localhost:1883`.

## 3. Start Node-RED with this project's settings

From the repo root:

```
node-red --settings ./config/settings.js --userDir ./.node-red
```

The `--settings` flag is important — it wires up the route split
(`/` for the user page, `/backend` for the editor, `/backend/ui` for the
technical dashboard).

## 4. Install palettes (first time only)

Open <http://localhost:1880/backend>, top-right menu → *Manage palette →
Install*, and add:

- `node-red-dashboard`
- `node-red-node-sqlite`

## 5. Import the flow

Menu → *Import* → *select a file to import* → `flows/electricity-monitor.json`
→ *Deploy*. The first deploy fires the `Init schema` inject node, which
creates `data/electricity.db` and the `readings` + `alerts` tables.

## 6. Run the simulator (optional)

```
pip install paho-mqtt
python scripts/simulator.py --broker localhost --meter meter-01
```

## 7. Open the two interfaces

| URL | What it is |
|---|---|
| <http://localhost:1880/> | User dashboard |
| <http://localhost:1880/backend> | Node-RED flow editor |
| <http://localhost:1880/backend/ui> | Technical dashboard |

## Changing the tariff

Open the editor at `/backend`, double-click the `shape summary` function
node, edit the `TARIFF` constant, *Done → Deploy*.

## Changing thresholds

Open the editor, double-click the `threshold check` function node, edit the
`T` object, *Done → Deploy*.
