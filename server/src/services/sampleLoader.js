const fs = require('fs');
const path = require('path');
const staticSamples = require('../data/sampleCodes');

const LANGUAGE_CONFIG = {
  c: {
    label: 'C Language',
    extensions: new Set(['.c', '.h']),
  },
  cpp: {
    label: 'C++ Language',
    extensions: new Set(['.cpp', '.cc', '.cxx', '.hpp', '.hh']),
  },
  python: {
    label: 'Python Language',
    extensions: new Set(['.py', '.pyw']),
  },
};

function getSamplesRootDir() {
  const configured = process.env.SAMPLE_CODES_DIR || '../sample-library';
  return path.resolve(process.cwd(), configured);
}

function collectFilesRecursively(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFilesRecursively(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function makeDescription(fileName) {
  return fileName
    .replace(path.extname(fileName), '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'Sample code';
}

function loadLanguageSamples(languageKey, languageDir) {
  const config = LANGUAGE_CONFIG[languageKey];
  const files = collectFilesRecursively(languageDir)
    .filter((filePath) => config.extensions.has(path.extname(filePath).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  const items = [];
  for (const filePath of files) {
    const name = path.basename(filePath);
    const code = fs.readFileSync(filePath, 'utf-8');
    items.push({
      name,
      description: makeDescription(name),
      code,
    });
  }

  return {
    label: config.label,
    files: items,
  };
}

function loadDynamicSamples() {
  const root = getSamplesRootDir();
  if (!fs.existsSync(root)) return {};

  const result = {};
  for (const languageKey of Object.keys(LANGUAGE_CONFIG)) {
    const languageDir = path.join(root, languageKey);
    const langSamples = loadLanguageSamples(languageKey, languageDir);
    if (langSamples.files.length > 0) {
      result[languageKey] = langSamples;
    }
  }

  return result;
}

function getAllSamples() {
  const dynamic = loadDynamicSamples();
  if (Object.keys(dynamic).length > 0) {
    return dynamic;
  }
  return staticSamples;
}

function getSamplesByLanguage(language) {
  const all = getAllSamples();
  return all[language] || null;
}

module.exports = {
  getAllSamples,
  getSamplesByLanguage,
  getSamplesRootDir,
};
