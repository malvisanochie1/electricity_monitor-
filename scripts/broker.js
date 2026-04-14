/**
 * Tiny embedded MQTT broker (aedes). Use this if you don't want to install
 * Mosquitto. Run from the repo root:
 *
 *     node scripts/broker.js
 *
 * Listens on tcp://localhost:1883.
 */
const aedes = require("aedes")();
const net = require("net");

const PORT = 1883;
const server = net.createServer(aedes.handle);

server.listen(PORT, () => {
    console.log(`MQTT broker listening on tcp://localhost:${PORT}`);
});

aedes.on("client",           (c) => console.log("client connected:",    c.id));
aedes.on("clientDisconnect", (c) => console.log("client disconnected:", c.id));
aedes.on("publish", (packet, client) => {
    if (client) console.log(`  ${client.id} -> ${packet.topic}`);
});
