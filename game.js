const canvas = document.getElementById('pacmanCanvas');
const ctx = canvas.getContext('2d');
const scoreSpan = document.getElementById('score');
const livesSpan = document.getElementById('lives');
const startBtn = document.getElementById('startBtn');
const messageEl = document.getElementById('pacman-message');

const TILE = 20;
const COLS = 28;
const ROWS = 31;

const FPS = 60;
const PACMAN_SPEED = 2;
const GHOST_SPEED = 1.6;
const FRIGHTENED_SPEED = 1;
const SCATTER_TIME = 420;
const CHASE_TIME = 1200;

let score = 0;
let lives = 3;
let gameRunning = false;
let gamePaused = false;
let gameOver = false;
let win = false;
let dotsLeft = 0;
let frightenedTimer = 0;
let frightenedMode = false;
let ghostEatCombo = 0;
let modeTimer = 0;
let isScatterMode = true;
let modeIndex = 0;

const DIR = { NONE: 0, UP: 1, DOWN: 2, LEFT: 3, RIGHT: 4 };

const dirVec = {
  [DIR.NONE]: { x: 0, y: 0 },
  [DIR.UP]: { x: 0, y: -1 },
  [DIR.DOWN]: { x: 0, y: 1 },
  [DIR.LEFT]: { x: -1, y: 0 },
  [DIR.RIGHT]: { x: 1, y: 0 },
};

const maze = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,5,5,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,0,2,0,0,0,1,4,4,4,4,4,4,1,0,0,0,2,0,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

class Pacman {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 14 * TILE;
    this.y = 23 * TILE;
    this.tileX = 14;
    this.tileY = 23;
    this.dir = DIR.NONE;
    this.nextDir = DIR.NONE;
    this.speed = PACMAN_SPEED;
    this.mouthAngle = 0;
    this.mouthDir = 1;
    this.moving = false;
  }

  getTilePos() {
    return { x: Math.round(this.x / TILE), y: Math.round(this.y / TILE) };
  }

  canMove(dir, posX = this.x, posY = this.y) {
    const tileX = Math.round(posX / TILE);
    const tileY = Math.round(posY / TILE);
    const vec = dirVec[dir];
    const nextTileX = tileX + vec.x;
    const nextTileY = tileY + vec.y;
    if (nextTileX < 0 || nextTileX >= COLS || nextTileY < 0 || nextTileY >= ROWS) return false;
    const tile = maze[nextTileY][nextTileX];
    return tile !== 1 && tile !== 4 && tile !== 5;
  }

  isAtTileCenter() {
    const cx = this.x + TILE / 2;
    const cy = this.y + TILE / 2;
    return Math.abs((cx % TILE) - TILE / 2) < 2 && Math.abs((cy % TILE) - TILE / 2) < 2;
  }

  update() {
    this.mouthAngle += 0.15 * this.mouthDir;
    if (this.mouthAngle > 0.8 || this.mouthAngle < 0) this.mouthDir *= -1;

    if (this.dir === DIR.NONE) {
      if (this.nextDir !== DIR.NONE && this.canMove(this.nextDir)) {
        this.dir = this.nextDir;
        this.nextDir = DIR.NONE;
      } else {
        return;
      }
    }

    if (this.isAtTileCenter()) {
      const prevTileX = this.tileX;
      const prevTileY = this.tileY;
      this.tileX = Math.round(this.x / TILE);
      this.tileY = Math.round(this.y / TILE);

      if (this.tileX === 0 && this.dir === DIR.LEFT && this.x < 0) {
        this.x = COLS * TILE;
        this.tileX = COLS;
      }
      if (this.tileX === COLS && this.dir === DIR.RIGHT && this.x > COLS * TILE) {
        this.x = 0;
        this.tileX = 0;
      }

      if (this.nextDir !== DIR.NONE && this.canMove(this.nextDir)) {
        this.dir = this.nextDir;
        this.nextDir = DIR.NONE;
      }

      if (!this.canMove(this.dir)) {
        this.x = prevTileX * TILE;
        this.y = prevTileY * TILE;
        this.tileX = prevTileX;
        this.tileY = prevTileY;
        return;
      }
    }

    const vec = dirVec[this.dir];
    this.x += vec.x * this.speed;
    this.y += vec.y * this.speed;

    if (this.x < -TILE) this.x = COLS * TILE;
    if (this.x > COLS * TILE) this.x = -TILE;

    this.tileX = Math.round(this.x / TILE);
    this.tileY = Math.round(this.y / TILE);
  }

  draw() {
    ctx.save();
    ctx.translate(this.x + TILE / 2, this.y + TILE / 2);

    let rotation = 0;
    switch (this.dir) {
      case DIR.UP: rotation = -Math.PI / 2; break;
      case DIR.DOWN: rotation = Math.PI / 2; break;
      case DIR.LEFT: rotation = Math.PI; break;
      case DIR.RIGHT: rotation = 0; break;
    }
    ctx.rotate(rotation);

    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(0, 0, TILE / 2 - 1, this.mouthAngle, 2 * Math.PI - this.mouthAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

const GHOST_COLORS = ['#f00', '#ffb8ff', '#0ff', '#ffb852'];
const GHOST_NAMES = ['blinky', 'pinky', 'inky', 'clyde'];

class Ghost {
  constructor(index) {
    this.index = index;
    this.color = GHOST_COLORS[index];
    this.name = GHOST_NAMES[index];
    this.reset();
  }

  reset() {
    this.spawnX = [14, 12, 14, 16][this.index];
    this.spawnY = [11, 14, 14, 14][this.index];
    this.x = this.spawnX * TILE;
    this.y = this.spawnY * TILE;
    this.tileX = this.spawnX;
    this.tileY = this.spawnY;
    this.dir = DIR.UP;
    this.speed = GHOST_SPEED;
    this.inHouse = this.index !== 0;
    this.houseTimer = this.index * 60 + 60;
    this.frightened = false;
    this.eaten = false;
    this.eyesMode = false;
    this.scatterTarget = [
      { x: 0, y: 0 },
      { x: COLS - 1, y: 0 },
      { x: 0, y: ROWS - 1 },
      { x: COLS - 1, y: ROWS - 1 },
    ][this.index];
    this.mode = DIR.UP;
  }

  isAtTileCenter() {
    const cx = this.x + TILE / 2;
    const cy = this.y + TILE / 2;
    return Math.abs((cx % TILE) - TILE / 2) < 1 && Math.abs((cy % TILE) - TILE / 2) < 1;
  }

  getTargetTile() {
    if (this.eyesMode) return { x: 14, y: 11 };
    if (this.frightened) return null;

    if (isScatterMode) return this.scatterTarget;

    const pac = pacman;
    const px = pacman.tileX;
    const py = pacman.tileY;
    const pd = pacman.dir;

    switch (this.index) {
      case 0: return { x: px, y: py };
      case 1: {
        let tx = px + dirVec[pd].x * 4;
        let ty = py + dirVec[pd].y * 4;
        return { x: tx, y: ty };
      }
      case 2: {
        const blinky = ghosts[0];
        let tx = px + dirVec[pd].x * 2;
        let ty = py + dirVec[pd].y * 2;
        let dx = tx - blinky.tileX;
        let dy = ty - blinky.tileY;
        return { x: blinky.tileX + dx * 2, y: blinky.tileY + dy * 2 };
      }
      case 3: {
        let dist = Math.abs(this.tileX - px) + Math.abs(this.tileY - py);
        if (dist > 8) return { x: px, y: py };
        return this.scatterTarget;
      }
    }
  }

  getAvailableDirs() {
    const dirs = [];
    const opposites = { [DIR.UP]: DIR.DOWN, [DIR.DOWN]: DIR.UP, [DIR.LEFT]: DIR.RIGHT, [DIR.RIGHT]: DIR.LEFT };
    for (let d = 1; d <= 4; d++) {
      if (d === opposites[this.dir]) continue;
      const vec = dirVec[d];
      const nx = this.x + vec.x * this.speed;
      const ny = this.y + vec.y * this.speed;
      const tx = Math.round((nx + TILE / 2) / TILE);
      const ty = Math.round((ny + TILE / 2) / TILE);
      if (tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS) {
        const tile = maze[ty][tx];
        if (tile === 1) continue;
        if (!this.eaten && !this.inHouse && (tile === 4 || tile === 5)) continue;
        if (this.inHouse && tile === 4) continue;
        dirs.push(d);
      }
    }
    if (dirs.length === 0) {
      for (let d = 1; d <= 4; d++) {
        const vec = dirVec[opposites[d]];
        const nx = this.x + vec.x * this.speed;
        const ny = this.y + vec.y * this.speed;
        const tx = Math.round((nx + TILE / 2) / TILE);
        const ty = Math.round((ny + TILE / 2) / TILE);
        if (tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS) {
          const tile = maze[ty][tx];
          if (tile !== 1) dirs.push(opposites[d]);
        }
      }
    }
    return dirs;
  }

  update() {
    if (this.inHouse) {
      this.houseTimer--;
      if (this.houseTimer <= 0) {
        this.inHouse = false;
        this.x = 14 * TILE;
        this.y = 11 * TILE;
        this.tileX = 14;
        this.tileY = 11;
        this.dir = DIR.LEFT;
        this.speed = GHOST_SPEED;
      } else {
        const bob = Math.sin(Date.now() / 200) * 3;
        this.y = this.spawnY * TILE + bob;
        return;
      }
    }

    if (this.eyesMode && this.tileX === 14 && this.tileY === 11) {
      this.eyesMode = false;
      this.eaten = false;
      this.frightened = false;
      this.inHouse = true;
      this.houseTimer = 30;
      this.x = this.spawnX * TILE;
      this.y = this.spawnY * TILE;
      this.speed = GHOST_SPEED;
      return;
    }

    if (!this.isAtTileCenter()) {
      const vec = dirVec[this.dir];
      this.x += vec.x * this.speed;
      this.y += vec.y * this.speed;
      this.tileX = Math.round(this.x / TILE);
      this.tileY = Math.round(this.y / TILE);
      return;
    }

    this.tileX = Math.round(this.x / TILE);
    this.tileY = Math.round(this.y / TILE);

    if (this.tileX === 0 && this.x < 0) {
      this.x = COLS * TILE;
      this.tileX = COLS;
    }
    if (this.tileX === COLS && this.x > COLS * TILE) {
      this.x = 0;
      this.tileX = 0;
    }

    let dirs = this.getAvailableDirs();
    if (dirs.length === 0) {
      dirs = [this.dir];
    }

    if (this.frightened && !this.eyesMode) {
      this.dir = dirs[Math.floor(Math.random() * dirs.length)];
    } else {
      const target = this.getTargetTile();
      if (target) {
        let bestDir = dirs[0];
        let bestDist = Infinity;
        for (const d of dirs) {
          const vec = dirVec[d];
          const nx = this.tileX + vec.x;
          const ny = this.tileY + vec.y;
          const dist = Math.abs(nx - target.x) + Math.abs(ny - target.y);
          if (dist < bestDist) {
            bestDist = dist;
            bestDir = d;
          }
        }
        this.dir = bestDir;
      } else {
        this.dir = dirs[Math.floor(Math.random() * dirs.length)];
      }
    }

    const vec = dirVec[this.dir];
    this.x += vec.x * this.speed;
    this.y += vec.y * this.speed;
    this.tileX = Math.round(this.x / TILE);
    this.tileY = Math.round(this.y / TILE);
  }

  draw() {
    const cx = this.x + TILE / 2;
    const cy = this.y + TILE / 2;

    if (this.eyesMode) {
      this.drawEyes(cx, cy);
      return;
    }

    ctx.save();
    ctx.translate(cx, cy);

    const color = this.frightened
      ? (frightenedTimer < 120 && Math.floor(frightenedTimer / 8) % 2 === 0 ? '#fff' : '#2121de')
      : this.color;

    const r = TILE / 2 - 1;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -2, r, Math.PI, 0);
    ctx.arc(0, 2, r, 0, Math.PI);
    ctx.closePath();
    ctx.fill();

    const wave = Math.sin(Date.now() / 100) * 1.5;
    ctx.fillRect(-r, -2, r * 2, r + wave);

    ctx.fillStyle = '#fff';
    const eyeR = 4;
    if (this.frightened) {
      ctx.fillStyle = '#f00';
      ctx.beginPath();
      ctx.arc(-5, -6, 2, 0, Math.PI * 2);
      ctx.arc(5, -6, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-8, -2);
      ctx.lineTo(-3, 2);
      ctx.lineTo(3, 2);
      ctx.lineTo(8, -2);
      ctx.strokeStyle = '#f00';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-5, -6, eyeR, 0, Math.PI * 2);
      ctx.arc(5, -6, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222';
      let lookX = 0, lookY = 0;
      switch (this.dir) {
        case DIR.UP: lookY = -2; break;
        case DIR.DOWN: lookY = 2; break;
        case DIR.LEFT: lookX = -2; break;
        case DIR.RIGHT: lookX = 2; break;
      }
      ctx.beginPath();
      ctx.arc(-5 + lookX, -6 + lookY, 2, 0, Math.PI * 2);
      ctx.arc(5 + lookX, -6 + lookY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawEyes(cx, cy) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 4, 5, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy - 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    let lookX = 0, lookY = 0;
    switch (this.dir) {
      case DIR.UP: lookY = -2; break;
      case DIR.DOWN: lookY = 2; break;
      case DIR.LEFT: lookX = -2; break;
      case DIR.RIGHT: lookX = 2; break;
    }
    ctx.beginPath();
    ctx.arc(cx - 5 + lookX, cy - 4 + lookY, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + 5 + lookX, cy - 4 + lookY, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

let pacman;
let ghosts;

function initGame() {
  pacman = new Pacman();
  ghosts = [0, 1, 2, 3].map(i => new Ghost(i));
  score = 0;
  lives = 3;
  gameOver = false;
  win = false;
  gamePaused = false;
  frightenedMode = false;
  frightenedTimer = 0;
  ghostEatCombo = 0;
  modeTimer = 0;
  modeIndex = 0;
  isScatterMode = true;
  dotsLeft = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (maze[r][c] === 2 || maze[r][c] === 3) dotsLeft++;
    }
  }
  scoreSpan.textContent = score;
  livesSpan.textContent = lives;
  messageEl.textContent = '';
}

function drawMaze() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * TILE;
      const y = r * TILE;
      const tile = maze[r][c];

      if (tile === 1) {
        ctx.fillStyle = '#2121de';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, TILE, TILE);
      } else if (tile === 2) {
        ctx.fillStyle = '#ffb8ae';
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile === 3) {
        ctx.fillStyle = '#ffb8ae';
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile === 4) {
        ctx.fillStyle = '#111';
        ctx.fillRect(x, y, TILE, TILE);
      } else if (tile === 5) {
        ctx.fillStyle = '#ffb8ff';
        ctx.fillRect(x, y, TILE, 3);
      }
    }
  }
}

function checkDotEat() {
  const tx = pacman.tileX;
  const ty = pacman.tileY;
  if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return;
  const tile = maze[ty][tx];
  if (tile === 2) {
    maze[ty][tx] = 0;
    score += 10;
    dotsLeft--;
    scoreSpan.textContent = score;
  } else if (tile === 3) {
    maze[ty][tx] = 0;
    score += 50;
    dotsLeft--;
    scoreSpan.textContent = score;
    frightenedMode = true;
    frightenedTimer = 360;
    ghostEatCombo = 0;
    for (const g of ghosts) {
      if (!g.inHouse && !g.eyesMode) {
        g.frightened = true;
        g.speed = FRIGHTENED_SPEED;
      }
    }
  }
}

function checkGhostCollision() {
  const px = pacman.x + TILE / 2;
  const py = pacman.y + TILE / 2;

  for (const g of ghosts) {
    if (g.inHouse) continue;
    const gx = g.x + TILE / 2;
    const gy = g.y + TILE / 2;
    const dist = Math.abs(px - gx) + Math.abs(py - gy);
    if (dist < TILE - 2) {
      if (g.frightened && !g.eyesMode) {
        g.frightened = false;
        g.eyesMode = true;
        g.eaten = true;
        g.speed = 4;
        ghostEatCombo++;
        const pts = [200, 400, 800, 1600][Math.min(ghostEatCombo - 1, 3)];
        score += pts;
        scoreSpan.textContent = score;
      } else if (!g.eyesMode) {
        loseLife();
        return;
      }
    }
  }
}

function loseLife() {
  lives--;
  livesSpan.textContent = lives;
  if (lives <= 0) {
    gameOver = true;
    gameRunning = false;
    messageEl.textContent = 'GAME OVER';
    return;
  }
  resetPositions();
}

function resetPositions() {
  pacman.reset();
  for (const g of ghosts) g.reset();
  frightenedMode = false;
  frightenedTimer = 0;
  ghostEatCombo = 0;
  gamePaused = true;
  setTimeout(() => { gamePaused = false; }, 1000);
}

function checkWin() {
  if (dotsLeft <= 0) {
    win = true;
    gameRunning = false;
    messageEl.textContent = 'YOU WIN!';
  }
}

function updateModes() {
  if (frightenedMode) {
    frightenedTimer--;
    if (frightenedTimer <= 0) {
      frightenedMode = false;
      for (const g of ghosts) {
        if (!g.eyesMode) {
          g.frightened = false;
          g.speed = GHOST_SPEED;
        }
      }
    }
    return;
  }

  modeTimer++;
  const modes = [
    { scatter: true, length: SCATTER_TIME },
    { scatter: false, length: CHASE_TIME },
    { scatter: true, length: SCATTER_TIME },
    { scatter: false, length: CHASE_TIME },
    { scatter: true, length: SCATTER_TIME },
    { scatter: false, length: CHASE_TIME },
    { scatter: true, length: SCATTER_TIME },
    { scatter: false, length: Infinity },
  ];

  if (modeIndex < modes.length && modeTimer >= modes[modeIndex].length) {
    modeTimer = 0;
    modeIndex++;
    if (modeIndex < modes.length) {
      isScatterMode = modes[modeIndex].scatter;
    }
  }
}

function update() {
  if (!gameRunning || gamePaused || gameOver || win) return;

  pacman.update();
  updateModes();
  for (const g of ghosts) g.update();
  checkDotEat();
  checkGhostCollision();
  checkWin();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMaze();
  if (!gameOver || !gameRunning) pacman.draw();
  for (const g of ghosts) g.draw();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  if (gameRunning) return;
  initGame();
  gameRunning = true;
  messageEl.textContent = '';
}

document.addEventListener('keydown', (e) => {
  const pacmanSection = document.getElementById('pacman-section');
  if (!pacmanSection.classList.contains('active')) return;
  if (!gameRunning) return;
  switch (e.key) {
    case 'ArrowUp': e.preventDefault(); pacman.nextDir = DIR.UP; break;
    case 'ArrowDown': e.preventDefault(); pacman.nextDir = DIR.DOWN; break;
    case 'ArrowLeft': e.preventDefault(); pacman.nextDir = DIR.LEFT; break;
    case 'ArrowRight': e.preventDefault(); pacman.nextDir = DIR.RIGHT; break;
  }
});

document.querySelectorAll('.dir-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!gameRunning) return;
    const dirMap = { up: DIR.UP, down: DIR.DOWN, left: DIR.LEFT, right: DIR.RIGHT };
    pacman.nextDir = dirMap[btn.dataset.dir];
  });
});

startBtn.addEventListener('click', startGame);

initGame();
gameLoop();
