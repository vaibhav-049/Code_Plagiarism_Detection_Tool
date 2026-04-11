

const { buildNgrams, buildFrequencyMap } = require('./normalizer');
const { buildAST, calculateASTSimilarity } = require('./astParser');



function jaccardSimilarity(tokensA, tokensB, n = 4) {
  const gramsA = new Set(buildNgrams(tokensA, n));
  const gramsB = new Set(buildNgrams(tokensB, n));

  if (gramsA.size === 0 && gramsB.size === 0) return 1;
  if (gramsA.size === 0 || gramsB.size === 0) return 0;

  let intersection = 0;
  for (const g of gramsA) {
    if (gramsB.has(g)) intersection++;
  }

  const union = gramsA.size + gramsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}



function cosineSimilarity(tokensA, tokensB) {
  const freqA = buildFrequencyMap(tokensA);
  const freqB = buildFrequencyMap(tokensB);

  const allKeys = new Set([...freqA.keys(), ...freqB.keys()]);

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const key of allKeys) {
    const a = freqA.get(key) || 0;
    const b = freqB.get(key) || 0;
    dotProduct += a * b;
    magA += a * a;
    magB += b * b;
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}



function lcsLength(seqA, seqB) {
  const m = seqA.length;
  const n = seqB.length;

  if (m > 2000 || n > 2000) {

    return lcsLengthSampled(seqA, seqB);
  }

  const prev = new Array(n + 1).fill(0);
  const curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (seqA[i - 1] === seqB[j - 1]) {
        curr[j] = prev[j - 1] + 1;
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }
    for (let j = 0; j <= n; j++) {
      prev[j] = curr[j];
      curr[j] = 0;
    }
  }

  return prev[n];
}


function lcsLengthSampled(seqA, seqB, chunkSize = 500) {
  let totalLcs = 0;
  let chunks = 0;
  for (let i = 0; i < seqA.length; i += chunkSize) {
    const chunkA = seqA.slice(i, i + chunkSize);
    for (let j = 0; j < seqB.length; j += chunkSize) {
      const chunkB = seqB.slice(j, j + chunkSize);
      totalLcs += lcsLengthSmall(chunkA, chunkB);
      chunks++;
    }
  }
  return Math.round(totalLcs / Math.max(chunks, 1) * Math.max(seqA.length, seqB.length) / chunkSize);
}

function lcsLengthSmall(a, b) {
  const m = a.length;
  const n = b.length;
  const prev = new Array(n + 1).fill(0);
  const curr = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1] + 1
        : Math.max(prev[j], curr[j - 1]);
    }
    for (let j = 0; j <= n; j++) { prev[j] = curr[j]; curr[j] = 0; }
  }
  return prev[n];
}


function lcsSimilarity(tokensA, tokensB) {
  const seqA = tokensA.map(t => t.toString());
  const seqB = tokensB.map(t => t.toString());
  const total = seqA.length + seqB.length;
  if (total === 0) return 1;
  const lcs = lcsLength(seqA, seqB);
  return (2 * lcs) / total;
}

function tokenValueMultisetSimilarity(tokensA, tokensB, type) {
  const valuesA = tokensA.filter(t => t.type === type).map(t => t.value);
  const valuesB = tokensB.filter(t => t.type === type).map(t => t.value);

  if (valuesA.length === 0 && valuesB.length === 0) return 1;
  if (valuesA.length === 0 || valuesB.length === 0) return 0;

  const freqA = new Map();
  const freqB = new Map();

  for (const v of valuesA) freqA.set(v, (freqA.get(v) || 0) + 1);
  for (const v of valuesB) freqB.set(v, (freqB.get(v) || 0) + 1);

  const keys = new Set([...freqA.keys(), ...freqB.keys()]);
  let intersection = 0;
  let union = 0;

  for (const key of keys) {
    const a = freqA.get(key) || 0;
    const b = freqB.get(key) || 0;
    intersection += Math.min(a, b);
    union += Math.max(a, b);
  }

  if (union === 0) return 0;
  return intersection / union;
}

function arrayMultisetSimilarity(arrA, arrB) {
  if (arrA.length === 0 && arrB.length === 0) return 1;
  if (arrA.length === 0 || arrB.length === 0) return 0;

  const freqA = new Map();
  const freqB = new Map();

  for (const v of arrA) freqA.set(v, (freqA.get(v) || 0) + 1);
  for (const v of arrB) freqB.set(v, (freqB.get(v) || 0) + 1);

  const keys = new Set([...freqA.keys(), ...freqB.keys()]);
  let intersection = 0;
  let union = 0;

  for (const key of keys) {
    const a = freqA.get(key) || 0;
    const b = freqB.get(key) || 0;
    intersection += Math.min(a, b);
    union += Math.max(a, b);
  }

  if (union === 0) return 0;
  return intersection / union;
}

function ratioSimilarity(a, b) {
  if (a === 0 && b === 0) return 1;
  const max = Math.max(a, b);
  if (max === 0) return 1;
  return 1 - Math.abs(a - b) / max;
}

function canonicalControlFlow(file) {
  const flow = file.astMeta?.controlFlow || [];
  return flow.map((keyword) => {
    const key = String(keyword).toLowerCase();
    if (key === 'elif') return 'if';
    if (key === 'foreach') return 'for';
    return key;
  });
}

function semanticHeuristicScore(fileA, fileB) {
  const keywordPattern = tokenValueMultisetSimilarity(fileA.tokens, fileB.tokens, 'KEYWORD');
  const operatorPattern = tokenValueMultisetSimilarity(fileA.tokens, fileB.tokens, 'OPERATOR');
  const flowPattern = arrayMultisetSimilarity(canonicalControlFlow(fileA), canonicalControlFlow(fileB));

  const metaA = fileA.astMeta || { maxDepth: 0, blockCount: 0 };
  const metaB = fileB.astMeta || { maxDepth: 0, blockCount: 0 };

  const depthPattern = ratioSimilarity(metaA.maxDepth || 0, metaB.maxDepth || 0);
  const blockPattern = ratioSimilarity(metaA.blockCount || 0, metaB.blockCount || 0);

  return (
    (0.28 * keywordPattern) +
    (0.27 * operatorPattern) +
    (0.2 * flowPattern) +
    (0.15 * depthPattern) +
    (0.1 * blockPattern)
  );
}

function topSharedValues(tokensA, tokensB, type, limit = 5) {
  const freqA = new Map();
  const freqB = new Map();

  for (const t of tokensA) {
    if (t.type === type) freqA.set(t.value, (freqA.get(t.value) || 0) + 1);
  }
  for (const t of tokensB) {
    if (t.type === type) freqB.set(t.value, (freqB.get(t.value) || 0) + 1);
  }

  const shared = [];
  for (const [value, countA] of freqA.entries()) {
    const countB = freqB.get(value) || 0;
    if (countB > 0) {
      shared.push({
        value,
        strength: Math.min(countA, countB),
      });
    }
  }

  shared.sort((a, b) => b.strength - a.strength);
  return shared.slice(0, limit);
}

function topSharedNgrams(tokensA, tokensB, n = 3, limit = 6) {
  const gramsA = buildNgrams(tokensA, n);
  const gramsB = buildNgrams(tokensB, n);

  const freqA = new Map();
  const freqB = new Map();
  for (const g of gramsA) freqA.set(g, (freqA.get(g) || 0) + 1);
  for (const g of gramsB) freqB.set(g, (freqB.get(g) || 0) + 1);

  const shared = [];
  for (const [value, countA] of freqA.entries()) {
    const countB = freqB.get(value) || 0;
    if (countB > 0) {
      shared.push({ value, strength: Math.min(countA, countB) });
    }
  }

  shared.sort((a, b) => b.strength - a.strength);
  return shared.slice(0, limit);
}

function explainPair(match) {
  const notes = [];
  if (match.crossLanguage) notes.push('Cross-language comparison; lexical signals are weighted lower.');
  if (match.lexicalScore >= 0.75) notes.push('Strong lexical similarity (token patterns are highly aligned).');
  else if (match.lexicalScore <= 0.35) notes.push('Low lexical similarity (token-level structure differs).');

  if (match.astScore >= 0.75) notes.push('AST structure appears strongly similar.');
  else if (match.astScore <= 0.35) notes.push('AST structure differs significantly.');

  if (match.semanticScore >= 0.7) notes.push('Semantic heuristic indicates similar logic flow.');
  else if (match.semanticScore <= 0.35) notes.push('Semantic heuristic indicates low logical overlap.');

  if (notes.length === 0) notes.push('Mixed signals across lexical, AST, and semantic metrics.');
  return notes.join(' ');
}

function buildHeatmapData(fileA, fileB) {
  const sharedKeywords = topSharedValues(fileA.tokens, fileB.tokens, 'KEYWORD');
  const sharedOperators = topSharedValues(fileA.tokens, fileB.tokens, 'OPERATOR');
  const sharedNgrams = topSharedNgrams(fileA.tokens, fileB.tokens, 3);

  const flowA = canonicalControlFlow(fileA);
  const flowB = canonicalControlFlow(fileB);
  const flowOverlap = arrayMultisetSimilarity(flowA, flowB);

  return {
    sharedKeywords,
    sharedOperators,
    sharedNgrams,
    controlFlowOverlap: Math.round(flowOverlap * 10000) / 10000,
    tokenCountA: fileA.tokenCount,
    tokenCountB: fileB.tokenCount,
  };
}


const WEIGHTS = {
  jaccard: 0.2,
  cosine: 0.2,
  lcs: 0.2,
  ast: 0.2,
  semantic: 0.2
};

const SUSPICIOUS_THRESHOLD = 0.60;


function comparePair(fileA, fileB) {
  const jaccard = jaccardSimilarity(fileA.tokens, fileB.tokens);
  const cosine = cosineSimilarity(fileA.tokens, fileB.tokens);
  const lcs = lcsSimilarity(fileA.tokens, fileB.tokens);
  const lexicalScore = (jaccard + cosine + lcs) / 3;

  // Generate ASTs on the fly or pull from precomputed file parameters
  const astA = fileA.ast ? fileA.ast : buildAST(fileA.code || '', fileA.language).ast;
  const astB = fileB.ast ? fileB.ast : buildAST(fileB.code || '', fileB.language).ast;
  
  const astScore = calculateASTSimilarity(astA, astB);
  const semanticScore = semanticHeuristicScore(fileA, fileB);
  const boundedAstScore = Math.min(astScore, lexicalScore + 0.25);
  const boundedSemanticScore = Math.min(semanticScore, lexicalScore + 0.3);
  const heatmapData = buildHeatmapData(fileA, fileB);

  const isCrossLanguage = fileA.language !== fileB.language;
  const effectiveWeights = isCrossLanguage
    ? { jaccard: 0.15, cosine: 0.15, lcs: 0.15, ast: 0.3, semantic: 0.25 }
    : WEIGHTS;

  // Weighted overall score
  const overall =
    (effectiveWeights.jaccard * jaccard) +
    (effectiveWeights.cosine * cosine) +
    (effectiveWeights.lcs * lcs) +
    (effectiveWeights.ast * boundedAstScore) +
    (effectiveWeights.semantic * boundedSemanticScore);

  const rounded = Math.round(overall * 10000) / 10000;

  const result = {
    file1Id: fileA.id,
    file2Id: fileB.id,
    file1Name: fileA.name,
    file2Name: fileB.name,
    lexicalScore: Math.round(lexicalScore * 10000) / 10000,
    jaccardScore: Math.round(jaccard * 10000) / 10000,
    cosineScore: Math.round(cosine * 10000) / 10000,
    lcsScore: Math.round(lcs * 10000) / 10000,
    astScore: Math.round(boundedAstScore * 10000) / 10000,
    semanticScore: Math.round(boundedSemanticScore * 10000) / 10000,
    overallScore: rounded,
    isSuspicious: rounded >= SUSPICIOUS_THRESHOLD,
    matchedTokens: Math.round(lcs * (fileA.tokenCount + fileB.tokenCount) / 2),
    crossLanguage: isCrossLanguage,
    heatmapData,
  };

  result.explanation = explainPair(result);
  return result;
}


function compareAll(files) {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    for (let j = i + 1; j < files.length; j++) {
      results.push(comparePair(files[i], files[j]));
    }
  }
  return results;
}

module.exports = {
  jaccardSimilarity,
  cosineSimilarity,
  lcsSimilarity,
  comparePair,
  compareAll,
  SUSPICIOUS_THRESHOLD,
};