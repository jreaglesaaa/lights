const express = require("express");
const bodyParser = require("body-parser");
const { TuyaContext } = require("@tuya/tuya-connector-nodejs");
const { Client } = require("tplink-smarthome-api");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

/* ===== TUYA CONFIG ===== */
const tuya = new TuyaContext({
  baseUrl: "https://openapi.tuyaus.com",
  accessKey: "95gk8g3nekeu87nney58",
  secretKey: "db68aff004494229be673342ceaf0ed7"
});
const TUYA_DEVICE_ID = "eb623898baadaac34bloq9";

/* ===== KASA CONFIG ===== */
const kasa = new Client();
const KASA_IP = "192.168.1.181";

/* ===== TOGGLE BOTH ===== */
app.post("/toggle", async (req, res) => {
  const { state } = req.body;

  try {
    // TUYA
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

    // KASA
    const device = await kasa.getDevice({ host: KASA_IP });
    await device.setPowerState(state);

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(4000, () =>
  console.log("Server running on http://localhost:4000")
);
