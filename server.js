const express = require('express');
const bodyParser = require('body-parser');
const { TuyaContext } = require('@tuya/tuya-connector-nodejs');
const fetch = require('node-fetch'); // For calling IFTTT webhooks

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// ===== CONFIG =====
const TUYA_CLIENT_ID = '95gk8g3nekeu87nney58';
const TUYA_CLIENT_SECRET = 'db68aff004494229be673342ceaf0ed7';
const TUYA_BASE_URL = 'https://openapi.tuyaus.com';
const TUYA_DEVICE_ID = 'eb623898baadaac34bloq9';

// IFTTT Kasa Webhooks
const KASA_IFTTT_ON = 'https://maker.ifttt.com/trigger/Kasa/with/key/4sN8nwi3EcxSd3Fyymx6z';
const KASA_IFTTT_OFF = 'https://maker.ifttt.com/trigger/Kasa_off/with/key/4sN8nwi3EcxSd3Fyymx6z';
// ==================

const tuya = new TuyaContext({
  baseUrl: TUYA_BASE_URL,
  accessKey: TUYA_CLIENT_ID,
  secretKey: TUYA_CLIENT_SECRET
});

// ---------------- Webhook endpoint ----------------
app.post('/webhook', async (req, res) => {
  const { action } = req.body;

  if (!['on', 'off'].includes(action)) {
    return res.status(400).json({ error: 'action must be "on" or "off"' });
  }

  const state = action === 'on';

  try {
    // ---- Tuya: both switches ----
    await tuya.request({
      path: `/v1.0/iot-03/devices/${TUYA_DEVICE_ID}/commands`,
      method: 'POST',
      body: {
        commands: [
          { code: 'switch_1', value: state },
          { code: 'switch_2', value: state }
        ]
      }
    });

    // ---- Kasa via IFTTT webhook ----
    const kasaUrl = state ? KASA_IFTTT_ON : KASA_IFTTT_OFF;
    const kasaRes = await fetch(kasaUrl);

    if (!kasaRes.ok) {
      throw new Error(`Kasa IFTTT webhook failed with status ${kasaRes.status}`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------- Start server ----------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
