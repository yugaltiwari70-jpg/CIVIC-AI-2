require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const connectDB = require('../src/db');
const { errorHandler } = require('../src/middleware/auth');
const authRoutes = require('../src/routes/auth');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const up = path.join(__dirname, '../uploads');
if (!fs.existsSync(up)) {
  try { fs.mkdirSync(up, { recursive: true }); } catch {}
}
app.use('/uploads', express.static(up));

let adminInitialized = false;

app.use(async (req, res, next) => {
  if (req.path === '/api/health' && req.method === 'GET') {
    // Health check can proceed quickly
    try {
      await connectDB();
    } catch {}
    return res.json({
      ok: true,
      db: mongoose.connection.readyState === 1,
      aiConfigured: !!process.env.AI_API_KEY,
      mode: process.env.AI_API_KEY ? 'ai' : 'demo-fallback'
    });
  }

  try {
    await connectDB();
    if (!adminInitialized) {
      adminInitialized = true;
      authRoutes.ensureAdmin().catch(e => console.error('Admin init warning:', e.message));
    }
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/api/health', (req, res) => res.json({
  ok: true,
  db: mongoose.connection.readyState === 1,
  aiConfigured: !!process.env.AI_API_KEY,
  mode: process.env.AI_API_KEY ? 'ai' : 'demo-fallback'
}));

app.use('/api/auth', authRoutes);
app.use('/api', require('../src/routes/issues'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

module.exports = app;
