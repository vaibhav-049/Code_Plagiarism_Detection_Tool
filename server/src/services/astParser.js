const { tokenize } = require('./tokenizer');

/**
 * Fallback AST Parser
 * Note: Since tree-sitter couldn't compile natively (node-gyp error),
 * we fall back to a custom hierarchical scope-based semantic parser.
 */
function buildAST(code, language) {
  const tokens = tokenize(code, language);
  const root = { type: 'Program', depth: 0, children: [], functions: [], weight: 0 };
  let currentScope = root;
  const scopeStack = [root];

  // Helper to detect functions based on keywords and parens
  let inFunctionDecl = false;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    
    // C-style Block Scoping
    if (t.type === 'DELIMITER' && t.value === '{') {
      const parent = scopeStack[scopeStack.length - 1];
      const newScope = { 
        type: 'Block', 
        depth: parent.depth + 1, 
        children: [],
        weight: 0 
      };
      parent.children.push(newScope);
      scopeStack.push(newScope);
      currentScope = newScope;
    } 
    else if (t.type === 'DELIMITER' && t.value === '}') {
      if (scopeStack.length > 1) {
        scopeStack.pop();
        currentScope = scopeStack[scopeStack.length - 1];
      }
    } 
    else {
      // We weight certain logical patterns heavier for CFG comparison
      let weight = 1;
      if (t.type === 'KEYWORD') {
        if (['for', 'while', 'if', 'else', 'switch'].includes(t.value)) {
          weight = 5; // Control flow altering
          currentScope.children.push({ type: 'ControlFlow', value: t.value, weight });
          continue;
        }
      }
      currentScope.children.push({ type: 'Node', token: t, weight });
      currentScope.weight = (currentScope.weight || 0) + weight;
    }
  }

  const metadata = extractAstMetadata(root);
  return { ast: root, totalTokens: tokens.length, metadata };
}

function extractAstMetadata(ast) {
  const controlFlow = [];
  let blockCount = 0;
  let nodeCount = 0;
  let maxDepth = 0;

  function walk(node, depth) {
    if (!node) return;
    nodeCount++;
    if (depth > maxDepth) maxDepth = depth;

    if (node.type === 'Block') blockCount++;
    if (node.type === 'ControlFlow' && node.value) controlFlow.push(node.value);

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        walk(child, depth + 1);
      }
    }
  }

  walk(ast, 0);

  return {
    nodeCount,
    blockCount,
    maxDepth,
    controlFlow,
  };
}

function countMap(items) {
  const map = new Map();
  for (const item of items) {
    map.set(item, (map.get(item) || 0) + 1);
  }
  return map;
}

function multisetJaccard(itemsA, itemsB) {
  const a = countMap(itemsA);
  const b = countMap(itemsB);
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

/**
 * Calculates a semantic structural similarity between two trees
 */
function calculateASTSimilarity(astA, astB) {
  const metaA = extractAstMetadata(astA);
  const metaB = extractAstMetadata(astB);

  const flowScore = multisetJaccard(metaA.controlFlow, metaB.controlFlow);
  const depthScore = ratioSimilarity(metaA.maxDepth, metaB.maxDepth);
  const blockScore = ratioSimilarity(metaA.blockCount, metaB.blockCount);
  const nodeScore = ratioSimilarity(metaA.nodeCount, metaB.nodeCount);

  let score;
  if (metaA.controlFlow.length === 0 && metaB.controlFlow.length === 0) {
    score = 0.5 * depthScore + 0.3 * blockScore + 0.2 * nodeScore;
  } else {
    score = 0.55 * flowScore + 0.2 * depthScore + 0.15 * blockScore + 0.1 * nodeScore;
  }

  if (score < 0) return 0;
  if (score > 1) return 1;
  return score;
}

module.exports = { buildAST, calculateASTSimilarity };
