

const { buildNgrams, buildFrequencyMap } = require('./normalizer');



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


const WEIGHTS = {
  jaccard: 0.35,
  cosine: 0.35,
  lcs: 0.30,
};

const SUSPICIOUS_THRESHOLD = 0.60;


function comparePair(fileA, fileB) {
  const jaccard = jaccardSimilarity(fileA.tokens, fileB.tokens);
  const cosine = cosineSimilarity(fileA.tokens, fileB.tokens);
  const lcs = lcsSimilarity(fileA.tokens, fileB.tokens);

  const overall =
    WEIGHTS.jaccard * jaccard +
    WEIGHTS.cosine * cosine +
    WEIGHTS.lcs * lcs;

  const rounded = Math.round(overall * 10000) / 10000;

  return {
    file1Id: fileA.id,
    file2Id: fileB.id,
    file1Name: fileA.name,
    file2Name: fileB.name,
    jaccardScore: Math.round(jaccard * 10000) / 10000,
    cosineScore: Math.round(cosine * 10000) / 10000,
    lcsScore: Math.round(lcs * 10000) / 10000,
    overallScore: rounded,
    isSuspicious: rounded >= SUSPICIOUS_THRESHOLD,
    matchedTokens: Math.round(lcs * (fileA.tokenCount + fileB.tokenCount) / 2),
  };
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