const crypto = require('crypto');
const { normalizeTokens } = require('./normalizer');

const CONTROL_FLOW_KEYWORDS = new Set(['if', 'elif', 'else', 'for', 'while', 'switch', 'case', 'try', 'except', 'with']);
const LOOP_KEYWORDS = new Set(['for', 'while']);
const DECISION_KEYWORDS = new Set(['if', 'elif', 'for', 'while', 'case', 'except']);

function hashText(text) {
  return crypto.createHash('sha1').update(text).digest('hex');
}

function canonicalKeyword(value) {
  const key = String(value || '').toLowerCase();
  if (key === 'elif') return 'if';
  return key;
}

function tokenSimilarity(tokensA, tokensB) {
  const a = new Map();
  const b = new Map();

  for (const t of tokensA) {
    const key = `${t.type}:${t.value}`;
    a.set(key, (a.get(key) || 0) + 1);
  }
  for (const t of tokensB) {
    const key = `${t.type}:${t.value}`;
    b.set(key, (b.get(key) || 0) + 1);
  }

  const keys = new Set([...a.keys(), ...b.keys()]);
  if (keys.size === 0) return 0;

  let intersection = 0;
  let union = 0;
  for (const key of keys) {
    const av = a.get(key) || 0;
    const bv = b.get(key) || 0;
    intersection += Math.min(av, bv);
    union += Math.max(av, bv);
  }

  return union === 0 ? 0 : intersection / union;
}

function arrayMultisetSimilarity(arrA, arrB) {
  const a = new Map();
  const b = new Map();
  for (const item of arrA) a.set(item, (a.get(item) || 0) + 1);
  for (const item of arrB) b.set(item, (b.get(item) || 0) + 1);

  const keys = new Set([...a.keys(), ...b.keys()]);
  if (keys.size === 0) return 0;

  let intersection = 0;
  let union = 0;
  for (const key of keys) {
    const av = a.get(key) || 0;
    const bv = b.get(key) || 0;
    intersection += Math.min(av, bv);
    union += Math.max(av, bv);
  }

  return union === 0 ? 0 : intersection / union;
}

function ratioSimilarity(a, b) {
  if (a === 0 && b === 0) return 1;
  const max = Math.max(a, b);
  if (max === 0) return 1;
  return 1 - Math.abs(a - b) / max;
}

function sliceFunctionTokens(tokens, startIndex, language) {
  if (language === 'python') {
    let end = tokens.length;
    for (let i = startIndex + 1; i < tokens.length - 1; i++) {
      if (
        tokens[i].type === 'KEYWORD' &&
        tokens[i].value === 'def' &&
        tokens[i + 1] &&
        tokens[i + 1].type === 'IDENTIFIER'
      ) {
        end = i;
        break;
      }
    }
    return tokens.slice(startIndex, end);
  }

  let braceDepth = 0;
  let started = false;
  for (let i = startIndex; i < tokens.length; i++) {
    if (tokens[i].type === 'DELIMITER' && tokens[i].value === '{') {
      braceDepth++;
      started = true;
    } else if (tokens[i].type === 'DELIMITER' && tokens[i].value === '}') {
      braceDepth--;
      if (started && braceDepth <= 0) {
        return tokens.slice(startIndex, i + 1);
      }
    }
  }

  return tokens.slice(startIndex);
}

function extractFunctions(tokens, language) {
  const fns = [];

  if (language === 'python') {
    for (let i = 0; i < tokens.length - 1; i++) {
      if (tokens[i].type === 'KEYWORD' && tokens[i].value === 'def' && tokens[i + 1].type === 'IDENTIFIER') {
        const name = tokens[i + 1].value;
        const fnTokens = sliceFunctionTokens(tokens, i, language);
        fns.push({
          name,
          tokens: fnTokens,
        });
      }
    }
    return fns;
  }

  for (let i = 0; i < tokens.length - 3; i++) {
    if (
      tokens[i].type === 'IDENTIFIER' &&
      tokens[i + 1] && tokens[i + 1].type === 'DELIMITER' && tokens[i + 1].value === '(' &&
      tokens[i + 2] && tokens[i + 2].type !== 'DELIMITER' &&
      tokens.slice(i + 1, i + 20).some(t => t.type === 'DELIMITER' && t.value === '{')
    ) {
      const name = tokens[i].value;
      const fnTokens = sliceFunctionTokens(tokens, i, language);
      if (fnTokens.length > 0) {
        fns.push({ name, tokens: fnTokens });
      }
    }
  }

  const dedup = new Map();
  for (const fn of fns) {
    if (!dedup.has(fn.name)) dedup.set(fn.name, fn);
  }
  return [...dedup.values()];
}

function functionControlFlow(tokens) {
  return tokens
    .filter(t => t.type === 'KEYWORD' && CONTROL_FLOW_KEYWORDS.has(canonicalKeyword(t.value)))
    .map(t => canonicalKeyword(t.value));
}

function buildFunctionCFG(tokens) {
  const flow = functionControlFlow(tokens);
  const nodes = ['ENTRY'];

  for (const keyword of flow) {
    nodes.push(keyword);
  }
  nodes.push('EXIT');

  const edges = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push(`${nodes[i]}->${nodes[i + 1]}`);
  }

  for (let i = 0; i < nodes.length; i++) {
    const current = nodes[i];
    if ((current === 'if' || current === 'switch') && i + 2 < nodes.length) {
      edges.push(`${current}->${nodes[i + 2]}`);
    }
    if ((current === 'for' || current === 'while') && i - 1 >= 0) {
      edges.push(`${current}->${nodes[i - 1]}`);
    }
  }

  return {
    nodes,
    edges,
  };
}

function cfgGraphSimilarity(cfgA, cfgB, complexityA, complexityB) {
  const nodeSim = arrayMultisetSimilarity(cfgA.nodes || [], cfgB.nodes || []);
  const edgeSim = arrayMultisetSimilarity(cfgA.edges || [], cfgB.edges || []);
  const cycSim = ratioSimilarity(complexityA.cyclomatic || 0, complexityB.cyclomatic || 0);
  const loopSim = ratioSimilarity(complexityA.loopCount || 0, complexityB.loopCount || 0);

  return (0.4 * nodeSim) + (0.35 * edgeSim) + (0.15 * cycSim) + (0.1 * loopSim);
}

function functionComplexity(tokens) {
  let cyclomatic = 1;
  let loops = 0;

  for (const t of tokens) {
    if (t.type === 'KEYWORD' && DECISION_KEYWORDS.has(canonicalKeyword(t.value))) {
      cyclomatic++;
    }
    if (t.type === 'KEYWORD' && LOOP_KEYWORDS.has(canonicalKeyword(t.value))) {
      loops++;
    }
    if (t.type === 'OPERATOR' && (t.value === '&&' || t.value === '||')) {
      cyclomatic++;
    }
  }

  return {
    cyclomatic,
    loopCount: loops,
  };
}

function fingerprintFunction(fn) {
  const normalized = normalizeTokens(fn.tokens).normalized;
  const normalizedText = normalized.map(t => `${t.type}:${t.value}`).join(' ');
  const astLikeText = functionControlFlow(fn.tokens).join('>');
  const cfg = buildFunctionCFG(fn.tokens);

  return {
    name: fn.name,
    signatureHash: hashText(fn.tokens.slice(0, 12).map(t => `${t.type}:${t.value}`).join(' ')),
    tokenHash: hashText(normalizedText),
    astHash: hashText(astLikeText || 'no-flow'),
    cfgSignature: astLikeText,
    cfgHash: hashText((cfg.edges || []).join('|') || 'no-cfg-edges'),
    cfg,
    complexity: functionComplexity(fn.tokens),
  };
}

function extractFileAnalysis(file) {
  const tokens = file.rawTokens || file.tokens || [];
  const language = (file.language || '').toLowerCase();
  const functions = extractFunctions(tokens, language).map(fingerprintFunction);

  const controlFlow = tokens
    .filter(t => t.type === 'KEYWORD' && CONTROL_FLOW_KEYWORDS.has(canonicalKeyword(t.value)))
    .map(t => canonicalKeyword(t.value));

  const complexity = functionComplexity(tokens);
  const nestingDepth = file.astMeta?.maxDepth || 0;
  const loopDensity = tokens.length > 0 ? complexity.loopCount / tokens.length : 0;

  return {
    functions,
    controlFlow,
    complexity: {
      cyclomatic: complexity.cyclomatic,
      nestingDepth,
      loopDensity: Math.round(loopDensity * 10000) / 10000,
      loopCount: complexity.loopCount,
    },
  };
}

function identifierFrequencies(tokens) {
  const freq = new Map();
  for (const t of tokens) {
    if (t.type === 'IDENTIFIER') {
      freq.set(t.value, (freq.get(t.value) || 0) + 1);
    }
  }
  return freq;
}

function symbolSimilarity(fileA, fileB) {
  const tokensA = fileA.rawTokens || fileA.tokens || [];
  const tokensB = fileB.rawTokens || fileB.tokens || [];
  const a = identifierFrequencies(tokensA);
  const b = identifierFrequencies(tokensB);
  const keys = new Set([...a.keys(), ...b.keys()]);

  if (keys.size === 0) return 0;
  let intersection = 0;
  let union = 0;

  for (const key of keys) {
    const av = a.get(key) || 0;
    const bv = b.get(key) || 0;
    intersection += Math.min(av, bv);
    union += Math.max(av, bv);
  }

  return union === 0 ? 0 : intersection / union;
}

function compareFunctions(functionsA, functionsB) {
  const matches = [];

  for (const fnA of functionsA) {
    let best = null;
    let bestScore = 0;

    for (const fnB of functionsB) {
      let score = 0;
      if (fnA.tokenHash === fnB.tokenHash) score = 1;
      else {
        const cfgScore = cfgGraphSimilarity(fnA.cfg || { nodes: [], edges: [] }, fnB.cfg || { nodes: [], edges: [] }, fnA.complexity || {}, fnB.complexity || {});
        const astScore = fnA.astHash === fnB.astHash ? 1 : arrayMultisetSimilarity(
          (fnA.cfgSignature || '').split('>').filter(Boolean),
          (fnB.cfgSignature || '').split('>').filter(Boolean)
        );
        score = 0.55 * cfgScore + 0.25 * astScore + 0.2 * (fnA.cfgHash === fnB.cfgHash ? 1 : 0);
      }

      if (score > bestScore) {
        bestScore = score;
        best = fnB;
      }
    }

    if (best && bestScore >= 0.65) {
      matches.push({
        functionA: fnA.name,
        functionB: best.name,
        score: Math.round(bestScore * 10000) / 10000,
        exactHashMatch: fnA.tokenHash === best.tokenHash,
        cfgHashMatch: fnA.cfgHash === best.cfgHash,
        tokenHashA: fnA.tokenHash,
        tokenHashB: best.tokenHash,
        astHashA: fnA.astHash,
        astHashB: best.astHash,
      });
    }
  }

  matches.sort((x, y) => y.score - x.score);
  return matches.slice(0, 10);
}

function classifyClone(lexical, ast, semantic, overall) {
  if (lexical >= 0.98 && ast >= 0.95 && semantic >= 0.95) return 'TYPE_1_EXACT_COPY';
  if (lexical >= 0.82 && ast >= 0.78 && semantic >= 0.75) return 'TYPE_2_RENAMED_COPY';
  if (overall >= 0.6 && (ast >= 0.65 || semantic >= 0.65)) return 'TYPE_3_MODIFIED_COPY';
  return 'NO_CLONE';
}

function analyzeCompilerFeatures(fileA, fileB, baseScores) {
  const analysisA = extractFileAnalysis(fileA);
  const analysisB = extractFileAnalysis(fileB);

  const pairwiseCfgScores = [];
  for (const fnA of analysisA.functions) {
    let bestCfg = 0;
    for (const fnB of analysisB.functions) {
      const score = cfgGraphSimilarity(fnA.cfg || { nodes: [], edges: [] }, fnB.cfg || { nodes: [], edges: [] }, fnA.complexity || {}, fnB.complexity || {});
      if (score > bestCfg) bestCfg = score;
    }
    pairwiseCfgScores.push(bestCfg);
  }

  const fallbackCfg = arrayMultisetSimilarity(analysisA.controlFlow, analysisB.controlFlow);
  const cfgSimilarity = pairwiseCfgScores.length > 0
    ? pairwiseCfgScores.reduce((sum, value) => sum + value, 0) / pairwiseCfgScores.length
    : fallbackCfg;
  const symSimilarity = symbolSimilarity(fileA, fileB);
  const fnMatches = compareFunctions(analysisA.functions, analysisB.functions);

  const cloneType = classifyClone(
    baseScores.lexicalScore,
    baseScores.astScore,
    baseScores.semanticScore,
    baseScores.overallScore
  );

  return {
    cfgSimilarity: Math.round(cfgSimilarity * 10000) / 10000,
    symbolSimilarity: Math.round(symSimilarity * 10000) / 10000,
    functionFingerprints: {
      fileA: analysisA.functions,
      fileB: analysisB.functions,
      matches: fnMatches,
    },
    cloneType,
    complexity: {
      fileA: analysisA.complexity,
      fileB: analysisB.complexity,
    },
  };
}

module.exports = {
  analyzeCompilerFeatures,
};
