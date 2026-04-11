

const { SUSPICIOUS_THRESHOLD } = require('./similarity');


function generateReport(sessionId, files, results) {
  const suspicious = results.filter(r => r.isSuspicious);

  const matrix = {};
  for (const f of files) {
    matrix[f.fileName] = {};
    for (const f2 of files) {
      matrix[f.fileName][f2.fileName] = f.fileName === f2.fileName ? 1 : 0;
    }
  }
  for (const r of results) {
    matrix[r.file1Name][r.file2Name] = r.overallScore;
    matrix[r.file2Name][r.file1Name] = r.overallScore;
  }

  const scores = results.map(r => r.overallScore);
  const avgScore = scores.length
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;
  const maxScore = scores.length ? Math.max(...scores) : 0;
  const minScore = scores.length ? Math.min(...scores) : 0;

  const report = {
    sessionId,
    generatedAt: new Date().toISOString(),
    summary: {
      totalFiles: files.length,
      totalComparisons: results.length,
      suspiciousPairs: suspicious.length,
      threshold: SUSPICIOUS_THRESHOLD,
      averageSimilarity: Math.round(avgScore * 10000) / 10000,
      maxSimilarity: Math.round(maxScore * 10000) / 10000,
      minSimilarity: Math.round(minScore * 10000) / 10000,
    },
    files: files.map(f => ({
      id: f.id,
      name: f.fileName,
      language: f.language,
      tokens: f.tokenCount,
    })),
    pairs: results.map(r => ({
      file1: r.file1Name,
      file2: r.file2Name,
      lexical: r.lexicalScore,
      jaccard: r.jaccardScore,
      cosine: r.cosineScore,
      lcs: r.lcsScore,
      ast: r.astScore,
      overall: r.overallScore,
      suspicious: r.isSuspicious,
      crossLanguage: Boolean(r.crossLanguage),
      matchedTokens: r.matchedTokens,
    })),
    suspiciousPairs: suspicious.map(r => ({
      file1: r.file1Name,
      file2: r.file2Name,
      overall: r.overallScore,
      lexical: r.lexicalScore,
      ast: r.astScore,
      jaccard: r.jaccardScore,
      cosine: r.cosineScore,
      lcs: r.lcsScore,
      crossLanguage: Boolean(r.crossLanguage),
    })),
    matrix,
  };

  return report;
}

module.exports = { generateReport };
