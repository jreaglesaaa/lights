const express = require('express');
const bodyParser = require('body-parser');
const { TuyaContext } = require('@tuya/tuya-connector-nodejs');
const { Client } = require('tplink-smarthome-api');

// ===== CONFIG =====
const client_id = '95gk8g3nekeu87nney58';
const client_secret = 'db68aff004494229be673342ceaf0ed7';
const baseUrl = 'https://openapi.tuyaus.com';
const device_id = 'eb623898baadaac34bloq9';

const CHRISTMAS_TREE_IP = '192.168.1.181';
const PORT = 3000;
// ==================

const app = express();
app.use(bodyParser.json());
app.use(express.static('public')); // serve frontend

// Tuya
const tuya = new TuyaContext({
  baseUrl,
  accessKey: client_id,
  secretKey: client_secret
});

// Kasa
const kasaClient = new Client();

// Toggle endpoint
app.post('/toggle', async (req, res) => {
  const { switch: switchNum, state } = req.body;

  if (![1, 2].includes(switchNum)) {
    return res.status(400).json({ error: 'switch must be 1 or 2' });
  }
  if (typeof state !== 'boolean') {
    return res.status(400).json({ error: 'state must be true or false' });
  }

  try {
    // ---- Tuya ----
    await tuya.request({
      path: `/v1.0/iot-03/devices/${device_id}/commands`,
      method: 'POST',
      body: {
        commands: [
          {
            code: `switch_${switchNum}`,
            value: state
          }
        ]
      }
    });

    // ---- Kasa ----
    const kasaDevice = await kasaClient.getDevice({
      host: CHRISTMAS_TREE_IP
    });
    await kasaDevice.setPowerState(state);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
