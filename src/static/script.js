/* ============================================================
   Maze Solver — Frontend Logic (Neo-Brutalist Edition)
   ============================================================ */

/* ---- Theme Toggle ---- */
(function initTheme() {
    const saved = localStorage.getItem('pathviz-theme');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    updateThemeIcon();
})();

function updateThemeIcon() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.textContent = isDark ? '☾' : '☀';
}

document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('pathviz-theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('pathviz-theme', 'dark');
    }
    updateThemeIcon();
    updateSwatchColors();
    // Redraw mazes with new theme colors
    if (algorithms.length > 0) {
        algorithms.forEach((_, i) => drawMaze(i));
    }
    if (focusedIndex >= 0) drawFocusCanvas();
});

/* ---- Dynamic swatch colors ---- */
function updateSwatchColors() {
    const style = getComputedStyle(document.documentElement);
    const fastestSwatch = document.getElementById('swatch-fastest');
    const shortestSwatch = document.getElementById('swatch-shortest');
    if (fastestSwatch) fastestSwatch.style.background = style.getPropertyValue('--clr-path').trim();
    if (shortestSwatch) shortestSwatch.style.background = style.getPropertyValue('--clr-go').trim();
}

/* ---- Tab Navigation ---- */
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById(`panel-${tab.dataset.tab}`);
        if (panel) panel.classList.add('active');
        // If switching to map, invalidate leaflet size
        if (tab.dataset.tab === 'map' && window.navMap) {
            setTimeout(() => window.navMap.invalidateSize(), 100);
        }
        // Close mobile nav menu on tab click
        const navTabs = document.getElementById('nav-tabs');
        const hamburger = document.getElementById('nav-hamburger');
        if (navTabs) navTabs.classList.remove('open');
        if (hamburger) hamburger.classList.remove('active');
    });
});

/* ---- Mobile Hamburger Toggle ---- */
(function initHamburger() {
    const hamburger = document.getElementById('nav-hamburger');
    const navTabs = document.getElementById('nav-tabs');
    if (!hamburger || !navTabs) return;
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navTabs.classList.toggle('open');
    });
})();

/* ---- Theme-aware color getter ---- */
function getThemeColors() {
    const style = getComputedStyle(document.documentElement);
    return {
        wall:    style.getPropertyValue('--maze-wall').trim(),
        path:    style.getPropertyValue('--maze-path').trim(),
        visited: style.getPropertyValue('--maze-visited').trim(),
        optimal: style.getPropertyValue('--maze-optimal').trim(),
        start:   style.getPropertyValue('--maze-start').trim(),
        end:     style.getPropertyValue('--maze-end').trim(),
        go:      style.getPropertyValue('--clr-go').trim(),
    };
}

let mazeData = null;
let algorithms = [];
let animationFrames = [];
let focusedIndex = -1;
let focusAnimFrame = null;

const API = window.location.origin;

/* ---- API ---- */
async function fetchMaze() {
    const res = await fetch(`${API}/generate`);
    mazeData = await res.json();
}

async function solveMaze() {
    const res = await fetch(`${API}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mazeData)
    });
    algorithms = await res.json();
    buildCards();
}

/* ---- UI Build ---- */
function buildCards() {
    const grid = document.getElementById('canvas-grid');
    grid.innerHTML = '';

    animationFrames.forEach(f => { if (f) cancelAnimationFrame(f); });
    animationFrames = [];

    algorithms.forEach((algo, i) => {
        algo.status = 'Waiting';
        algo.stepIndex = 0;
        algo.visitedSet = new Set();

        const card = document.createElement('div');
        card.className = 'algo-card';
        card.onclick = () => enterFocusMode(i);

        card.innerHTML = `
            <div class="algo-header">
                <div class="algo-title">${algo.name}</div>
                <span class="algo-badge waiting" id="badge-${i}">READY</span>
            </div>
            <div class="algo-time" id="time-${i}">—</div>
            <div class="canvas-wrapper">
                <canvas id="canvas-${i}"></canvas>
            </div>
        `;
        grid.appendChild(card);
        requestAnimationFrame(() => drawMaze(i));
    });
    updateLeaderboard();
}

/* ---- Canvas Drawing ---- */
function drawMaze(idx) {
    const canvas = document.getElementById(`canvas-${idx}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { maze, cols, rows, start, end } = mazeData;
    const colors = getThemeColors();

    if (canvas.width !== cols || canvas.height !== rows) {
        canvas.width = cols;
        canvas.height = rows;
    }

    const algo = algorithms[idx];

    // Background (paths)
    ctx.fillStyle = colors.path;
    ctx.fillRect(0, 0, cols, rows);

    // Walls
    ctx.fillStyle = colors.wall;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (maze[r][c] === 1) ctx.fillRect(c, r, 1, 1);
        }
    }

    // Visited
    ctx.fillStyle = colors.visited;
    algo.visitedSet.forEach(key => {
        const [c, r] = key.split(',').map(Number);
        ctx.fillRect(c, r, 1, 1);
    });

    // Optimal path (only when finished)
    if (algo.status === 'Finished' && algo.path && algo.path.length > 0) {
        ctx.fillStyle = colors.optimal;
        algo.path.forEach(([c, r]) => ctx.fillRect(c, r, 1, 1));
    }

    // Start & end markers
    ctx.fillStyle = colors.start;
    ctx.fillRect(start[0], start[1], 1, 1);
    ctx.fillStyle = colors.end;
    ctx.fillRect(end[0], end[1], 1, 1);
}

/* ---- Leaderboard ---- */
function updateLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    const finished = algorithms.filter(a => a.status === 'Finished');

    if (finished.length === 0) {
        list.innerHTML = '<div class="leaderboard-empty">Click <strong>Solve</strong> to start the race.</div>';
        return;
    }

    const byTime = [...finished].sort((a, b) => a.time - b.time);
    const withPath = finished.filter(a => a.path && a.path.length > 0);
    const byPath = [...withPath].sort((a, b) => a.path.length - b.path.length);
    const shortestLen = byPath.length > 0 ? byPath[0].path.length : -1;

    list.innerHTML = '';

    byTime.forEach((algo, i) => {
        const el = document.createElement('div');
        el.className = 'lb-item';

        const isFastest = (i === 0);
        const pathLen = (algo.path && algo.path.length > 0) ? algo.path.length : null;
        const isShortest = pathLen !== null && pathLen === shortestLen;

        if (isFastest) el.classList.add('gold');
        if (isShortest) el.classList.add('optimal');

        let tagsHTML = '';
        if (isFastest) tagsHTML += '<span class="lb-tag fastest">⚡ Fastest</span>';
        if (isShortest) tagsHTML += '<span class="lb-tag shortest">★ Shortest</span>';

        el.innerHTML = `
            <div class="lb-rank">
                <span class="lb-pos">${i + 1}.</span>
                <span class="lb-name">${algo.name}</span>
                <span class="lb-tags">${tagsHTML}</span>
            </div>
            <div class="lb-stats">
                <span>Time: <strong>${algo.time.toFixed(5)}s</strong></span>
                <span>Route: <strong>${pathLen !== null ? pathLen : 'N/A'}</strong></span>
            </div>
        `;
        list.appendChild(el);
    });
}

/* ---- Animation Loop ---- */
function animateAlgo(idx) {
    const algo = algorithms[idx];
    if (algo.status !== 'Running') return;

    const slider = document.getElementById('speed-slider');
    const steps = slider ? parseInt(slider.value) : 8;
    let done = false;

    for (let i = 0; i < steps; i++) {
        if (algo.stepIndex >= algo.visited_sequence.length) { done = true; break; }
        const cell = algo.visited_sequence[algo.stepIndex];
        algo.visitedSet.add(`${cell[0]},${cell[1]}`);
        algo.stepIndex++;
    }

    if (done) {
        algo.status = 'Finished';
        setBadge(idx, 'DONE', 'finished');
        const t = document.getElementById(`time-${idx}`);
        const colors = getThemeColors();
        t.textContent = `${algo.time.toFixed(4)}s`;
        t.style.color = colors.go;
        updateLeaderboard();
    }

    drawMaze(idx);

    if (!done) {
        animationFrames[idx] = requestAnimationFrame(() => animateAlgo(idx));
    }
}

/* ---- Badge Helper ---- */
function setBadge(idx, text, cls) {
    const b = document.getElementById(`badge-${idx}`);
    if (!b) return;
    b.textContent = text;
    b.className = `algo-badge ${cls}`;
}

/* ---- Toggle ---- */
function toggleAlgo(i) {
    const algo = algorithms[i];
    if (algo.status === 'Waiting' || algo.status === 'Paused') {
        algo.status = 'Running';
        setBadge(i, 'RUNNING', 'running');
        animateAlgo(i);
    } else if (algo.status === 'Running') {
        algo.status = 'Paused';
        setBadge(i, 'PAUSED', 'paused');
    }
}

/* ============================================================
   Focus Mode — expand a single algorithm to full workspace
   ============================================================ */

function enterFocusMode(idx) {
    focusedIndex = idx;
    const algo = algorithms[idx];

    // Hide grid + global bottom bar, show focus panel
    document.getElementById('canvas-grid').classList.add('hidden');
    document.querySelector('.bottom-bar').classList.add('hidden');
    document.getElementById('focus-view').classList.remove('hidden');

    // Populate header
    document.getElementById('focus-title').textContent = algo.name;
    syncFocusBadge();
    syncFocusStats();

    // Sync speed slider value from the global one
    document.getElementById('focus-speed').value = document.getElementById('speed-slider').value;
    document.getElementById('focus-speed-val').textContent = document.getElementById('speed-slider').value;

    // Initial draw
    drawFocusCanvas();

    // If the algorithm was already running, keep its animation going in focus
    if (algo.status === 'Running') {
        focusAnimateLoop();
    }
}

function exitFocusMode() {
    // Cancel any running focus animation
    if (focusAnimFrame) { cancelAnimationFrame(focusAnimFrame); focusAnimFrame = null; }

    focusedIndex = -1;

    // Show grid + global bottom bar, hide focus panel
    document.getElementById('canvas-grid').classList.remove('hidden');
    document.querySelector('.bottom-bar').classList.remove('hidden');
    document.getElementById('focus-view').classList.add('hidden');

    // Redraw all small cards (they may have progressed while in focus)
    algorithms.forEach((_, i) => drawMaze(i));
}

function drawFocusCanvas() {
    if (focusedIndex < 0 || !mazeData) return;
    const canvas = document.getElementById('focus-canvas');
    const ctx = canvas.getContext('2d');
    const { maze, cols, rows, start, end } = mazeData;
    const algo = algorithms[focusedIndex];
    const colors = getThemeColors();

    if (canvas.width !== cols || canvas.height !== rows) {
        canvas.width = cols;
        canvas.height = rows;
    }

    ctx.fillStyle = colors.path;
    ctx.fillRect(0, 0, cols, rows);

    ctx.fillStyle = colors.wall;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (maze[r][c] === 1) ctx.fillRect(c, r, 1, 1);
        }
    }

    ctx.fillStyle = colors.visited;
    algo.visitedSet.forEach(key => {
        const [c, r] = key.split(',').map(Number);
        ctx.fillRect(c, r, 1, 1);
    });

    if (algo.status === 'Finished' && algo.path && algo.path.length > 0) {
        ctx.fillStyle = colors.optimal;
        algo.path.forEach(([c, r]) => ctx.fillRect(c, r, 1, 1));
    }

    ctx.fillStyle = colors.start;
    ctx.fillRect(start[0], start[1], 1, 1);
    ctx.fillStyle = colors.end;
    ctx.fillRect(end[0], end[1], 1, 1);
}

function syncFocusBadge() {
    if (focusedIndex < 0) return;
    const algo = algorithms[focusedIndex];
    const b = document.getElementById('focus-badge');
    const map = { Waiting: ['READY','waiting'], Running: ['RUNNING','running'], Paused: ['PAUSED','paused'], Finished: ['DONE','finished'] };
    const [text, cls] = map[algo.status] || ['READY','waiting'];
    b.textContent = text;
    b.className = `algo-badge ${cls}`;
}

function syncFocusStats() {
    if (focusedIndex < 0) return;
    const algo = algorithms[focusedIndex];
    document.getElementById('focus-time').textContent = algo.status === 'Finished' ? `${algo.time.toFixed(5)}s` : '—';
    document.getElementById('focus-visited').textContent = `Visited: ${algo.visitedSet ? algo.visitedSet.size : 0}`;
    const pLen = (algo.status === 'Finished' && algo.path && algo.path.length > 0) ? algo.path.length : '—';
    document.getElementById('focus-path').textContent = `Path: ${pLen}`;
}

function focusAnimateLoop() {
    if (focusedIndex < 0) return;
    const algo = algorithms[focusedIndex];
    if (algo.status !== 'Running') return;

    const slider = document.getElementById('focus-speed');
    const steps = slider ? parseInt(slider.value) : 8;
    let done = false;

    for (let i = 0; i < steps; i++) {
        if (algo.stepIndex >= algo.visited_sequence.length) { done = true; break; }
        const cell = algo.visited_sequence[algo.stepIndex];
        algo.visitedSet.add(`${cell[0]},${cell[1]}`);
        algo.stepIndex++;
    }

    if (done) {
        algo.status = 'Finished';
        setBadge(focusedIndex, 'DONE', 'finished');
        const t = document.getElementById(`time-${focusedIndex}`);
        const colors = getThemeColors();
        if (t) { t.textContent = `${algo.time.toFixed(4)}s`; t.style.color = colors.go; }
        updateLeaderboard();
    }

    syncFocusBadge();
    syncFocusStats();
    drawFocusCanvas();
    // Also update the small card canvas so it stays in sync when we go back
    drawMaze(focusedIndex);

    if (!done) {
        focusAnimFrame = requestAnimationFrame(focusAnimateLoop);
    }
}

/* ---- Focus Button Bindings ---- */
document.getElementById('focus-back').onclick = exitFocusMode;

document.getElementById('focus-play').onclick = () => {
    if (focusedIndex < 0) return;
    const algo = algorithms[focusedIndex];
    if (algo.status === 'Waiting' || algo.status === 'Paused') {
        algo.status = 'Running';
        setBadge(focusedIndex, 'RUNNING', 'running');
        syncFocusBadge();
        focusAnimateLoop();
    }
};

document.getElementById('focus-pause').onclick = () => {
    if (focusedIndex < 0) return;
    const algo = algorithms[focusedIndex];
    if (algo.status === 'Running') {
        algo.status = 'Paused';
        setBadge(focusedIndex, 'PAUSED', 'paused');
        syncFocusBadge();
        if (focusAnimFrame) { cancelAnimationFrame(focusAnimFrame); focusAnimFrame = null; }
    }
};

document.getElementById('focus-reset').onclick = () => {
    if (focusedIndex < 0) return;
    const algo = algorithms[focusedIndex];
    if (focusAnimFrame) { cancelAnimationFrame(focusAnimFrame); focusAnimFrame = null; }
    algo.status = 'Waiting';
    algo.stepIndex = 0;
    algo.visitedSet = new Set();
    setBadge(focusedIndex, 'READY', 'waiting');
    syncFocusBadge();
    syncFocusStats();
    drawFocusCanvas();
    drawMaze(focusedIndex);
};

document.getElementById('focus-speed').addEventListener('input', (e) => {
    document.getElementById('focus-speed-val').textContent = e.target.value;
});

/* ============================================================
   Global Button Bindings
   ============================================================ */
document.getElementById('btn-start-all').onclick = () => {
    algorithms.forEach((algo, i) => {
        if (algo.status === 'Waiting' || algo.status === 'Paused') toggleAlgo(i);
    });
};

document.getElementById('btn-stop-all').onclick = () => {
    algorithms.forEach((algo, i) => {
        if (algo.status === 'Running') toggleAlgo(i);
    });
};

document.getElementById('btn-new-maze').onclick = async () => {
    const btn = document.getElementById('btn-new-maze');
    btn.disabled = true;
    btn.querySelector('svg').style.animation = 'spin 0.6s linear infinite';
    // If in focus mode, exit first
    if (focusedIndex >= 0) exitFocusMode();
    await fetchMaze();
    await solveMaze();
    btn.disabled = false;
    btn.querySelector('svg').style.animation = '';
};

/* Speed readout */
const slider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');
slider.addEventListener('input', () => { speedVal.textContent = slider.value; });

/* ---- Init ---- */
window.onload = async () => {
    updateSwatchColors();
    await fetchMaze();
    await solveMaze();
};

/* Spin keyframe for regenerate icon */
const styleSheet = document.createElement('style');
styleSheet.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);
