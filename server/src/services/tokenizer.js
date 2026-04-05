

const C_KEYWORDS = new Set([
  'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
  'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
  'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof',
  'static', 'struct', 'switch', 'typedef', 'union', 'unsigned', 'void',
  'volatile', 'while',
]);

const CPP_KEYWORDS = new Set([
  ...C_KEYWORDS,
  'asm', 'bool', 'catch', 'class', 'const_cast', 'delete', 'dynamic_cast',
  'explicit', 'export', 'false', 'friend', 'inline', 'mutable', 'namespace',
  'new', 'operator', 'private', 'protected', 'public', 'reinterpret_cast',
  'static_cast', 'template', 'this', 'throw', 'true', 'try', 'typeid',
  'typename', 'using', 'virtual', 'wchar_t',
  'nullptr', 'override', 'final', 'noexcept', 'constexpr', 'decltype',
  'auto', 'alignas', 'alignof', 'char16_t', 'char32_t', 'static_assert',
  'thread_local',
]);

const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
  'while', 'with', 'yield',
]);

const KEYWORD_MAP = {
  c: C_KEYWORDS,
  cpp: CPP_KEYWORDS,
  python: PYTHON_KEYWORDS,
};


const OPERATORS = new Set([
  '+', '-', '*', '/', '%', '=', '==', '!=', '<', '>', '<=', '>=',
  '&&', '||', '!', '&', '|', '^', '~', '<<', '>>', '++', '--',
  '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=',
  '->', '.', '::', '?', ':', '**', '//', '**=', '//=',
]);

const DELIMITERS = new Set([
  '(', ')', '{', '}', '[', ']', ';', ',', '.',
]);


class Token {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }

  toString() {
    return `${this.type}:${this.value}`;
  }
}



function tokenize(code, language) {
  const keywords = KEYWORD_MAP[language.toLowerCase()] || C_KEYWORDS;
  const tokens = [];
  let i = 0;

  while (i < code.length) {

    if (/\s/.test(code[i])) {
      i++;
      continue;
    }

    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i];
      let str = quote;
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\\') {
          str += code[i];
          i++;
        }
        if (i < code.length) {
          str += code[i];
          i++;
        }
      }
      if (i < code.length) {
        str += code[i];
        i++;
      }
      tokens.push(new Token('STRING', str));
      continue;
    }

    if (/[0-9]/.test(code[i]) || (code[i] === '.' && i + 1 < code.length && /[0-9]/.test(code[i + 1]))) {
      let num = '';

      if (code[i] === '0' && i + 1 < code.length && (code[i + 1] === 'x' || code[i + 1] === 'X')) {
        num += code[i] + code[i + 1];
        i += 2;
        while (i < code.length && /[0-9a-fA-F]/.test(code[i])) {
          num += code[i];
          i++;
        }
      } else {
        while (i < code.length && /[0-9.]/.test(code[i])) {
          num += code[i];
          i++;
        }

        if (i < code.length && (code[i] === 'e' || code[i] === 'E')) {
          num += code[i];
          i++;
          if (i < code.length && (code[i] === '+' || code[i] === '-')) {
            num += code[i];
            i++;
          }
          while (i < code.length && /[0-9]/.test(code[i])) {
            num += code[i];
            i++;
          }
        }
      }

      while (i < code.length && /[fFlLuU]/.test(code[i])) {
        num += code[i];
        i++;
      }
      tokens.push(new Token('NUMBER', num));
      continue;
    }

    if (/[a-zA-Z_]/.test(code[i])) {
      let word = '';
      while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
        word += code[i];
        i++;
      }
      if (keywords.has(word)) {
        tokens.push(new Token('KEYWORD', word));
      } else {
        tokens.push(new Token('IDENTIFIER', word));
      }
      continue;
    }


    if (i + 2 < code.length) {
      const three = code.substring(i, i + 3);
      if (OPERATORS.has(three)) {
        tokens.push(new Token('OPERATOR', three));
        i += 3;
        continue;
      }
    }
    if (i + 1 < code.length) {
      const two = code.substring(i, i + 2);
      if (OPERATORS.has(two)) {
        tokens.push(new Token('OPERATOR', two));
        i += 2;
        continue;
      }
    }

    const one = code[i];
    if (OPERATORS.has(one)) {
      tokens.push(new Token('OPERATOR', one));
      i++;
      continue;
    }

    if (DELIMITERS.has(one)) {
      tokens.push(new Token('DELIMITER', one));
      i++;
      continue;
    }

    if (one === '#') {
      let directive = '#';
      i++;
      while (i < code.length && code[i] !== '\n') {
        directive += code[i];
        i++;
      }
      tokens.push(new Token('DIRECTIVE', directive.trim()));
      continue;
    }

    tokens.push(new Token('UNKNOWN', one));
    i++;
  }

  return tokens;
}


function getTokenTypeSequence(tokens) {
  return tokens.map(t => t.type);
}


function getTokenValueSequence(tokens) {
  return tokens.map(t => t.toString());
}

module.exports = {
  tokenize,
  getTokenTypeSequence,
  getTokenValueSequence,
  Token,
  C_KEYWORDS,
  CPP_KEYWORDS,
  PYTHON_KEYWORDS,
};
