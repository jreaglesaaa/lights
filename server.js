const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const { TuyaContext } = require("@tuya/tuya-connector-nodejs");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

/* ===== TUYA ===== */
const tuya = new TuyaContext({
  baseUrl: "https://openapi.tuyaus.com",
  accessKey: "95gk8g3nekeu87nney58",
  secretKey: "db68aff004494229be673342ceaf0ed7"
});
const TUYA_DEVICE_ID = "eb623898baadaac34bloq9";

/* ===== KASA BRIDGE ===== */
const KASA_BRIDGE = "https://path-found-particle-wilderness.trycloudflare.com";

/* ===== TOGGLE BOTH ===== */
app.post("/toggle", async (req, res) => {
  const { state } = req.body;

  try {
    console.log(`🔘 Toggle requested: ${state ? "ON" : "OFF"}`);

    /* ---- TUYA ---- */
    await tuya.request({
      path: `/v1.0/iot-03/devices/${TUYA_DEVICE_ID}/commands`,
      method: "POST",
      body: {
        commands: [
          { code: "switch_1", value: state },
          { code: "switch_2", value: state }
        ]
      }
    });

    /* ---- KASA (FORWARDED TO BRIDGE) ---- */
    await fetch(`${KASA_BRIDGE}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state })
    });

    console.log("✅ Tuya + Kasa commands sent");
    res.json({ success: true });

  } catch (e) {
    console.error("❌ Toggle error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

/* ===== STATUS CHECK ===== */
app.get("/status", async (req, res) => {
  try {
    /* ---- TUYA STATUS ---- */
    const tuyaStatus = await tuya.request({
      path: `/v1.0/iot-03/devices/${TUYA_DEVICE_ID}/status`,
      method: "GET"
    });

    const tuya1 = tuyaStatus.result.find(s => s.code === "switch_1")?.value;
    const tuya2 = tuyaStatus.result.find(s => s.code === "switch_2")?.value;

    /* ---- KASA STATUS (FROM BRIDGE) ---- */
    const kasaRes = await fetch(`${KASA_BRIDGE}/status`);
    const kasaStatus = await kasaRes.json();

    console.log("📡 Status:");
    console.log("   Tuya:", tuya1, tuya2);
    console.log("   Kasa:", kasaStatus);

    res.json({
      tuya1,
      tuya2,
      kasa: kasaStatus
    });

  } catch (e) {
    console.error("❌ Status error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

/* ===== ROOT ===== */
app.get("/", (req, res) => {
  res.send("🌉 Master Bridge Online");
});

app.listen(4000, () =>
  console.log("🚀 Master bridge running on http://localhost:4000")
);
