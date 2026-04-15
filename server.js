/**
 * Single-process entrypoint for cloud deployment (Render, Fly, etc.).
 * Starts three things inside one container:
 *   1) aedes MQTT broker on 127.0.0.1:1883 (internal only)
 *   2) Node-RED on process.env.PORT (the only externally exposed port)
 *   3) the fake smart-meter simulator, which publishes to the local broker
 *
 * Before Node-RED launches, this script bootstraps the userDir from the
 * committed flows/electricity-monitor.json so the deployment does not rely
 * on any gitignored local folder (.node-red/).
 */
const path   = require("path");
const fs     = require("fs");
const net    = require("net");
const aedes  = require("aedes")();
const { spawn } = require("child_process");

const MQTT_PORT = 1883;
const HTTP_PORT = process.env.PORT || 1880;

// 1) MQTT broker — bind to loopback so it's not reachable from the internet.
net.createServer(aedes.handle).listen(MQTT_PORT, "127.0.0.1", () => {
    console.log(`[broker]   tcp://127.0.0.1:${MQTT_PORT}`);
});
aedes.on("client",           (c) => console.log("[broker]   + " + c.id));
aedes.on("clientDisconnect", (c) => console.log("[broker]   - " + c.id));

// 2) Bootstrap the Node-RED userDir from the committed flow file.
const userDir = process.env.NODE_RED_USER_DIR
    || path.join(__dirname, "node-red-user");
const flowSrc  = path.join(__dirname, "flows", "electricity-monitor.json");
const flowDest = path.join(userDir, "flows.json");

fs.mkdirSync(userDir, { recursive: true });
fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });

// Always refresh from the committed source: git is the source of truth.
if (fs.existsSync(flowSrc)) {
    fs.copyFileSync(flowSrc, flowDest);
    console.log(`[bootstrap] wrote ${flowDest} from ${flowSrc}`);
} else {
    console.error(`[bootstrap] FATAL: ${flowSrc} missing — API routes will not register`);
    process.exit(1);
}

// 3) Node-RED — launched as a child process using the local install.
const nodeRedBin = path.join(
    __dirname, "node_modules", ".bin",
    process.platform === "win32" ? "node-red.cmd" : "node-red"
);

const nr = spawn(nodeRedBin, [
    "--settings", path.join(__dirname, "config", "settings.js"),
    "--userDir",  userDir
], { stdio: "inherit", env: { ...process.env, PORT: HTTP_PORT } });

nr.on("exit", (code) => {
    console.log(`[node-red] exited with code ${code}`);
    process.exit(code || 1);
});

// 4) Simulator — start after Node-RED has time to subscribe to the broker.
setTimeout(() => {
    const sim = spawn("node", [
        path.join(__dirname, "scripts", "simulator.js"),
        "--broker", "127.0.0.1",
        "--meter",  process.env.METER_ID || "meter-01"
    ], { stdio: "inherit" });
    sim.on("exit", (code) => console.log(`[simulator] exited with code ${code}`));
}, 10_000);

// Graceful shutdown so Render's stop signals propagate.
for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, () => { try { nr.kill(sig); } catch {} process.exit(0); });
}
