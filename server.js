const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// --- Save a new capture ---
app.post('/api/capture', async (req, res) => {
  try {
    const { location, selfie, timestamp, deviceName } = req.body;
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

    const { data: inserted, error: insertError } = await supabase
      .from('captures')
      .insert({
        device_name: deviceName || 'Unknown device',
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        accuracy: location?.accuracy ?? null,
        selfie_url: selfieUrl,
        created_at: timestamp || new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.json({ success: true, selfieUrl, id: inserted.id });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- List all captures (for admin) ---
app.get('/api/captures', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('captures')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Rename a device ---
app.patch('/api/captures/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { device_label } = req.body;
    const { error } = await supabase
      .from('captures')
      .update({ device_label })
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/', (req, res) => res.send('Backend is running'));

app.listen(PORT, () => console.log('Server running on port', PORT));
