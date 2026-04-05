const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/plagiarism.db';
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    totalFiles INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    completedAt DATETIME
  );

  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId TEXT NOT NULL,
    fileName TEXT NOT NULL,
    language TEXT NOT NULL,
    originalSize INTEGER DEFAULT 0,
    tokenCount INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sessionId) REFERENCES sessions(sessionId)
  );

  CREATE TABLE IF NOT EXISTS similarities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId TEXT NOT NULL,
    file1Id INTEGER NOT NULL,
    file2Id INTEGER NOT NULL,
    file1Name TEXT NOT NULL,
    file2Name TEXT NOT NULL,
    jaccardScore REAL DEFAULT 0,
    cosineScore REAL DEFAULT 0,
    overallScore REAL DEFAULT 0,
    isSuspicious INTEGER DEFAULT 0,
    matchedTokens INTEGER DEFAULT 0,
    FOREIGN KEY(sessionId) REFERENCES sessions(sessionId),
    FOREIGN KEY(file1Id) REFERENCES files(id),
    FOREIGN KEY(file2Id) REFERENCES files(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId TEXT UNIQUE NOT NULL,
    reportData TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sessionId) REFERENCES sessions(sessionId)
  );
`);
const createSession = db.prepare(
  'INSERT INTO sessions (sessionId, totalFiles) VALUES (?, ?)'
);

const updateSessionStatus = db.prepare(
  'UPDATE sessions SET status = ?, completedAt = CURRENT_TIMESTAMP WHERE sessionId = ?'
);

const getSession = db.prepare(
  'SELECT * FROM sessions WHERE sessionId = ?'
);

const insertFile = db.prepare(
  'INSERT INTO files (sessionId, fileName, language, originalSize, tokenCount) VALUES (?, ?, ?, ?, ?)'
);

const getFilesBySession = db.prepare(
  'SELECT * FROM files WHERE sessionId = ?'
);

const insertSimilarity = db.prepare(
  `INSERT INTO similarities (sessionId, file1Id, file2Id, file1Name, file2Name, jaccardScore, cosineScore, overallScore, isSuspicious, matchedTokens)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

const getSimilaritiesBySession = db.prepare(
  'SELECT * FROM similarities WHERE sessionId = ? ORDER BY overallScore DESC'
);

const insertReport = db.prepare(
  'INSERT OR REPLACE INTO reports (sessionId, reportData) VALUES (?, ?)'
);

const getReport = db.prepare(
  'SELECT * FROM reports WHERE sessionId = ?'
);

const deleteSession = db.prepare('DELETE FROM sessions WHERE sessionId = ?');
const deleteFiles = db.prepare('DELETE FROM files WHERE sessionId = ?');
const deleteSimilarities = db.prepare('DELETE FROM similarities WHERE sessionId = ?');
const deleteReport = db.prepare('DELETE FROM reports WHERE sessionId = ?');

const cleanupSession = db.transaction((sessionId) => {
  deleteSimilarities.run(sessionId);
  deleteFiles.run(sessionId);
  deleteReport.run(sessionId);
  deleteSession.run(sessionId);
});

module.exports = {
  db,
  createSession,
  updateSessionStatus,
  getSession,
  insertFile,
  getFilesBySession,
  insertSimilarity,
  getSimilaritiesBySession,
  insertReport,
  getReport,
  cleanupSession,
};
