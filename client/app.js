let currentFiles = [];
let sampleData = null;
let currentLang = null;
let currentPairs = [];
let currentReport = null;

window.showPage = function(pageId) {
    document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(`page-${pageId}`).classList.remove('hidden');
    if(pageId === 'upload' && !sampleData) {
        fetchSamples();
    }
}

async function fetchSamples() {
    try {
        const res = await axios.get('/api/samples');
        sampleData = res.data;
        renderSampleButtons();
    } catch(e) {
        console.error("Failed to load samples");
    }
}

function renderSampleButtons() {
    const container = document.getElementById('samples-buttons');
    container.innerHTML = '';
    Object.keys(sampleData).forEach(key => {
        const btn = document.createElement('button');
        btn.className = "cursor-pointer px-5 py-2.5 bg-white/5 text-gray-300 border border-white/10 rounded-lg font-medium hover:bg-white/10 hover:text-white transition-all duration-300 capitalize text-sm tracking-wide";
        btn.innerText = sampleData[key].label;
        btn.onclick = () => toggleLang(key, btn);
        container.appendChild(btn);
    });
}

function toggleLang(key, btnElem) {
    const listDiv = document.getElementById('samples-files');
    const placeholder = document.getElementById('samples-placeholder');
    if (currentLang === key) {
        listDiv.classList.add('hidden');
        placeholder.classList.remove('hidden');
        currentLang = null;
        document.querySelectorAll('#samples-buttons button').forEach(b => b.classList.remove('sample-active'));
        return;
    }
    document.querySelectorAll('#samples-buttons button').forEach(b => b.classList.remove('sample-active'));
    btnElem.classList.add('sample-active');
    currentLang = key;
    placeholder.classList.add('hidden');
    listDiv.classList.remove('hidden');
    renderSampleFiles(key);
}

window.removeFile = function(name) {
    currentFiles = currentFiles.filter(f => f.name !== name);
    updateFileList();
    if (currentLang) renderSampleFiles(currentLang);
}

function renderSampleFiles(key) {
    const listDiv = document.getElementById('samples-files');
    listDiv.innerHTML = '';
    sampleData[key].files.forEach(f => {
        const loaded = currentFiles.some(file => file.name === f.name);
        const card = document.createElement('div');
        card.className = `p-4 rounded-xl shadow-sm border flex justify-between items-center transition-all duration-300 ${loaded ? 'bg-purple-900/10 border-purple-500/30' : 'bg-black/40 border-white/5 hover:bg-black/60 hover:border-cyan-500/30'}`;
        
        card.innerHTML = `
            <div>
                <div class="font-bold text-gray-200 font-mono text-sm mb-1">${f.name}</div>
                <div class="text-xs text-gray-500 line-clamp-1">${f.description}</div>
            </div>
            <button class="cursor-pointer font-bold transition-all px-3 py-1.5 rounded-lg text-xs tracking-wider ${loaded ? 'text-red-400 bg-red-400/10 hover:bg-red-400/20' : 'text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 hover:shadow-[0_0_10px_cyan]'}">
                ${loaded ? 'REMOVE' : 'ADD'}
            </button>
        `;
        const btn = card.querySelector('button');
        btn.onclick = () => {
            if(loaded) {
                window.removeFile(f.name);
            } else {
                loadSampleFile(f);
                renderSampleFiles(key);
            }
        };
        listDiv.appendChild(card);
    });
}

function loadSampleFile(f) {
    const blob = new Blob([f.code], { type: 'text/plain' });
    const file = new File([blob], f.name, { type: 'text/plain' });
    if(!currentFiles.some(existing => existing.name === f.name)) {
        currentFiles.push(file);
        updateFileList();
    }
}

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
dropzone.onclick = () => fileInput.click();
dropzone.ondragover = (e) => { e.preventDefault(); dropzone.classList.add('bg-white/10'); dropzone.classList.add('border-cyan-400'); }
dropzone.ondragleave = () => { dropzone.classList.remove('bg-white/10'); dropzone.classList.remove('border-cyan-400'); }
dropzone.ondrop = (e) => {
    e.preventDefault();
    dropzone.classList.remove('bg-white/10'); dropzone.classList.remove('border-cyan-400');
    addFiles(e.dataTransfer.files);
};
fileInput.onchange = (e) => addFiles(e.target.files);

function addFiles(files) {
    Array.from(files).forEach(f => {
        if(!currentFiles.some(existing => existing.name === f.name)) {
            currentFiles.push(f);
        }
    });
    updateFileList();
}

function updateFileList() {
    const list = document.getElementById('file-list');
    list.innerHTML = '';
    currentFiles.forEach(f => {
        const li = document.createElement('li');
        li.className = "flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/10 group hover:border-purple-500/50 transition-colors";
        li.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="bg-gradient-to-br from-purple-600 to-cyan-600 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-inner">
                    ${f.name.split('.').pop().toUpperCase()}
                </div>
                <div class="flex flex-col">
                    <span class="font-medium text-gray-200">${f.name}</span>
                    <span class="text-xs text-gray-500">${(f.size / 1024).toFixed(1)} KB</span>
                </div>
            </div>
            <button class="text-gray-500 hover:text-red-400 font-bold p-2 cursor-pointer transition-colors" onclick="removeFile('${f.name}')">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        `;
        list.appendChild(li);
    });
    const btn = document.getElementById('analyze-btn');
    document.getElementById('file-count-badge').innerText = `${currentFiles.length} files`;
    btn.disabled = currentFiles.length < 2;
    document.getElementById('error-message').classList.add('hidden');
}

document.getElementById('analyze-btn').onclick = async () => {
    if(currentFiles.length < 2) return;
    
    showPage('loading');
    const formData = new FormData();
    currentFiles.forEach(f => formData.append('files', f));
    
    let text = document.getElementById('loading-text');
    let phrases = [
      '> Initializing Tokenizer...',
      '> Stripping Whitespace & Comments...',
      '> Analyzing AST Representations...',
            '> Running Semantic Heuristics...',
      '> Computing Similarity Matrix...'
    ];
    let i = 0;
    let t = setInterval(()=> {
      i = (i+1)%phrases.length;
      text.innerHTML = phrases[i];
    }, 800);

    try {
        const res = await axios.post('/api/upload', formData);
        clearInterval(t);
        fetchResults(res.data.sessionId);
    } catch(err) {
        clearInterval(t);
        document.getElementById('error-message').innerText = err.response?.data?.error || "Execution failed check connection.";
        document.getElementById('error-message').classList.remove('hidden');
        showPage('upload');
    }
};

async function fetchResults(sessionId) {
    try {
        const res = await axios.get('/api/results/' + sessionId);
        renderResults(sessionId, res.data.report);
    } catch(e) {
        alert("Fatal error reconstructing report payload.");
        showPage('upload');
    }
}

function renderResults(sessionId, report) {
    document.getElementById('result-session-id').innerText = "Session ID: " + sessionId;
    currentReport = report;
    
    const { summary, pairs, suspiciousPairs, matrix, files } = report;
    currentPairs = pairs;
    
    const formatPct = (val) => (val * 100).toFixed(1) + '%';
    
    const statCard = (val, label, isDanger = false, isWarn = false) => `
        <div class="bg-black/30 p-5 rounded-2xl border border-white/5 text-center transition-all hover:-translate-y-1 hover:border-white/20 hover:shadow-lg">
            <div class="text-3xl font-black mb-2 font-mono tracking-tighter ${isDanger ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]' : isWarn ? 'text-amber-400' : 'text-white'}">${val}</div>
            <div class="text-xs text-gray-500 uppercase tracking-widest font-semibold">${label}</div>
        </div>
    `;

    document.getElementById('summary-cards').innerHTML = `
        ${statCard(summary.totalFiles, 'Files')}
        ${statCard(summary.totalComparisons, 'Comparisons')}
        ${statCard(summary.suspiciousPairs, 'Suspicious', summary.suspiciousPairs > 0)}
        ${statCard(formatPct(summary.averageLexical || 0), 'Avg Lexical')}
        ${statCard(formatPct(summary.averageAst || 0), 'Avg AST')}
        ${statCard(formatPct(summary.averageSemantic || 0), 'Avg Semantic')}
        ${statCard(formatPct(summary.averageCfg || 0), 'Avg CFG')}
        ${statCard(formatPct(summary.averageSymbol || 0), 'Avg Symbol')}
        ${statCard(formatPct(summary.maxSimilarity), 'Max Match', summary.maxSimilarity >= 0.6)}
        ${statCard(formatPct(summary.averageSimilarity), 'Avg Overall', false, summary.averageSimilarity >= 0.4)}
    `;
    
    if (suspiciousPairs.length > 0) {
        document.getElementById('suspicious-pairs-container').classList.remove('hidden');
        const tb = document.querySelector('#suspicious-pairs-table tbody');
        tb.innerHTML = '';
        suspiciousPairs.forEach(p => {
            const copiedFnCount = (p.functionMatches || []).length;
            tb.innerHTML += `<tr class="hover:bg-red-500/10 transition-colors">
                <td class="p-4 font-mono font-bold text-gray-200">${p.file1}</td>
                <td class="p-4 font-mono font-bold text-gray-200">${p.file2}</td>
                <td class="p-4 text-center text-sm text-cyan-300 font-semibold">${formatPct(p.lexical || 0)}</td>
                <td class="p-4 text-center text-sm text-purple-300 font-semibold">${formatPct(p.ast || 0)}</td>
                <td class="p-4 text-center text-sm text-emerald-300 font-semibold">${formatPct(p.semantic || 0)}</td>
                <td class="p-4 text-center text-sm text-cyan-200 font-semibold">${copiedFnCount}</td>
                <td class="p-4 text-center text-xs text-amber-300 font-semibold">${p.cloneType || 'NO_CLONE'}</td>
                <td class="p-4 font-black font-mono text-right text-red-500 drop-shadow-[0_0_8px_red] text-lg">${formatPct(p.overall)}</td>
            </tr>`;
        });
    } else {
        document.getElementById('suspicious-pairs-container').classList.add('hidden');
    }
    
    const allTb = document.querySelector('#all-pairs-table tbody');
    allTb.innerHTML = '';
    pairs.forEach((p, idx) => {
        const copiedFnCount = (p.functionMatches || []).length;
        let scoreCls = 'score-low';
        let badge = '<span class="status-badge-ok px-3 py-1 rounded-full text-[10px] font-black tracking-widest">CLEAN</span>';
        if(p.overall >= 0.6) {
          scoreCls = 'score-high';
          badge = '<span class="status-badge-sus px-3 py-1 rounded-full text-[10px] font-black tracking-widest animate-pulse">CRITICAL</span>';
        }
        else if(p.overall >= 0.35) {
          scoreCls = 'score-medium';
          badge = '<span class="bg-yellow-900/30 text-yellow-500 border border-yellow-700/50 px-3 py-1 rounded-full text-[10px] font-black tracking-widest">WARNING</span>';
        }
        
        allTb.innerHTML += `<tr class="hover:bg-white/[0.02] transition-colors cursor-pointer" onclick="showPairExplain(${idx})">
            <td class="p-4 font-mono text-gray-300 font-medium">${p.file1}</td>
            <td class="p-4 font-mono text-gray-300 font-medium">${p.file2}</td>
            <td class="p-4 text-center text-sm text-cyan-300 font-semibold">${formatPct(p.lexical || 0)}</td>
            <td class="p-4 text-center text-sm text-purple-300 font-semibold">${formatPct(p.ast || 0)}</td>
            <td class="p-4 text-center text-sm text-emerald-300 font-semibold">${formatPct(p.semantic || 0)}</td>
            <td class="p-4 text-center text-sm text-teal-300 font-semibold">${formatPct(p.cfgSimilarity || 0)}</td>
            <td class="p-4 text-center text-sm text-cyan-200 font-semibold">${copiedFnCount}</td>
            <td class="p-4 text-center text-[11px] text-amber-300 font-semibold">${p.cloneType || 'NO_CLONE'}</td>
            <td class="p-4 text-center text-base ${scoreCls}">${formatPct(p.overall)}</td>
            <td class="p-4 text-center">${badge}</td>
        </tr>`;
    });

    if (pairs.length > 0) {
        showPairExplain(0);
    }

    // Render Matrix
    const fileNames = files.map(f => f.name);
    let matrixHTML = `<thead><tr><th class="matrix-cell"></th>`;
    fileNames.forEach(n => {
        matrixHTML += `<th class="matrix-header font-bold tracking-wider">${n.length > 10 ? n.slice(0, 8)+'...' : n}</th>`;
    });
    matrixHTML += `</tr></thead><tbody>`;

    fileNames.forEach((rowName) => {
        matrixHTML += `<tr><th class="text-right pr-4 text-gray-400 font-semibold text-xs whitespace-nowrap">${rowName.length > 12 ? rowName.slice(0,10)+'...' : rowName}</th>`;
        fileNames.forEach((colName) => {
            if (rowName === colName) {
                matrixHTML += `<td class="matrix-cell bg-white/5 border border-white/5 text-gray-600">-</td>`;
            } else {
                const val = matrix[rowName] && matrix[rowName][colName] ? matrix[rowName][colName] : 0;
                
                let bgSrc = `rgba(124, 58, 237, ${val*0.8})`; // Purple base
                if(val >= 0.6) bgSrc = `rgba(239, 68, 68, ${val})`; // Red high
                else if(val < 0.3) bgSrc = `rgba(6, 182, 212, ${val*0.5})`; // Cyan low
                
                matrixHTML += `<td class="matrix-cell border border-white/5" style="background: ${bgSrc};" title="${rowName} vs ${colName}: ${formatPct(val)}">
                    ${formatPct(val)}
                </td>`;
            }
        });
        matrixHTML += `</tr>`;
    });
    matrixHTML += `</tbody>`;
    document.getElementById('matrix-table').innerHTML = matrixHTML;
    
    showPage('results');
}

window.showPairExplain = function(index) {
        const panel = document.getElementById('explain-panel');
        const pair = currentPairs[index];
        if (!pair || !panel) return;

        const keywords = pair.heatmap?.sharedKeywords || [];
        const operators = pair.heatmap?.sharedOperators || [];
        const ngrams = pair.heatmap?.sharedNgrams || [];
        const flowOverlapValue = pair.heatmap?.controlFlowOverlap || 0;
        const astView = pair.heatmap?.astView || {};
        const compiler = pair.heatmap?.compiler || {};
        const functionMatches = compiler.functionMatches || pair.functionMatches || [];
        const fingerprintMap = pair.functionFingerprints || { fileA: [], fileB: [] };
        const fingerprintA = fingerprintMap.fileA || [];
        const fingerprintB = fingerprintMap.fileB || [];
        const complexityA = (compiler.complexity && compiler.complexity.fileA) || (pair.complexity && pair.complexity.fileA) || {};
        const complexityB = (compiler.complexity && compiler.complexity.fileB) || (pair.complexity && pair.complexity.fileB) || {};

        const astList = (items) => {
            if (!items || items.length === 0) return '<span class="text-gray-500">None</span>';
            return items.map(v => `<span class="heatmap-chip heatmap-chip-ast">${v}</span>`).join('');
        };

        const astMetricBar = (label, a, b) => {
            const max = Math.max(a || 0, b || 0, 1);
            const aPct = ((a || 0) / max) * 100;
            const bPct = ((b || 0) / max) * 100;
            return `
                <div class="space-y-1">
                    <div class="text-xs text-gray-400">${label}</div>
                    <div class="flex items-center gap-2">
                        <div class="ast-mini-label text-cyan-300">A</div>
                        <div class="heatmap-bar-track flex-1"><div class="heatmap-bar-fill heatmap-lexical" style="width:${aPct}%"></div></div>
                        <div class="ast-mini-value">${a || 0}</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="ast-mini-label text-purple-300">B</div>
                        <div class="heatmap-bar-track flex-1"><div class="heatmap-bar-fill heatmap-ast" style="width:${bPct}%"></div></div>
                        <div class="ast-mini-value">${b || 0}</div>
                    </div>
                </div>
            `;
        };

        const renderChips = (items, chipClass) => {
            if (!items || items.length === 0) return '<span class="text-gray-500">None</span>';
            return items.map(item => {
                const safeValue = String(item.value)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
                return `<span class="heatmap-chip ${chipClass}">${safeValue} <span class="heatmap-chip-count">x${item.strength}</span></span>`;
            }).join('');
        };

        const renderBar = (label, value, barClass) => {
            const clamped = Math.max(0, Math.min(1, value || 0));
            const pct = (clamped * 100).toFixed(1);
            return `
                <div class="space-y-1">
                    <div class="flex items-center justify-between text-xs">
                        <span class="text-gray-400">${label}</span>
                        <span class="font-mono text-gray-200">${pct}%</span>
                    </div>
                    <div class="heatmap-bar-track">
                        <div class="heatmap-bar-fill ${barClass}" style="width: ${pct}%"></div>
                    </div>
                </div>
            `;
        };

        const renderFunctionMatches = (matches) => {
            if (!matches || matches.length === 0) return '<span class="text-gray-500">No strong function-level fingerprint matches</span>';
            return matches.slice(0, 6).map(m => `
                <div class="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs space-y-2">
                    <div>
                        <span class="text-cyan-300 font-mono">${m.functionA}</span>
                        <span class="text-gray-500"> ↔ </span>
                        <span class="text-purple-300 font-mono">${m.functionB}</span>
                        <span class="text-amber-300 ml-2">${(Number(m.score || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div class="flex flex-wrap gap-1">
                        ${m.exactHashMatch ? '<span class="hash-badge hash-badge-token">TOKEN HASH MATCH</span>' : ''}
                        ${m.cfgHashMatch ? '<span class="hash-badge hash-badge-cfg">CFG HASH MATCH</span>' : ''}
                        ${(m.astHashA && m.astHashB && m.astHashA === m.astHashB) ? '<span class="hash-badge hash-badge-ast">AST HASH MATCH</span>' : ''}
                    </div>
                </div>
            `).join('');
        };

        const shortHash = (value) => value ? String(value).slice(0, 10) : 'n/a';

        const renderFingerprintList = (items) => {
            if (!items || items.length === 0) return '<span class="text-gray-500">No function fingerprints extracted</span>';
            return items.slice(0, 6).map(fn => `
                <div class="fingerprint-card">
                    <div class="text-cyan-200 font-mono text-xs mb-1">${fn.name || 'unknown_fn'}</div>
                    <div class="text-[11px] text-gray-400 font-mono">sig: ${shortHash(fn.signatureHash)}</div>
                    <div class="text-[11px] text-gray-400 font-mono">tok: ${shortHash(fn.tokenHash)}</div>
                    <div class="text-[11px] text-gray-400 font-mono">ast: ${shortHash(fn.astHash)}</div>
                    <div class="text-[11px] text-gray-400 font-mono">cfg: ${shortHash(fn.cfgHash)}</div>
                </div>
            `).join('');
        };

        panel.innerHTML = `
            <div class="space-y-4">
                <div>
                    <p class="text-cyan-300 font-semibold">${pair.file1} ↔ ${pair.file2}</p>
                    <p class="text-sm text-gray-300 mt-1"><span class="text-gray-400">Reason:</span> ${pair.explanation || 'No explanation available.'}</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    ${renderBar('Lexical overlap', pair.lexical || 0, 'heatmap-lexical')}
                    ${renderBar('AST overlap', pair.ast || 0, 'heatmap-ast')}
                    ${renderBar('Semantic overlap', pair.semantic || 0, 'heatmap-semantic')}
                </div>

                <div class="space-y-2">
                    <p class="text-xs uppercase tracking-wider text-gray-400">Top shared keywords</p>
                    <div class="heatmap-chip-wrap">${renderChips(keywords, 'heatmap-chip-keyword')}</div>
                </div>

                <div class="space-y-2">
                    <p class="text-xs uppercase tracking-wider text-gray-400">Top shared operators</p>
                    <div class="heatmap-chip-wrap">${renderChips(operators, 'heatmap-chip-operator')}</div>
                </div>

                <div class="space-y-2">
                    <p class="text-xs uppercase tracking-wider text-gray-400">Token pattern preview (shared n-grams)</p>
                    <div class="heatmap-chip-wrap">${renderChips(ngrams, 'heatmap-chip-ngram')}</div>
                </div>

                <div class="text-sm text-gray-300">
                    <span class="text-gray-400">Control-flow overlap:</span>
                    <span class="font-mono text-white"> ${(flowOverlapValue * 100).toFixed(1)}%</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    ${renderBar('CFG similarity', pair.cfgSimilarity || compiler.cfgSimilarity || 0, 'heatmap-semantic')}
                    ${renderBar('Symbol similarity', pair.symbolSimilarity || compiler.symbolSimilarity || 0, 'heatmap-ast')}
                    <div class="space-y-1">
                        <div class="text-xs text-gray-400">Clone type</div>
                        <div class="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 inline-block">
                            ${pair.cloneType || compiler.cloneType || 'NO_CLONE'}
                        </div>
                    </div>
                </div>

                <div class="space-y-2">
                    <p class="text-xs uppercase tracking-wider text-gray-400">Function fingerprint matches</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">${renderFunctionMatches(functionMatches)}</div>
                </div>

                <div class="space-y-3 ast-diff-wrap">
                    <p class="text-xs uppercase tracking-wider text-gray-400">Function fingerprint inventory</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="ast-diff-card">
                            <p class="ast-diff-title">${pair.file1} fingerprints</p>
                            <div class="space-y-2">${renderFingerprintList(fingerprintA)}</div>
                        </div>
                        <div class="ast-diff-card">
                            <p class="ast-diff-title">${pair.file2} fingerprints</p>
                            <div class="space-y-2">${renderFingerprintList(fingerprintB)}</div>
                        </div>
                    </div>
                </div>

                <div class="space-y-3 ast-diff-wrap">
                    <p class="text-xs uppercase tracking-wider text-gray-400">Complexity comparison</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        ${astMetricBar('Cyclomatic Complexity', complexityA.cyclomatic || 0, complexityB.cyclomatic || 0)}
                        ${astMetricBar('Loop Count', complexityA.loopCount || 0, complexityB.loopCount || 0)}
                        ${astMetricBar('Nesting Depth', complexityA.nestingDepth || 0, complexityB.nestingDepth || 0)}
                        ${astMetricBar('Loop Density (x1000)', Math.round((complexityA.loopDensity || 0) * 1000), Math.round((complexityB.loopDensity || 0) * 1000))}
                    </div>
                </div>

                <div class="space-y-3 ast-diff-wrap">
                    <p class="text-xs uppercase tracking-wider text-gray-400">AST Diff Viewer</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="ast-diff-card">
                            <p class="ast-diff-title">Shared control flow</p>
                            <div class="heatmap-chip-wrap">${astList(astView.sharedFlow)}</div>
                        </div>
                        <div class="ast-diff-card">
                            <p class="ast-diff-title">Only in ${pair.file1}</p>
                            <div class="heatmap-chip-wrap">${astList(astView.onlyA)}</div>
                        </div>
                        <div class="ast-diff-card md:col-span-2">
                            <p class="ast-diff-title">Only in ${pair.file2}</p>
                            <div class="heatmap-chip-wrap">${astList(astView.onlyB)}</div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        ${astMetricBar('AST Max Depth', astView.depthA, astView.depthB)}
                        ${astMetricBar('AST Block Count', astView.blockA, astView.blockB)}
                    </div>
                </div>
            </div>
        `;
};

window.exportExplainabilityReport = function() {
    if (!currentReport) return;

    const payload = {
        generatedAt: new Date().toISOString(),
        summary: currentReport.summary,
        pairs: (currentReport.pairs || []).map(p => ({
            file1: p.file1,
            file2: p.file2,
            lexical: p.lexical,
            ast: p.ast,
            semantic: p.semantic,
            overall: p.overall,
            suspicious: p.suspicious,
            crossLanguage: p.crossLanguage,
            cloneType: p.cloneType,
            cfgSimilarity: p.cfgSimilarity,
            symbolSimilarity: p.symbolSimilarity,
            functionMatches: p.functionMatches,
            complexity: p.complexity,
            explanation: p.explanation,
            heatmap: p.heatmap,
        })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phase2_explainability_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

showPage('home');
