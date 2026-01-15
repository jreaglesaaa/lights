const express = require('express');
const bodyParser = require('body-parser');
const { TuyaContext } = require('@tuya/tuya-connector-nodejs');
const { Client } = require('tplink-smarthome-api');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// ===== TUYA CONFIG =====
const tuya = new TuyaContext({
  baseUrl: 'https://openapi.tuyaus.com',
  accessKey: '95gk8g3nekeu87nney58',
  secretKey: 'db68aff004494229be673342ceaf0ed7'
});

const TUYA_DEVICE_ID = 'eb623898baadaac34bloq9';

// ===== KASA CONFIG =====
const kasaClient = new Client();
const KASA_IP = '192.168.1.181';

// Toggle EVERYTHING
app.post('/toggle-all', async (req, res) => {
  const { state } = req.body;

  if (typeof state !== 'boolean') {
    return res.status(400).json({ error: 'state must be boolean' });
  }

  try {
    // ---- TUYA: BOTH SWITCHES ----
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

    // ---- KASA ----
    const device = await kasaClient.getDevice({ host: KASA_IP });
    const info = await device.getSysInfo();

    // If power strip → toggle all outlets
    if (info.children) {
      for (const outlet of device.children) {
        await outlet.setPowerState(state);
      }
    } else {
      // Normal plug
      await device.setPowerState(state);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
