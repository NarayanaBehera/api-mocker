const express = require('express');
const fs = require('fs');
const path = require('path');
const jsonpath = require('jsonpath');
const app = express();

// Load config
const config = require('./config.json');

// Middleware to parse JSON body
app.use(express.json());

config.routes.forEach(route => {
  const method = route.method.toLowerCase();

  app[method](route.path, async (req, res) => {
    try {
      let filePath;
      let status;

      // Case 1: Static response
      if (route.response) {
        filePath = path.join(__dirname, route.response.file);
        status = route.response.status;
      }

      // Case 2: Dynamic switch-based response
      else if (route.switch && route.responses && route.switchResponses) {
        let switchKey = '';
        let debugSwitchPairs = [];

        // Build switchKey by reading all fields safely
        for (const sw of route.switch) {
          let value = '';

          if (typeof sw === 'string') {
            value = req.params[sw] || '';
          } else if (sw.type === 'jsonpath') {
            const result = jsonpath.query(req.body, sw.switch);
            value = result[0] !== undefined && result[0] !== null ? String(result[0]) : '';
          }

          switchKey += value;
          debugSwitchPairs.push(`${sw.key || sw.switch}=${value}`);
        }

        console.log('\n[Mock] ====== Incoming Request ======');
        console.log(`[Mock] Path: ${req.path}`);
        console.log(`[Mock] Method: ${route.method}`);
        console.log(`[Mock] Switch Values: ${debugSwitchPairs.join(' | ')}`);
        console.log(`[Mock] Generated switchKey: ${switchKey}`);

        // Match against switchResponses
        if (route.switchResponses[switchKey]) {
          const resp = route.switchResponses[switchKey];
          filePath = path.join(__dirname, resp.mockFile);
          status = resp.httpStatus;
          console.log(`[Mock] ✅ Matched response: ${filePath}`);
        } else {
          const resp = route.responses[method] || route.responses[route.method];
          if (resp) {
            filePath = path.join(__dirname, resp.mockFile);
            status = resp.httpStatus;
            console.log(`[Mock] ⚠️ No match found — using default: ${filePath}`);
          } else {
            console.log('[Mock] ❌ No matching mock configuration found.');
            return res.status(404).json({ error: 'No matching mock config' });
          }
        }
      }

      // No file configured
      if (!filePath) {
        return res.status(404).json({ error: 'No mock file configured' });
      }

      // Check file existence
      if (!fs.existsSync(filePath)) {
        console.error('[Mock] ❌ File not found:', filePath);
        return res.status(500).json({ error: 'Mock file not found' });
      }

      // Optional latency simulation
      if (route.latency) await new Promise(r => setTimeout(r, route.latency));

      const fileContent = fs.readFileSync(filePath, 'utf8');
      res.status(status).json(JSON.parse(fileContent));

    } catch (err) {
      console.error('[Mock] ❌ Error:', err.message);
      res.status(500).json({ error: 'Mock server internal error' });
    }
  });
});

const port = config.port || 3000;
app.listen(port, () => {
  console.log(`🚀 Mock server running on port ${port}`);
});
