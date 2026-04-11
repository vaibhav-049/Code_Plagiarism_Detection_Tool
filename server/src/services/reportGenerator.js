

const { SUSPICIOUS_THRESHOLD } = require('./similarity');


function generateReport(sessionId, files, results, fileMetaMap = {}) {
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
  const lexicalScores = results.map(r => r.lexicalScore || 0);
  const astScores = results.map(r => r.astScore || 0);
  const semanticScores = results.map(r => r.semanticScore || 0);
  const cfgScores = results.map(r => r.compiler?.cfgSimilarity || 0);
  const symbolScores = results.map(r => r.compiler?.symbolSimilarity || 0);
  const avgScore = scores.length
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;
  const avgLexical = lexicalScores.length
    ? lexicalScores.reduce((a, b) => a + b, 0) / lexicalScores.length
    : 0;
  const avgAst = astScores.length
    ? astScores.reduce((a, b) => a + b, 0) / astScores.length
    : 0;
  const avgSemantic = semanticScores.length
    ? semanticScores.reduce((a, b) => a + b, 0) / semanticScores.length
    : 0;
  const avgCfg = cfgScores.length
    ? cfgScores.reduce((a, b) => a + b, 0) / cfgScores.length
    : 0;
  const avgSymbol = symbolScores.length
    ? symbolScores.reduce((a, b) => a + b, 0) / symbolScores.length
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
      averageLexical: Math.round(avgLexical * 10000) / 10000,
      averageAst: Math.round(avgAst * 10000) / 10000,
      averageSemantic: Math.round(avgSemantic * 10000) / 10000,
      averageCfg: Math.round(avgCfg * 10000) / 10000,
      averageSymbol: Math.round(avgSymbol * 10000) / 10000,
      maxSimilarity: Math.round(maxScore * 10000) / 10000,
      minSimilarity: Math.round(minScore * 10000) / 10000,
    },
    files: files.map(f => ({
      id: f.id,
      name: f.fileName,
      language: f.language,
      tokens: f.tokenCount,
      astParser: fileMetaMap[f.fileName]?.parserSource || 'unknown',
    })),
    pairs: results.map(r => ({
      file1: r.file1Name,
      file2: r.file2Name,
      lexical: r.lexicalScore,
      jaccard: r.jaccardScore,
      cosine: r.cosineScore,
      lcs: r.lcsScore,
      ast: r.astScore,
      semantic: r.semanticScore,
      overall: r.overallScore,
      suspicious: r.isSuspicious,
      crossLanguage: Boolean(r.crossLanguage),
      cloneType: r.compiler?.cloneType || 'NO_CLONE',
      cfgSimilarity: r.compiler?.cfgSimilarity || 0,
      symbolSimilarity: r.compiler?.symbolSimilarity || 0,
      functionMatches: r.compiler?.functionFingerprints?.matches || [],
      functionFingerprints: {
        fileA: (r.compiler?.functionFingerprints?.fileA || []).map(fn => ({
          name: fn.name,
          signatureHash: fn.signatureHash,
          tokenHash: fn.tokenHash,
          astHash: fn.astHash,
          cfgHash: fn.cfgHash,
        })),
        fileB: (r.compiler?.functionFingerprints?.fileB || []).map(fn => ({
          name: fn.name,
          signatureHash: fn.signatureHash,
          tokenHash: fn.tokenHash,
          astHash: fn.astHash,
          cfgHash: fn.cfgHash,
        })),
      },
      complexity: r.compiler?.complexity || {},
      matchedTokens: r.matchedTokens,
      explanation: r.explanation || '',
      heatmap: r.heatmapData || {},
    })),
    suspiciousPairs: suspicious.map(r => ({
      file1: r.file1Name,
      file2: r.file2Name,
      overall: r.overallScore,
      lexical: r.lexicalScore,
      ast: r.astScore,
      semantic: r.semanticScore,
      jaccard: r.jaccardScore,
      cosine: r.cosineScore,
      lcs: r.lcsScore,
      crossLanguage: Boolean(r.crossLanguage),
      cloneType: r.compiler?.cloneType || 'NO_CLONE',
      cfgSimilarity: r.compiler?.cfgSimilarity || 0,
      symbolSimilarity: r.compiler?.symbolSimilarity || 0,
      functionMatches: r.compiler?.functionFingerprints?.matches || [],
      complexity: r.compiler?.complexity || {},
      explanation: r.explanation || '',
      heatmap: r.heatmapData || {},
    })),
    matrix,
  };

  return report;
}

module.exports = { generateReport };
