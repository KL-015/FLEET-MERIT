import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// API routes first
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Secure config endpoint serving environment variables
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || 'https://bgxgdgoegnjxuzatiqed.supabase.co',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneGdkZ29lZ25qeHV6YXRpcWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MzQyODYsImV4cCI6MjA5MTAxMDI4Nn0.Vx-g40-0g4BRtX6n6zTQ6F9eHVzQoWcKDJGa3GjhWCY',
    siteUrl: process.env.SITE_URL || 'https://fleethro.netlify.app'
  });
});

// Serve static files from root directory
app.use(express.static(__dirname));

// Fallback to index.html for root or SPA paths
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

