

const { Token } = require('./tokenizer');


function normalizeTokens(tokens) {
  const idMap = new Map();
  let idCounter = 1;
  const normalized = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'IDENTIFIER': {
        if (!idMap.has(token.value)) {
          idMap.set(token.value, `ID${idCounter}`);
          idCounter++;
        }
        normalized.push(new Token('IDENTIFIER', idMap.get(token.value)));
        break;
      }
      case 'STRING':
        normalized.push(new Token('STRING', '"STR"'));
        break;
      case 'NUMBER':
        normalized.push(new Token('NUMBER', '0'));
        break;
      case 'DIRECTIVE':
        break;
      default:
        normalized.push(new Token(token.type, token.value));
        break;
    }
  }

  return { normalized, idMap };
}


function tokensToFingerprint(tokens) {
  return tokens.map(t => t.toString()).join(' ');
}


function buildNgrams(tokens, n = 4) {
  const values = tokens.map(t => t.toString());
  const ngrams = [];
  for (let i = 0; i <= values.length - n; i++) {
    ngrams.push(values.slice(i, i + n).join(' '));
  }
  return ngrams;
}


function buildFrequencyMap(tokens) {
  const freq = new Map();
  for (const t of tokens) {
    const key = t.toString();
    freq.set(key, (freq.get(key) || 0) + 1);
  }
  return freq;
}

module.exports = {
  normalizeTokens,
  tokensToFingerprint,
  buildNgrams,
  buildFrequencyMap,
};
