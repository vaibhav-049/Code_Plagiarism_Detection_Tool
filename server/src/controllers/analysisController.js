const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { preprocess } = require('../services/preprocessor');
const { tokenize } = require('../services/tokenizer');
const { normalizeTokens } = require('../services/normalizer');
const { buildAST } = require('../services/astParser');
const { compareAll } = require('../services/similarity');
const { generateReport } = require('../services/reportGenerator');
const { detectLanguage, isSupported } = require('../utils/languageDetector');
const db = require('../db/database');
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidSessionId(id) {
  return typeof id === 'string' && UUID_REGEX.test(id);
}
function sanitizeFilename(name) {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
}


async function uploadAndAnalyze(req, res) {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({
        error: 'Please upload at least 2 code files for comparison.',
      });
    }

    const sessionId = uuidv4();
    const userId = req.body.userId || null;
    db.createSession.run(sessionId, userId, req.files.length);

    const fileEntries = [];
    const unsupported = [];

    for (const file of req.files) {
      const safeName = sanitizeFilename(file.originalname);
      const language = detectLanguage(safeName);

      if (!language || !isSupported(language)) {
        unsupported.push(safeName);
        continue;
      }
      const rawCode = fs.readFileSync(file.path, 'utf-8');
      const cleaned = preprocess(rawCode, language);
      const tokens = tokenize(cleaned, language);
      const { normalized } = normalizeTokens(tokens);
      const astResult = buildAST(cleaned, language);
      const result = db.insertFile.run(
        sessionId,
        safeName,
        language,
        rawCode.length,
        normalized.length
      );

      fileEntries.push({
        id: result.lastInsertRowid,
        name: safeName,
        language,
        code: rawCode,
        tokenCount: normalized.length,
        ast: astResult.ast,
        astMeta: astResult.metadata,
        tokens: normalized,
      });
    }

    if (fileEntries.length < 2) {
      db.cleanupSession(sessionId);
      return res.status(400).json({
        error: 'Need at least 2 supported files for comparison.',
        unsupported,
      });
    }
    
    // Phase 2: Compute matches with AST
    const matches = compareAll(fileEntries);
    for (const match of matches) {
      db.insertMatch.run(
        sessionId,
        match.file1Id,
        match.file2Id,
        match.file1Name,
        match.file2Name,
        match.lexicalScore,
        match.astScore || 0,
        0, // Semantic placeholder
        match.overallScore,
        match.isSuspicious ? 1 : 0,
        match.crossLanguage ? 1 : 0,
        JSON.stringify({ heatmap: [] })
      );
    }
    
    const files = db.getFilesBySession.all(sessionId);
    const report = generateReport(sessionId, files, matches);
    db.insertReport.run(sessionId, JSON.stringify(report));
    db.updateSessionStatus.run('completed', sessionId);
    for (const file of req.files) {
      fs.unlink(file.path, () => {});
    }

    return res.json({
      success: true,
      sessionId,
      report,
      ...(unsupported.length > 0 && { unsupportedFiles: unsupported }),
    });
  } catch (err) {
    console.error('Analysis error:', err);
    return res.status(500).json({ error: 'Internal server error during analysis.' });
  }
}


function getResults(req, res) {
  try {
    const { sessionId } = req.params;
    if (!isValidSessionId(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID format.' });
    }
    const session = db.getSession.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const files = db.getFilesBySession.all(sessionId);
    const matches = db.getMatchesBySession.all(sessionId);
    const reportRow = db.getReport.get(sessionId);
    const report = reportRow ? JSON.parse(reportRow.reportData) : null;

    return res.json({ session, files, matches, report });
  } catch (err) {
    console.error('Get results error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}


function getReport(req, res) {
  try {
    const { sessionId } = req.params;
    if (!isValidSessionId(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID format.' });
    }
    const reportRow = db.getReport.get(sessionId);
    if (!reportRow) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    return res.json(JSON.parse(reportRow.reportData));
  } catch (err) {
    console.error('Get report error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}


function deleteSession(req, res) {
  try {
    const { sessionId } = req.params;
    if (!isValidSessionId(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID format.' });
    }
    const session = db.getSession.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    db.cleanupSession(sessionId);
    return res.json({ success: true, message: 'Session deleted.' });
  } catch (err) {
    console.error('Delete session error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { uploadAndAnalyze, getResults, getReport, deleteSession };
