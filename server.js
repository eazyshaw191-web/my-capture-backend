const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://eazyshaw191-web.github.io');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.post('/api/capture', async (req, res) => {
  try {
    const { location, selfie, timestamp } = req.body;
    let selfieUrl = null;

    if (selfie) {
      const base64Data = selfie.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `selfie-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('selfies')
        .upload(filename, buffer, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('selfies')
        .getPublicUrl(filename);

      selfieUrl = publicUrlData.publicUrl;
    }

    console.log('--- New Submission ---');
    console.log('Time:', timestamp);
    console.log('Location:', location?.lat, location?.lng);
    console.log('Selfie URL:', selfieUrl);

    res.json({ success: true, selfieUrl });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/', (req, res) => res.send('Backend is running'));

app.listen(PORT, () => console.log('Server running on port', PORT));
