const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: '10mb' })); // Allow larger selfie data

// Allow requests from your GitHub Pages (replace with your URL!)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://YOUR-USERNAME.github.io');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.post('/api/capture', (req, res) => {
  const { location, selfie, timestamp } = req.body;
  console.log('--- New Submission ---');
  console.log('Time:', timestamp);
  if (location) console.log('Location:', location.lat, location.lng);
  if (selfie) console.log('Selfie received, length:', selfie.length);

  // ⚠️ Note: Render's free tier has no persistent storage.
  // Data is only printed in logs and will be lost on restart.
  // For production, you need to connect a database or external storage.
  res.json({ success: true, message: 'Data received' });
});

app.get('/', (req, res) => res.send('Backend is running'));

app.listen(PORT, () => console.log('Server running on port', PORT));
