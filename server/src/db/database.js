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
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId TEXT UNIQUE NOT NULL,
    userId INTEGER,
    status TEXT DEFAULT 'pending',
    totalFiles INTEGER DEFAULT 0,
    archived INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    completedAt DATETIME,
    FOREIGN KEY(userId) REFERENCES users(id)
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

  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId TEXT NOT NULL,
    file1Id INTEGER NOT NULL,
    file2Id INTEGER NOT NULL,
    file1Name TEXT NOT NULL,
    file2Name TEXT NOT NULL,
    lexicalScore REAL DEFAULT 0,
    astScore REAL DEFAULT 0,
    semanticScore REAL DEFAULT 0,
    overallScore REAL DEFAULT 0,
    isSuspicious INTEGER DEFAULT 0,
    crossLanguage INTEGER DEFAULT 0,
    heatmapData TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
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

// Migrations for existing Phase 1 databases
try {
  db.prepare('ALTER TABLE sessions ADD COLUMN userId INTEGER REFERENCES users(id)').run();
} catch (e) { /* Column might already exist */ }
try {
  db.prepare('ALTER TABLE sessions ADD COLUMN archived INTEGER DEFAULT 0').run();
} catch (e) { /* Column might already exist */ }

const createSession = db.prepare(
  'INSERT INTO sessions (sessionId, userId, totalFiles) VALUES (?, ?, ?)'
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

const insertMatch = db.prepare(
  `INSERT INTO matches (sessionId, file1Id, file2Id, file1Name, file2Name, lexicalScore, astScore, semanticScore, overallScore, isSuspicious, crossLanguage, heatmapData)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

const getMatchesBySession = db.prepare(
  'SELECT * FROM matches WHERE sessionId = ? ORDER BY overallScore DESC'
);

const insertReport = db.prepare(
  'INSERT OR REPLACE INTO reports (sessionId, reportData) VALUES (?, ?)'
);

const getReport = db.prepare(
  'SELECT * FROM reports WHERE sessionId = ?'
);

const deleteSession = db.prepare('DELETE FROM sessions WHERE sessionId = ?');
const deleteFiles = db.prepare('DELETE FROM files WHERE sessionId = ?');
const deleteMatches = db.prepare('DELETE FROM matches WHERE sessionId = ?');
const deleteReport = db.prepare('DELETE FROM reports WHERE sessionId = ?');

const cleanupSession = db.transaction((sessionId) => {
  deleteMatches.run(sessionId);
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
  insertMatch,
  getMatchesBySession,
  insertReport,
  getReport,
  cleanupSession,
};
