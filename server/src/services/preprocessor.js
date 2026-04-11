


function removeSingleLineComments(code, style = '//') {
  const lines = code.split('\n');
  return lines.map(line => {
    let inString = false;
    let stringChar = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inString) {
        if (ch === '\\') { i++; continue; }
        if (ch === stringChar) inString = false;
      } else {
        if (ch === '"' || ch === "'") {
          inString = true;
          stringChar = ch;
        } else if (line.substring(i, i + style.length) === style) {
          return line.substring(0, i);
        }
      }
    }
    return line;
  }).join('\n');
}


function removeCMultiLineComments(code) {
  let result = '';
  let i = 0;
  let inString = false;
  let stringChar = '';

  while (i < code.length) {
    if (inString) {
      if (code[i] === '\\') {
        result += code[i] + (code[i + 1] || '');
        i += 2;
        continue;
      }
      if (code[i] === stringChar) inString = false;
      result += code[i];
      i++;
    } else {
      if (code[i] === '"' || code[i] === "'") {
        inString = true;
        stringChar = code[i];
        result += code[i];
        i++;
      } else if (code[i] === '/' && code[i + 1] === '*') {
        i += 2;
        while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
          i++;
        }
        i += 2;
      } else {
        result += code[i];
        i++;
      }
    }
  }

  return result;
}


function removePythonDocstrings(code) {
  let result = '';
  let i = 0;

  while (i < code.length) {
    if (
      (code.substring(i, i + 3) === '"""' || code.substring(i, i + 3) === "'''")
    ) {
      const quote = code.substring(i, i + 3);
      i += 3;
      while (i < code.length && code.substring(i, i + 3) !== quote) {
        i++;
      }
      i += 3;
    } else {
      result += code[i];
      i++;
    }
  }

  return result;
}


function removeBlankLines(code) {
  return code
    .split('\n')
    .map(line => line.trimEnd())
    .filter(line => line.trim().length > 0)
    .join('\n');
}


function normalizeWhitespace(code) {
  return code
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .join('\n');
}

function normalizePythonWhitespace(code) {
  return code
    .split('\n')
    .map(line => line.replace(/\t/g, '    ').replace(/\s+$/g, ''))
    .join('\n');
}


function preprocess(code, language) {
  let processed = code;

  switch (language.toLowerCase()) {
    case 'c':
    case 'cpp':
    case 'java':
    case 'javascript':
      processed = removeCMultiLineComments(processed);
      processed = removeSingleLineComments(processed, '//');
      break;

    case 'python':
      processed = removePythonDocstrings(processed);
      processed = removeSingleLineComments(processed, '#');
      break;

    default:
      processed = removeCMultiLineComments(processed);
      processed = removeSingleLineComments(processed, '//');
      processed = removeSingleLineComments(processed, '#');
      break;
  }

  processed = removeBlankLines(processed);
  if (language.toLowerCase() === 'python') {
    processed = normalizePythonWhitespace(processed);
  } else {
    processed = normalizeWhitespace(processed);
  }

  return processed;
}

module.exports = {
  preprocess,
  removeSingleLineComments,
  removeCMultiLineComments,
  removePythonDocstrings,
  removeBlankLines,
  normalizeWhitespace,
  normalizePythonWhitespace,
};
