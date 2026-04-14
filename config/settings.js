/**
 * Node-RED settings for the Electricity Usage Monitoring System.
 *
 * Launch Node-RED with this file to get the correct route layout:
 *     node-red --settings ./config/settings.js --userDir ./.node-red
 *
 * Routes served by this configuration:
 *   /              user-facing landing dashboard (static files from ../public)
 *   /api/*         JSON API consumed by the landing page (defined in the flow)
 *   /backend       Node-RED flow editor (admin)
 *   /backend/ui    technical Node-RED Dashboard
 */

const path = require("path");

module.exports = {
    uiPort: process.env.PORT || 1880,
    flowFile: "flows.json",
    flowFilePretty: true,

    // Admin editor lives under /backend instead of /.
    httpAdminRoot: "/backend",

    // HTTP-in / HTTP-response nodes (the JSON API) stay at the root.
    httpNodeRoot: "/",

    // Static user-facing site, served at /.
    httpStatic: path.join(__dirname, "..", "public"),

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
