const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { acceptedExtensions } = require('../utils/languageDetector');
const { getAllSamples, getSamplesByLanguage } = require('../services/sampleLoader');
const {
  uploadAndAnalyze,
  getResults,
  getReport,
  deleteSession,
} = require('../controllers/analysisController');

const router = express.Router();

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many upload requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});


const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const ACCEPTED = acceptedExtensions();

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ACCEPTED.includes(ext)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 1 * 1024 * 1024 } });

router.post('/upload', uploadLimiter, upload.array('files', 50), uploadAndAnalyze);

router.get('/results/:sessionId', getResults);

router.get('/report/:sessionId', getReport);

router.delete('/session/:sessionId', deleteSession);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/samples', (_req, res) => {
  res.json(getAllSamples());
});

router.get('/samples/:language', (req, res) => {
  const lang = req.params.language.toLowerCase();
  const samples = getSamplesByLanguage(lang);
  if (samples) {
    res.json(samples);
  } else {
    res.status(404).json({ error: `No samples for language: ${lang}` });
  }
});

module.exports = router;
