"use strict";

const POLL_MS = 3000;
const CURRENCY = "$";
let chart;

function fmt(num, digits) {
    if (num === null || num === undefined || Number.isNaN(num)) return "—";
    return Number(num).toFixed(digits);
}
function money(num) {
    if (num === null || num === undefined || Number.isNaN(num)) return "—";
    return CURRENCY + Number(num).toFixed(2);
}
function ago(ts) {
    if (!ts) return "waiting for data…";
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 5)   return "updated just now";
    if (s < 60)  return `updated ${s} s ago`;
    if (s < 3600) return `updated ${Math.round(s / 60)} min ago`;
    return `updated ${new Date(ts).toLocaleString()}`;
}

async function getJSON(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(url + " → " + res.status);
    return res.json();
}

function renderSummary(s) {
    document.getElementById("card-power").textContent = fmt(s.current?.power_w, 0);
    document.getElementById("card-updated").textContent = ago(s.current?.ts);

    document.getElementById("card-today").textContent = fmt(s.today_kwh, 2);
    document.getElementById("card-week").textContent  = fmt(s.week_kwh,  2);
    document.getElementById("card-month").textContent = fmt(s.month_kwh, 2);

    document.getElementById("card-today-cost").textContent = money(s.today_cost);
    document.getElementById("card-week-cost").textContent  = money(s.week_cost);
    document.getElementById("card-month-cost").textContent = money(s.month_cost);

    const alertSummary = document.getElementById("alert-summary");
    alertSummary.textContent = s.alert_count_24h
        ? `${s.alert_count_24h} alert(s) in the last 24 hours`
        : "no alerts in the last 24 hours";
}

function renderTrend(points) {
    const labels = points.map(p => new Date(p.ts).toLocaleTimeString());
    const values = points.map(p => p.power_w);
    if (!chart) {
        const ctx = document.getElementById("trend").getContext("2d");
        chart = new Chart(ctx, {
            type: "line",
            data: { labels, datasets: [{
                label: "Power (W)",
                data: values,
                borderColor: "#0c8ce9",
                backgroundColor: "rgba(12,140,233,.12)",
                fill: true,
                tension: 0.25,
                pointRadius: 0,
                borderWidth: 2
            }]},
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { maxTicksLimit: 6 }, grid: { display: false } },
                    y: { beginAtZero: true, ticks: { callback: v => v + " W" } }
                }
            }
        });
    } else {
        chart.data.labels = labels;
        chart.data.datasets[0].data = values;
        chart.update("none");
    }
}

function renderAlerts(items) {
    const ul = document.getElementById("alerts");
    ul.innerHTML = "";
    if (!items.length) {
        const li = document.createElement("li");
        li.className = "empty";
        li.textContent = "All clear — no excessive consumption detected.";
        ul.appendChild(li);
        return;
    }
    for (const a of items) {
        const li = document.createElement("li");
        const t = document.createElement("span");
        t.className = "t";
        t.textContent = new Date(a.ts).toLocaleString();
        li.appendChild(t);
        li.appendChild(document.createTextNode(a.message));
        ul.appendChild(li);
    }
}

async function tick() {
    try {
        const [summary, trend, alerts] = await Promise.all([
            getJSON("/api/summary"),
            getJSON("/api/trend?hours=1"),
            getJSON("/api/alerts?limit=10")
        ]);
        renderSummary(summary);
        renderTrend(trend);
        renderAlerts(alerts);
    } catch (err) {
        console.error(err);
        document.getElementById("card-updated").textContent =
            "cannot reach the monitor — is Node-RED running?";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    tick();
    setInterval(tick, POLL_MS);
});
