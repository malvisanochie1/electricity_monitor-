/**
 * Node-RED settings for the Electricity Usage Monitoring System.
 *
 * Route layout (kept non-overlapping so admin assets never collide with
 * the static frontend, which previously caused /backend/*.js to fall
 * through the public/ static middleware and return HTML 404s):
 *
 *   /              302 redirect -> /app/
 *   /app/*         user-facing landing dashboard (static files from ../public)
 *   /api/*         JSON API consumed by the landing page (defined in the flow)
 *   /backend       Node-RED flow editor (admin) — owns this subtree exclusively
 *   /backend/ui    technical Node-RED Dashboard
 */

const path = require("path");

module.exports = {
    uiPort: process.env.PORT || 1880,
    flowFile: "flows.json",
    flowFilePretty: true,

    // Load palette nodes (node-red-dashboard) from the root node_modules so
    // the deployment works without installing them into the userDir.
    nodesDir: [path.join(__dirname, "..", "node_modules")],

    // Defensive: if a cached Render build still has node-red-node-sqlite
    // lying around in node_modules, do not attempt to load it. The flow no
    // longer uses SQLite; blocking the module prevents the editor from
    // hanging on "Loading Nodes" while a failing native addon times out.
    nodesExcludes: ["node-red-node-sqlite"],

    // Admin editor lives under /backend instead of /.
    httpAdminRoot: "/backend",

    // HTTP-in / HTTP-response nodes (the JSON API) stay at the root.
    httpNodeRoot: "/",

    // Static user-facing site is mounted at /app so it cannot shadow
    // /backend admin assets. Array form pins the URL prefix explicitly.
    httpStatic: [
        { path: path.join(__dirname, "..", "public"), root: "/app" }
    ],

    // Redirect bare "/" to the frontend so the root URL still works.
    // Runs for any httpNode (flow-defined) request; only "/" is rewritten.
    httpNodeMiddleware: function (req, res, next) {
        if (req.path === "/" || req.path === "") {
            return res.redirect(302, "/app/");
        }
        next();
    },

    // Technical Node-RED Dashboard moves under /backend/ui.
    ui: { path: "/backend/ui" },

    // Minimal logging for a beginner-friendly demo.
    logging: {
        console: { level: "info", metrics: false, audit: false }
    },

    // Keep the editor usable while unauthenticated on localhost.
    // Add adminAuth here before exposing beyond your machine.
    editorTheme: {
        page:    { title: "Electricity Monitor — System Control" },
        header:  { title: "Electricity Monitor — System Control" },
        projects: { enabled: false }
    },

    functionGlobalContext: {},
    exportGlobalContextKeys: false
};
