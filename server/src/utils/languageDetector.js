

const EXTENSION_MAP = {
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.hh': 'cpp',
  '.py': 'python',
  '.pyw': 'python',
  '.java': 'java',
  '.js': 'javascript',
  '.jsx': 'javascript',
};

const SUPPORTED_LANGUAGES = new Set(['c', 'cpp', 'python']);


function detectLanguage(filename) {
  const ext = '.' + filename.split('.').pop().toLowerCase();
  return EXTENSION_MAP[ext] || null;
}


function isSupported(language) {
  return SUPPORTED_LANGUAGES.has(language);
}


function acceptedExtensions() {
  return Object.entries(EXTENSION_MAP)
    .filter(([, lang]) => SUPPORTED_LANGUAGES.has(lang))
    .map(([ext]) => ext);
}

module.exports = { detectLanguage, isSupported, acceptedExtensions, SUPPORTED_LANGUAGES };
