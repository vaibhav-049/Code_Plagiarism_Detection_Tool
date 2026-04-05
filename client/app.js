let currentFiles = [];
let sampleData = null;
let currentLang = null;

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
    
    const { summary, pairs, suspiciousPairs, matrix, files } = report;
    
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
        ${statCard(formatPct(summary.maxSimilarity), 'Max Match', summary.maxSimilarity >= 0.6)}
        ${statCard(formatPct(summary.averageSimilarity), 'Avg Match', false, summary.averageSimilarity >= 0.4)}
    `;
    
    if (suspiciousPairs.length > 0) {
        document.getElementById('suspicious-pairs-container').classList.remove('hidden');
        const tb = document.querySelector('#suspicious-pairs-table tbody');
        tb.innerHTML = '';
        suspiciousPairs.forEach(p => {
            tb.innerHTML += `<tr class="hover:bg-red-500/10 transition-colors">
                <td class="p-4 font-mono font-bold text-gray-200">${p.file1}</td>
                <td class="p-4 font-mono font-bold text-gray-200">${p.file2}</td>
                <td class="p-4 font-black font-mono text-right text-red-500 drop-shadow-[0_0_8px_red] text-lg">${formatPct(p.overall)}</td>
            </tr>`;
        });
    } else {
        document.getElementById('suspicious-pairs-container').classList.add('hidden');
    }
    
    const allTb = document.querySelector('#all-pairs-table tbody');
    allTb.innerHTML = '';
    pairs.forEach(p => {
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
        
        allTb.innerHTML += `<tr class="hover:bg-white/[0.02] transition-colors">
            <td class="p-4 font-mono text-gray-300 font-medium">${p.file1}</td>
            <td class="p-4 font-mono text-gray-300 font-medium">${p.file2}</td>
            <td class="p-4 text-center text-base ${scoreCls}">${formatPct(p.overall)}</td>
            <td class="p-4 text-center">${badge}</td>
        </tr>`;
    });

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

showPage('home');
