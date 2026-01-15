const express = require('express');
const bodyParser = require('body-parser');
const { TuyaContext } = require('@tuya/tuya-connector-nodejs');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// ===== CONFIG =====
const TUYA_CLIENT_ID = '95gk8g3nekeu87nney58';
const TUYA_CLIENT_SECRET = 'db68aff004494229be673342ceaf0ed7';
const TUYA_BASE_URL = 'https://openapi.tuyaus.com';
const TUYA_DEVICE_ID = 'eb623898baadaac34bloq9';
// ==================

const tuya = new TuyaContext({
  baseUrl: TUYA_BASE_URL,
  accessKey: TUYA_CLIENT_ID,
  secretKey: TUYA_CLIENT_SECRET
});

// Tuya endpoint — turns both switches on/off
app.post('/tuya', async (req, res) => {
  const { state } = req.body; // true = on, false = off
  if (typeof state !== 'boolean') {
    return res.status(400).json({ error: 'state must be boolean' });
  }

  try {
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
    res.json({ success: true });
  } catch (err) {
    console.error('Tuya error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
