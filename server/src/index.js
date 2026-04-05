require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.disable('x-powered-by');

app.use('/api', apiRoutes);

app.get('/', (_req, res) => {
  res.json({
    name: 'Code Plagiarism Detection API',
    version: '1.0.0',
    endpoints: {
      upload: 'POST /api/upload',
      results: 'GET /api/results/:sessionId',
      report: 'GET /api/report/:sessionId',
      delete: 'DELETE /api/session/:sessionId',
      health: 'GET /api/health',
    },
  });
});

app.listen(PORT, () => {
  console.log(`\n  Plagiarism Detection Server running on http://localhost:${PORT}`);
  console.log(`  API base: http://localhost:${PORT}/api\n`);
});

module.exports = app;
