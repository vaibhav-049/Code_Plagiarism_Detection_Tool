# Graph Report - C:\Users\vrajp\Desktop\compiler new  (2026-04-11)

## Corpus Check
- Corpus is ~6,200 words - fits in a single context window. You may not need a graph.

## Summary
- 65 nodes · 75 edges · 17 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `preprocess()` - 6 edges
2. `comparePair()` - 5 edges
3. `isValidSessionId()` - 4 edges
4. `calculateASTSimilarity()` - 4 edges
5. `updateFileList()` - 3 edges
6. `extractAstMetadata()` - 3 edges
7. `multisetJaccard()` - 3 edges
8. `lcsLength()` - 3 edges
9. `lcsLengthSampled()` - 3 edges
10. `lcsSimilarity()` - 3 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "app"
Cohesion: 0.31
Nodes (9): addFiles(), fetchResults(), fetchSamples(), loadSampleFile(), renderResults(), renderSampleButtons(), renderSampleFiles(), toggleLang() (+1 more)

### Community 1 - "similarity"
Cohesion: 0.42
Nodes (8): compareAll(), comparePair(), cosineSimilarity(), jaccardSimilarity(), lcsLength(), lcsLengthSampled(), lcsLengthSmall(), lcsSimilarity()

### Community 2 - "analysiscontroller"
Cohesion: 0.48
Nodes (6): deleteSession(), getReport(), getResults(), isValidSessionId(), sanitizeFilename(), uploadAndAnalyze()

### Community 3 - "astparser"
Cohesion: 0.52
Nodes (6): buildAST(), calculateASTSimilarity(), countMap(), extractAstMetadata(), multisetJaccard(), ratioSimilarity()

### Community 4 - "preprocessor"
Cohesion: 0.52
Nodes (6): normalizeWhitespace(), preprocess(), removeBlankLines(), removeCMultiLineComments(), removePythonDocstrings(), removeSingleLineComments()

### Community 5 - "normalizer"
Cohesion: 0.4
Nodes (0): 

### Community 6 - "languagedetector"
Cohesion: 0.5
Nodes (0): 

### Community 7 - "different"
Cohesion: 1.0
Nodes (2): calculate_area(), main()

### Community 8 - "api"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "reportgenerator"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "copied_renamed"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "original"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "graphify_pipeline"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "vite_config"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "index"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "samplecodes"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "database"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `api`** (2 nodes): `api.js`, `fileFilter()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `reportgenerator`** (2 nodes): `reportGenerator.js`, `generateReport()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `copied_renamed`** (2 nodes): `copied_renamed.c`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `original`** (2 nodes): `original.c`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `graphify_pipeline`** (1 nodes): `graphify_pipeline.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `vite_config`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `index`** (1 nodes): `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `samplecodes`** (1 nodes): `sampleCodes.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `database`** (1 nodes): `database.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Not enough signal to generate questions. This usually means the corpus has no AMBIGUOUS edges, no bridge nodes, no INFERRED relationships, and all communities are tightly cohesive. Add more files or run with --mode deep to extract richer edges._