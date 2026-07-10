const gcanvas = document.getElementById('g2048Canvas');
const gctx = gcanvas.getContext('2d');
const gscoreSpan = document.getElementById('g2048-score');
const gbestSpan = document.getElementById('g2048-best');
const gstartBtn = document.getElementById('g2048-startBtn');
const gmessageEl = document.getElementById('g2048-message');

const GS = 4;
const CELL = 80;
const GAP = 10;
const PAD = 20;
const GRID_SIZE = GS * CELL + (GS + 1) * GAP;
const GO = (400 - GRID_SIZE) / 2;

let gboard = [];
let gscore = 0;
let gbest = parseInt(localStorage.getItem('g2048best') || '0');
let grunning = true;
let gwon = false;
let gover = false;
let gmerged = [];
let gnewTile = null;
let ganimTick = 0;

const TILE_COLORS = {
  0:    { bg: '#cdc1b4', fg: '#000' },
  2:    { bg: '#eee4da', fg: '#776e65' },
  4:    { bg: '#ede0c8', fg: '#776e65' },
  8:    { bg: '#f2b179', fg: '#f9f6f2' },
  16:   { bg: '#f59563', fg: '#f9f6f2' },
  32:   { bg: '#f67c5f', fg: '#f9f6f2' },
  64:   { bg: '#f65e3b', fg: '#f9f6f2' },
  128:  { bg: '#edcf72', fg: '#f9f6f2' },
  256:  { bg: '#edcc61', fg: '#f9f6f2' },
  512:  { bg: '#edc850', fg: '#f9f6f2' },
  1024: { bg: '#edc53f', fg: '#f9f6f2' },
  2048: { bg: '#edc22e', fg: '#f9f6f2' },
  4096: { bg: '#3c3a32', fg: '#f9f6f2' },
};

gbestSpan.textContent = gbest;

function initBoard() {
  gboard = Array.from({ length: GS }, () => Array(GS).fill(0));
  gscore = 0;
  gwon = false;
  gover = false;
  gmerged = [];
  gnewTile = null;
  grunning = true;
  gscoreSpan.textContent = '0';
  gmessageEl.textContent = '';
  addRandomTile();
  addRandomTile();
}

function addRandomTile() {
  const empty = [];
  for (let r = 0; r < GS; r++)
    for (let c = 0; c < GS; c++)
      if (gboard[r][c] === 0) empty.push({ r, c });
  if (empty.length === 0) return;
  const cell = empty[Math.floor(Math.random() * empty.length)];
  gboard[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
  gnewTile = cell;
}

function slideRow(row) {
  let arr = row.filter(v => v !== 0);
  let scored = false;
  let merged = [];
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      gscore += arr[i];
      gscoreSpan.textContent = gscore;
      arr.splice(i + 1, 1);
      merged.push({ idx: i, val: arr[i] });
      scored = true;
    }
  }
  while (arr.length < GS) arr.push(0);
  return { arr, scored, merged };
}

function moveLeft() {
  let moved = false;
  for (let r = 0; r < GS; r++) {
    const { arr, scored } = slideRow(gboard[r]);
    if (arr.join(',') !== gboard[r].join(',')) moved = true;
    gboard[r] = arr;
  }
  return moved;
}

function moveRight() {
  let moved = false;
  for (let r = 0; r < GS; r++) {
    const reversed = [...gboard[r]].reverse();
    const { arr, scored } = slideRow(reversed);
    const result = arr.reverse();
    if (result.join(',') !== gboard[r].join(',')) moved = true;
    gboard[r] = result;
  }
  return moved;
}

function moveUp() {
  let moved = false;
  for (let c = 0; c < GS; c++) {
    const col = [];
    for (let r = 0; r < GS; r++) col.push(gboard[r][c]);
    const { arr, scored } = slideRow(col);
    for (let r = 0; r < GS; r++) {
      if (gboard[r][c] !== arr[r]) moved = true;
      gboard[r][c] = arr[r];
    }
  }
  return moved;
}

function moveDown() {
  let moved = false;
  for (let c = 0; c < GS; c++) {
    const col = [];
    for (let r = GS - 1; r >= 0; r--) col.push(gboard[r][c]);
    const { arr, scored } = slideRow(col);
    const result = arr.reverse();
    for (let r = 0; r < GS; r++) {
      if (gboard[r][c] !== result[r]) moved = true;
      gboard[r][c] = result[r];
    }
  }
  return moved;
}

function canMove() {
  for (let r = 0; r < GS; r++)
    for (let c = 0; c < GS; c++) {
      if (gboard[r][c] === 0) return true;
      if (c + 1 < GS && gboard[r][c] === gboard[r][c + 1]) return true;
      if (r + 1 < GS && gboard[r][c] === gboard[r + 1][c]) return true;
    }
  return false;
}

function hasWon() {
  for (let r = 0; r < GS; r++)
    for (let c = 0; c < GS; c++)
      if (gboard[r][c] === 2048) return true;
  return false;
}

function handleMove(dir) {
  if (!grunning || gover) return;
  if (gwon) { grunning = false; return; }

  let moved = false;
  switch (dir) {
    case 'left': moved = moveLeft(); break;
    case 'right': moved = moveRight(); break;
    case 'up': moved = moveUp(); break;
    case 'down': moved = moveDown(); break;
  }

  if (moved) {
    addRandomTile();
    if (hasWon() && !gwon) {
      gwon = true;
      gmessageEl.textContent = 'YOU WIN! Keep going?';
    }
    if (!canMove()) {
      gover = true;
      grunning = false;
      if (gscore > gbest) {
        gbest = gscore;
        localStorage.setItem('g2048best', gbest.toString());
        gbestSpan.textContent = gbest;
      }
      gmessageEl.textContent = 'GAME OVER\nScore: ' + gscore;
    }
  }
}

function getTilePos(r, c) {
  return {
    x: GO + GAP + c * (CELL + GAP),
    y: GO + GAP + r * (CELL + GAP),
  };
}

function drawTile(r, c, value) {
  const pos = getTilePos(r, c);
  const colors = TILE_COLORS[value] || { bg: '#000', fg: '#fff' };

  gctx.fillStyle = '#bbada0';
  const rx = pos.x - 2, ry = pos.y - 2, rw = CELL + 4, rh = CELL + 4;
  gctx.beginPath();
  gctx.roundRect(rx, ry, rw, rh, 6);
  gctx.fill();

  gctx.fillStyle = colors.bg;
  gctx.beginPath();
  gctx.roundRect(pos.x, pos.y, CELL, CELL, 4);
  gctx.fill();

  if (value > 0) {
    gctx.fillStyle = colors.fg;
    gctx.textAlign = 'center';
    gctx.textBaseline = 'middle';
    const sz = value < 100 ? 36 : value < 1000 ? 30 : value < 10000 ? 24 : 18;
    gctx.font = `bold ${sz}px Arial`;
    gctx.fillText(value, pos.x + CELL / 2, pos.y + CELL / 2);
  }
}

function drawGrid() {
  gctx.fillStyle = '#bbada0';
  gctx.beginPath();
  gctx.roundRect(GO - 2, GO - 2, GRID_SIZE + 4, GRID_SIZE + 4, 8);
  gctx.fill();

  for (let r = 0; r < GS; r++)
    for (let c = 0; c < GS; c++)
      drawTile(r, c, gboard[r][c]);
}

function g2048Draw() {
  gctx.clearRect(0, 0, 400, 460);
  drawGrid();
}

function g2048Loop() {
  g2048Draw();
  requestAnimationFrame(g2048Loop);
}

document.addEventListener('keydown', (e) => {
  const section = document.getElementById('game2048-section');
  if (!section || !section.classList.contains('active')) return;
  const map = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    a: 'left', d: 'right', w: 'up', s: 'down',
  };
  if (map[e.key]) {
    e.preventDefault();
    handleMove(map[e.key]);
  }
});

gstartBtn.addEventListener('click', () => {
  initBoard();
  grunning = true;
});

document.querySelectorAll('.g2048-dir-btn').forEach(btn => {
  btn.addEventListener('click', () => handleMove(btn.dataset.dir));
});

function getTouchDir(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return null;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
}

let touchStart = null;
gcanvas.addEventListener('touchstart', (e) => {
  const t = e.touches[0];
  touchStart = { x: t.clientX, y: t.clientY };
});

gcanvas.addEventListener('touchend', (e) => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const dir = getTouchDir(touchStart.x, touchStart.y, t.clientX, t.clientY);
  touchStart = null;
  if (dir) handleMove(dir);
});

initBoard();
g2048Loop();
