// server.js
const express = require('express');
const bodyParser = require('body-parser');
const { TuyaContext } = require('@tuya/tuya-connector-nodejs');

// ===== CONFIG =====
const client_id     = '95gk8g3nekeu87nney58';
const client_secret = 'db68aff004494229be673342ceaf0ed7';
const baseUrl       = 'https://openapi.tuyaus.com';
const device_id     = 'eb623898baadaac34bloq9';
// ==================

const app = express();
app.use(bodyParser.json());
app.use(express.static('public')); // serve frontend from "public" folder

const tuya = new TuyaContext({
  baseUrl: baseUrl,
  accessKey: client_id,
  secretKey: client_secret
});

// Endpoint to toggle an individual switch
app.post('/toggle', async (req, res) => {
  const { switch: switchNum, state } = req.body;
  // expects { switch: 1 or 2, state: true/false }

  if (![1, 2].includes(switchNum)) {
    return res.status(400).json({ error: 'switch must be 1 or 2' });
  }

  if (typeof state !== 'boolean') {
    return res.status(400).json({ error: 'state must be true or false' });
  }

  try {
    const body = {
      commands: [
        {
          code: `switch_${switchNum}`,
          value: state
        }
      ]
    };

    const response = await tuya.request({
      path: `/v1.0/iot-03/devices/${device_id}/commands`,
      method: 'POST',
      body: body
    });

    res.json({ success: true, response });
  } catch (err) {
    console.error('Error sending command:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
