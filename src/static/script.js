const colors = {
    wall: '#1e293b',       // Dark blackish blue
    path: '#f8fafc',       // Bright white
    visited: '#fcd34d',    // Yellow
    optimal: '#10b981',    // Emerald Green
    start: '#3b82f6',      // Blue
    end: '#ef4444'         // Red
};

let mazeData = null;
let algorithms = [];
let animationFrames = [];

const API_BASE = window.location.origin;

async function fetchMaze() {
    const res = await fetch(`${API_BASE}/generate`);
    mazeData = await res.json();
    return mazeData;
}

async function solveMaze() {
    const res = await fetch(`${API_BASE}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mazeData)
    });
    algorithms = await res.json();
    initUI();
}

function initUI() {
    const grid = document.getElementById('canvas-grid');
    grid.innerHTML = '';
    
    for(let f of animationFrames) {
        if (f) cancelAnimationFrame(f);
    }
    animationFrames = [];
    
    algorithms.forEach((algo, i) => {
        algo.status = 'Waiting';
        algo.stepIndex = 0;
        algo.visitedSet = new Set();
        
        const card = document.createElement('div');
        card.className = 'algo-card';
        card.onclick = () => toggleAlgo(i);
        
        card.innerHTML = `
            <div class="algo-title">${algo.name}</div>
            <div class="algo-status">
                <span id="status-${i}" style="color: #60a5fa;">Waiting (Click to Play)</span>
                <span id="time-${i}">-- s</span>
            </div>
            <div class="canvas-wrapper">
                <canvas id="canvas-${i}"></canvas>
            </div>
        `;
        grid.appendChild(card);
        requestAnimationFrame(() => drawMazeOptimized(i));
    });
    updateLeaderboard();
}

function drawMazeOptimized(algoIndex) {
    const canvas = document.getElementById(`canvas-${algoIndex}`);
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const { maze, cols, rows, start, end } = mazeData;
    
    // Set strictly to internal columns and rows for 1:1 crisp grid scaling
    if(canvas.width !== cols || canvas.height !== rows){
        canvas.width = cols;
        canvas.height = rows;
    }
    
    const algo = algorithms[algoIndex];
    
    ctx.fillStyle = colors.path;
    ctx.fillRect(0, 0, cols, rows);
    
    ctx.fillStyle = colors.wall;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (maze[r][c] === 1) {
                ctx.fillRect(c, r, 1, 1);
            }
        }
    }
    
    ctx.fillStyle = colors.visited;
    algo.visitedSet.forEach(key => {
        const [c, r] = key.split(',').map(Number);
        ctx.fillRect(c, r, 1, 1);
    });
    
    if (algo.status === 'Finished' && algo.path) {
        ctx.fillStyle = colors.optimal;
        algo.path.forEach(p => {
            const [c, r] = p;
            ctx.fillRect(c, r, 1, 1);
        });
    }
    
    ctx.fillStyle = colors.start;
    ctx.fillRect(start[0], start[1], 1, 1);
    
    ctx.fillStyle = colors.end;
    ctx.fillRect(end[0], end[1], 1, 1);
}

function updateLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    
    const finishedAlgos = algorithms.filter(a => a.status === 'Finished');
    if (finishedAlgos.length === 0) {
        list.innerHTML = `<div style="color:var(--text-secondary); text-align:center;">Results will appear here as algorithms finish.</div>`;
        return;
    }
    
    const sorted = [...finishedAlgos].sort((a,b) => a.time - b.time);
    const sortedBySteps = [...finishedAlgos.filter(a => a.path && a.path.length > 0)].sort((a,b) => a.path.length - b.path.length);
    const shortestLen = sortedBySteps.length > 0 ? sortedBySteps[0].path.length : -1;
    
    list.innerHTML = '';
    
    sorted.forEach((algo, i) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        if (i === 0) item.classList.add('first-place');
        
        let pathLen = algo.path && algo.path.length > 0 ? algo.path.length : 'N/A';
        const isShortest = pathLen === shortestLen;
        if (isShortest) item.classList.add('shortest-route');
        
        item.innerHTML = `
            <div class="item-header">
                ${i+1}. ${algo.name} ${isShortest ? '<span style="color:#10b981">⭐ Shortest</span>' : ''}
            </div>
            <div class="item-stats">
                Time: <strong>${algo.time.toFixed(5)}s</strong> | Route: ${pathLen}
            </div>
        `;
        list.appendChild(item);
    });
}

function animateAlgo(algoIndex) {
    const algo = algorithms[algoIndex];
    if (algo.status !== 'Running') return;
    
    const slider = document.getElementById('speed-slider');
    const stepsPerFrame = slider ? parseInt(slider.value) : 10;
    let done = false;
    
    for (let i = 0; i < stepsPerFrame; i++) {
        if (algo.stepIndex >= algo.visited_sequence.length) {
            done = true;
            break;
        }
        const cell = algo.visited_sequence[algo.stepIndex];
        algo.visitedSet.add(`${cell[0]},${cell[1]}`);
        algo.stepIndex++;
    }
    
    if (done) {
        algo.status = 'Finished';
        const stNode = document.getElementById(`status-${algoIndex}`);
        stNode.innerText = 'Finished';
        stNode.style.color = '#10b981';
        
        document.getElementById(`time-${algoIndex}`).innerText = `${algo.time.toFixed(4)} s`;
        updateLeaderboard();
    }
    
    // Crucial fix: The canvas must draw AFTER status is 'Finished' to render the optimal path!
    drawMazeOptimized(algoIndex);
    
    if (!done) {
        animationFrames[algoIndex] = requestAnimationFrame(() => animateAlgo(algoIndex));
    }
}

function toggleAlgo(i) {
    const algo = algorithms[i];
    const stNode = document.getElementById(`status-${i}`);
    
    if (algo.status === 'Waiting' || algo.status === 'Paused') {
        algo.status = 'Running';
        stNode.innerText = 'Running... (Click to pause)';
        stNode.style.color = '#fcd34d';
        animateAlgo(i);
    } else if (algo.status === 'Running') {
        algo.status = 'Paused';
        stNode.innerText = 'Paused (Click to resume)';
        stNode.style.color = '#f43f5e';
    }
}

document.getElementById('btn-start-all').onclick = () => {
    algorithms.forEach((algo, i) => {
        if (algo.status === 'Waiting' || algo.status === 'Paused') {
            toggleAlgo(i);
        }
    });
};

document.getElementById('btn-stop-all').onclick = () => {
    algorithms.forEach((algo, i) => {
        if (algo.status === 'Running') {
            toggleAlgo(i);
        }
    });
};

document.getElementById('btn-new-maze').onclick = async () => {
    const btn = document.getElementById('btn-new-maze');
    btn.innerText = 'Generating (Heavy compute)...';
    btn.disabled = true;
    
    await fetchMaze();
    await solveMaze();
    
    btn.innerText = 'Generate New Maze';
    btn.disabled = false;
};

window.onload = async () => {
    await fetchMaze();
    await solveMaze();
};
