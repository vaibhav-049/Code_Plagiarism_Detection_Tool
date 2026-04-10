const { tokenize } = require('./tokenizer');

/**
 * Fallback AST Parser
 * Note: Since tree-sitter couldn't compile natively (node-gyp error),
 * we fall back to a custom hierarchical scope-based semantic parser.
 */
function buildAST(code, language) {
  const tokens = tokenize(code, language);
  const root = { type: 'Program', depth: 0, children: [], functions: [] };
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

  return { ast: root, totalTokens: tokens.length };
}

/**
 * Calculates a semantic structural similarity between two trees
 */
function calculateASTSimilarity(astA, astB) {
  function getFingerprint(node) {
    let fp = [];
    if (node.type === 'ControlFlow') fp.push(node.value);
    if (node.children) {
      for (const child of node.children) {
        fp = fp.concat(getFingerprint(child));
      }
    }
    return fp;
  }

  const fpA = getFingerprint(astA);
  const fpB = getFingerprint(astB);

  // Compute Jaccard on Control Flow Fingerprints
  const setA = new Set(fpA);
  const setB = new Set(fpB);
  
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

module.exports = { buildAST, calculateASTSimilarity };
