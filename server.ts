import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'levantamientos.json');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

function loadRecordsFromDisk(): any[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error loading records from disk:', err);
  }
  return [];
}

function saveRecordsToDisk(records: any[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving records to disk:', err);
  }
}

// In-memory cache synced with disk
let recordsCache: any[] = loadRecordsFromDisk();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), recordsCount: recordsCache.length });
});

app.get('/api/levantamientos', (req, res) => {
  res.json(recordsCache);
});

app.post('/api/levantamientos', (req, res) => {
  const newRecord = req.body;
  if (!newRecord || !newRecord.id) {
    return res.status(400).json({ error: 'Record missing id' });
  }

  const existingIdx = recordsCache.findIndex((r) => r.id === newRecord.id);
  if (existingIdx >= 0) {
    recordsCache[existingIdx] = { ...newRecord, updatedAt: new Date().toISOString() };
  } else {
    recordsCache.unshift({ ...newRecord, createdAt: newRecord.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  saveRecordsToDisk(recordsCache);
  res.json({ success: true, record: newRecord });
});

app.delete('/api/levantamientos/:id', (req, res) => {
  const { id } = req.params;
  recordsCache = recordsCache.filter((r) => r.id !== id);
  saveRecordsToDisk(recordsCache);
  res.json({ success: true, message: `Registro ${id} eliminado` });
});

app.post('/api/sync-google-sheets', async (req, res) => {
  const { webhookUrl, payload } = req.body;
  if (!webhookUrl) {
    return res.status(400).json({ error: 'Webhook URL is required' });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    res.json({ success: true, serverResponse: text });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error proxying to Google Sheets' });
  }
});

// Vite & Static file setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
