const mcanvas = document.getElementById('marioCanvas');
const mctx = mcanvas.getContext('2d');
const mscoreSpan = document.getElementById('mario-score');
const mcoinsSpan = document.getElementById('mario-coins');
const mstartBtn = document.getElementById('mario-startBtn');
const mmessageEl = document.getElementById('mario-message');

const MW = 600, MH = 500;
const GRAVITY = 0.6;
const LEVEL_W = 4000;

let mrunning = false;
let mover = false;
let mscore = 0;
let mcoins = 0;
let mcamera = 0;
let mario;
let platforms = [];
let enemies = [];
let coinItems = [];
let particles = [];
let flag = null;
let mkeys = {};
let mwin = false;

class Mario {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 60;
    this.y = 0;
    this.w = 24;
    this.h = 32;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facing = 1;
    this.walkFrame = 0;
    this.walkTimer = 0;
    this.dead = false;
    this.invincible = 0;
  }

  getLeft() { return this.x; }
  getRight() { return this.x + this.w; }
  getTop() { return this.y; }
  getBottom() { return this.y + this.h; }

  update() {
    if (this.dead) {
      this.vy += GRAVITY;
      this.y += this.vy;
      return;
    }

    if (this.invincible > 0) this.invincible--;

    this.vx = 0;
    if (mkeys['ArrowLeft'] || mkeys['a']) this.vx = -4;
    if (mkeys['ArrowRight'] || mkeys['d']) this.vx = 4;

    if (this.vx !== 0) this.facing = this.vx > 0 ? 1 : -1;

    if ((mkeys['ArrowUp'] || mkeys[' '] || mkeys['w']) && this.onGround) {
      this.vy = -10;
      this.onGround = false;
    }

    this.vy += GRAVITY;
    if (this.vy > 12) this.vy = 12;

    this.x += this.vx;
    this.resolveCollisionX();

    this.y += this.vy;
    this.onGround = false;
    this.resolveCollisionY();

    if (this.x < 0) this.x = 0;
    if (this.x + this.w > LEVEL_W) this.x = LEVEL_W - this.w;

    if (this.getBottom() > MH + 100) {
      this.dead = true;
    }

    this.walkTimer++;
    if (this.walkTimer > 6) {
      this.walkTimer = 0;
      if (this.vx !== 0) this.walkFrame = (this.walkFrame + 1) % 3;
      else this.walkFrame = 0;
    }
  }

  resolveCollisionX() {
    for (const p of platforms) {
      if (this.overlaps(p)) {
        if (this.vx > 0) {
          this.x = p.x - this.w;
        } else if (this.vx < 0) {
          this.x = p.x + p.w;
        }
        this.vx = 0;
      }
    }
  }

  resolveCollisionY() {
    for (const p of platforms) {
      if (this.overlaps(p)) {
        if (this.vy > 0) {
          this.y = p.y - this.h;
          this.vy = 0;
          this.onGround = true;
        } else if (this.vy < 0) {
          this.y = p.y + p.h;
          this.vy = 0;
          if (p.type === 'question') {
            p.hit = true;
            if (!p.opened) {
              p.opened = true;
              mcoins++;
              mcoinsSpan.textContent = mcoins;
              mscore += 200;
              mscoreSpan.textContent = mscore;
              spawnCoinPop(p.x + p.w / 2, p.y);
            }
          }
        }
      }
    }
  }

  overlaps(p) {
    return this.x < p.x + p.w && this.x + this.w > p.x &&
           this.y < p.y + p.h && this.y + this.h > p.y;
  }

  draw() {
    if (this.dead) {
      mctx.save();
      mctx.translate(this.x - mcamera, this.y);
      mctx.fillStyle = '#e04020';
      mctx.fillRect(0, 0, this.w, this.h);
      mctx.fillStyle = '#a02810';
      mctx.fillRect(2, 2, this.w - 4, 6);
      mctx.fillRect(2, this.h - 8, this.w - 4, 6);
      mctx.restore();
      return;
    }

    if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) return;

    mctx.save();
    mctx.translate(this.x - mcamera, this.y);

    const f = this.facing;

    mctx.fillStyle = '#e04020';
    mctx.fillRect(2, 0, 20, 16);

    mctx.fillStyle = '#f06030';
    mctx.fillRect(4, 2, 4, 4);
    mctx.fillRect(16, 2, 4, 4);

    mctx.fillStyle = '#f0b080';
    mctx.fillRect(6, 14, 12, 4);

    mctx.fillStyle = '#222';
    mctx.fillRect(f > 0 ? 14 : 6, 14, 4, 2);

    mctx.fillStyle = '#2020c0';
    mctx.fillRect(4, 18, 16, 12);

    mctx.fillStyle = '#3030d0';
    mctx.fillRect(6, 18, 6, 5);
    mctx.fillRect(12, 18, 6, 5);

    mctx.fillStyle = '#f0b080';
    mctx.fillRect(4, 28, 6, 4);
    mctx.fillRect(14, 28, 6, 4);

    mctx.fillStyle = '#8b4513';
    mctx.fillRect(2, 30, 20, 4);

    if (this.vx !== 0) {
      const legOff = [0, 2, -2][this.walkFrame];
      mctx.fillStyle = '#2020c0';
      mctx.fillRect(4, 28 + legOff, 6, 6);
      mctx.fillRect(14, 28 - legOff, 6, 6);
      mctx.fillStyle = '#8b4513';
      mctx.fillRect(4, 33 + legOff, 6, 3);
      mctx.fillRect(14, 33 - legOff, 6, 3);
    }

    mctx.restore();
  }
}

class Platform {
  constructor(x, y, w, h, type = 'ground') {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = type;
    this.bounceTimer = 0;
    this.opened = false;
  }

  draw(camX) {
    const sx = this.x - camX;
    if (sx + this.w < -10 || sx > MW + 10) return;

    if (this.type === 'ground' || this.type === 'brick') {
      mctx.fillStyle = '#8B5E3C';
      mctx.fillRect(sx, this.y, this.w, this.h);
      mctx.strokeStyle = '#6a3e1c';
      mctx.lineWidth = 1;
      mctx.strokeRect(sx, this.y, this.w, this.h);
      mctx.fillStyle = '#7a4e2c';
      for (let bx = 0; bx < this.w; bx += 20) {
        for (let by = 0; by < this.h; by += 20) {
          mctx.fillRect(sx + bx + 8, this.y + by + 8, 4, 4);
        }
      }
    } else if (this.type === 'question') {
      const by = this.y + (this.hit ? -3 : 0);
      mctx.fillStyle = this.opened ? '#666' : '#c08000';
      mctx.fillRect(sx, by, this.w, this.h);
      mctx.strokeStyle = this.opened ? '#444' : '#a06000';
      mctx.lineWidth = 2;
      mctx.strokeRect(sx, by, this.w, this.h);
      if (!this.opened) {
        mctx.fillStyle = '#fff';
        mctx.font = 'bold 16px Arial';
        mctx.textAlign = 'center';
        mctx.fillText('?', sx + this.w / 2, by + this.h - 6);
      }
      if (this.hit) this.hit = false;
    } else if (this.type === 'pipe') {
      mctx.fillStyle = '#2a2';
      mctx.fillRect(sx, this.y, this.w, this.h);
      mctx.fillStyle = '#4c4';
      mctx.fillRect(sx + 3, this.y, this.w - 6, this.h);
      mctx.strokeStyle = '#1a1';
      mctx.lineWidth = 1;
      mctx.strokeRect(sx, this.y, this.w, this.h);
      mctx.fillStyle = '#4c4';
      mctx.fillRect(sx - 4, this.y, this.w + 8, 8);
    }
  }
}

class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 28;
    this.h = 28;
    this.vx = -1.5;
    this.vy = 0;
    this.alive = true;
    this.squishTimer = 0;
    this.frame = 0;
    this.frameTimer = 0;
  }

  update() {
    if (!this.alive) {
      if (this.squishTimer > 0) this.squishTimer--;
      return;
    }

    this.vy += GRAVITY;
    this.x += this.vx;
    this.resolveX();
    this.y += this.vy;
    this.resolveY();

    if (this.y > MH + 100) this.alive = false;

    this.frameTimer++;
    if (this.frameTimer > 10) {
      this.frameTimer = 0;
      this.frame = (this.frame + 1) % 2;
    }
  }

  resolveX() {
    for (const p of platforms) {
      if (this.x < p.x + p.w && this.x + this.w > p.x &&
          this.y < p.y + p.h && this.y + this.h > p.y) {
        if (this.vx > 0) this.x = p.x - this.w;
        else this.x = p.x + p.w;
        this.vx *= -1;
      }
    }
  }

  resolveY() {
    for (const p of platforms) {
      if (this.x < p.x + p.w && this.x + this.w > p.x &&
          this.y < p.y + p.h && this.y + this.h > p.y) {
        if (this.vy > 0) {
          this.y = p.y - this.h;
          this.vy = 0;
        }
      }
    }
  }

  stomp() {
    this.alive = false;
    this.squishTimer = 30;
    this.h = 10;
    this.y += 18;
  }

  draw(camX) {
    const sx = this.x - camX;
    if (sx + this.w < -10 || sx > MW + 10) return;

    if (!this.alive && this.squishTimer > 0) {
      mctx.fillStyle = '#8B4513';
      mctx.fillRect(sx, this.y, this.w, this.h);
      return;
    }

    if (!this.alive) return;

    mctx.fillStyle = '#8B4513';
    mctx.beginPath();
    mctx.arc(sx + this.w / 2, this.y + 8, 14, Math.PI, 0);
    mctx.fill();
    mctx.fillRect(sx, this.y + 8, this.w, 14);

    mctx.fillStyle = '#f0b080';
    mctx.fillRect(sx + 4, this.y + 12, 8, 6);
    mctx.fillRect(sx + 16, this.y + 12, 8, 6);

    mctx.fillStyle = '#222';
    if (this.frame === 0) {
      mctx.fillRect(sx + 6, this.y + 5, 4, 4);
      mctx.fillRect(sx + 18, this.y + 5, 4, 4);
    } else {
      mctx.fillRect(sx + 4, this.y + 5, 4, 4);
      mctx.fillRect(sx + 20, this.y + 5, 4, 4);
    }

    mctx.fillStyle = '#222';
    mctx.fillRect(sx + 4, this.y + 22, 4, 6);
    mctx.fillRect(sx + 10, this.y + 22, 4, 6);
    mctx.fillRect(sx + 16, this.y + 22, 4, 6);

    mctx.strokeStyle = '#6a3e1c';
    mctx.lineWidth = 1;
    mctx.strokeRect(sx, this.y, this.w, 22);
  }
}

class CoinItem {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 8;
    this.collected = false;
  }

  draw(camX) {
    if (this.collected) return;
    const sx = this.x - camX;
    if (sx < -10 || sx > MW + 10) return;

    const bob = Math.sin(Date.now() / 200) * 2;
    mctx.fillStyle = '#ff0';
    mctx.beginPath();
    mctx.arc(sx, this.y + bob, this.r, 0, Math.PI * 2);
    mctx.fill();
    mctx.fillStyle = '#da0';
    mctx.beginPath();
    mctx.arc(sx, this.y + bob, this.r * 0.6, 0, Math.PI * 2);
    mctx.fill();
  }
}

class FlagPole {
  constructor(x) {
    this.x = x;
    this.y = 80;
    this.h = 340;
    this.flagY = 80;
  }

  draw(camX) {
    const sx = this.x - camX;
    mctx.fillStyle = '#888';
    mctx.fillRect(sx, this.y, 6, this.h);
    mctx.fillStyle = '#4a4';
    mctx.fillRect(sx + 6, this.flagY, 30, 20);
    mctx.fillStyle = '#fff';
    mctx.beginPath();
    mctx.arc(sx + 3, this.y, 8, 0, Math.PI * 2);
    mctx.fill();
  }
}

function spawnCoinPop(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: -Math.random() * 5 - 2,
      life: 30 + Math.random() * 20,
      r: 2 + Math.random() * 2,
    });
  }
}

function buildLevel() {
  platforms = [];
  enemies = [];
  coinItems = [];

  for (let x = 0; x < LEVEL_W; x += 40) {
    platforms.push(new Platform(x, 460, 40, 40, 'ground'));
  }

  platforms.push(new Platform(400, 400, 180, 20, 'brick'));
  platforms.push(new Platform(700, 320, 160, 20, 'brick'));
  platforms.push(new Platform(900, 460, 80, 40, 'ground'));

  platforms.push(new Platform(1100, 360, 40, 40, 'question'));
  platforms.push(new Platform(1140, 360, 40, 40, 'brick'));
  platforms.push(new Platform(1180, 360, 40, 40, 'question'));
  platforms.push(new Platform(1220, 360, 40, 40, 'brick'));
  platforms.push(new Platform(1260, 360, 40, 40, 'question'));

  platforms.push(new Platform(1400, 400, 120, 20, 'brick'));

  for (let x = 960; x < 1120; x += 40) {
    platforms.push(new Platform(x, 300, 40, 40, 'brick'));
  }
  for (let x = 1200; x < 1360; x += 40) {
    platforms.push(new Platform(x, 300, 40, 40, 'brick'));
  }

  for (let x = 1600; x < LEVEL_W - 200; x += 40) {
    platforms.push(new Platform(x, 460, 40, 40, 'ground'));
  }

  platforms.push(new Platform(1800, 380, 120, 20, 'brick'));
  platforms.push(new Platform(2100, 340, 160, 20, 'brick'));

  platforms.push(new Platform(2400, 280, 40, 40, 'question'));
  platforms.push(new Platform(2440, 280, 120, 20, 'brick'));
  platforms.push(new Platform(2560, 280, 40, 40, 'question'));

  platforms.push(new Platform(2800, 380, 200, 20, 'brick'));

  platforms.push(new Platform(3100, 460, 80, 40, 'pipe'));

  for (let x = 3200; x < LEVEL_W; x += 40) {
    platforms.push(new Platform(x, 460, 40, 40, 'ground'));
  }

  enemies.push(new Enemy(500, 430));
  enemies.push(new Enemy(800, 290));
  enemies.push(new Enemy(1050, 430));
  enemies.push(new Enemy(1300, 270));
  enemies.push(new Enemy(1900, 430));
  enemies.push(new Enemy(2200, 310));
  enemies.push(new Enemy(2500, 430));
  enemies.push(new Enemy(2900, 350));

  coinItems.push(new CoinItem(440, 360));
  coinItems.push(new CoinItem(500, 360));
  coinItems.push(new CoinItem(740, 280));
  coinItems.push(new CoinItem(780, 280));
  coinItems.push(new CoinItem(1450, 360));
  coinItems.push(new CoinItem(1850, 340));
  coinItems.push(new CoinItem(2150, 300));
  coinItems.push(new CoinItem(2480, 240));
  coinItems.push(new CoinItem(2850, 340));

  flag = new FlagPole(3800);
}

function resetMario() {
  mario = new Mario();
  mario.y = 400;
  buildLevel();
  mscore = 0;
  mcoins = 0;
  mcamera = 0;
  mover = false;
  mwin = false;
  particles = [];
  mscoreSpan.textContent = '0';
  mcoinsSpan.textContent = '0';
  mmessageEl.textContent = '';
}

function marioUpdate() {
  if (!mrunning || mover) return;

  mario.update();

  if (mario.dead) {
    mover = true;
    mrunning = false;
    mmessageEl.textContent = 'GAME OVER';
    return;
  }

  mcamera = mario.x - MW / 2 + mario.w / 2;
  if (mcamera < 0) mcamera = 0;
  if (mcamera > LEVEL_W - MW) mcamera = LEVEL_W - MW;

  if (mario.onGround && mario.x > flag.x - 30 && mario.x < flag.x + 30) {
    mwin = true;
    mrunning = false;
    mscore += 1000;
    mscoreSpan.textContent = mscore;
    mmessageEl.textContent = 'YOU WIN! Score: ' + mscore;
    return;
  }

  for (const e of enemies) {
    e.update();

    if (e.alive && !mario.dead) {
      if (mario.x < e.x + e.w && mario.x + mario.w > e.x &&
          mario.y < e.y + e.h && mario.y + mario.h > e.y) {
        const fromAbove = mario.vy > 0 && mario.getBottom() - e.y < 15;
        if (fromAbove) {
          e.stomp();
          mario.vy = -8;
          mscore += 100;
          mscoreSpan.textContent = mscore;
        } else if (mario.invincible <= 0) {
          mario.dead = true;
          mario.vy = -8;
        }
      }
    }
  }

  for (const c of coinItems) {
    if (!c.collected) {
      const dx = mario.x + mario.w / 2 - c.x;
      const dy = mario.y + mario.h / 2 - c.y;
      if (Math.sqrt(dx * dx + dy * dy) < c.r + 12) {
        c.collected = true;
        mcoins++;
        mcoinsSpan.textContent = mcoins;
        mscore += 100;
        mscoreSpan.textContent = mscore;
        spawnCoinPop(c.x, c.y);
      }
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.3;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function marioDraw() {
  mctx.clearRect(0, 0, MW, MH);

  const grad = mctx.createLinearGradient(0, 0, 0, MH);
  grad.addColorStop(0, '#5c94fc');
  grad.addColorStop(0.7, '#87ceeb');
  grad.addColorStop(1, '#b0d8f0');
  mctx.fillStyle = grad;
  mctx.fillRect(0, 0, MW, MH);

  for (let x = -((mcamera * 0.3) % 200); x < MW; x += 200) {
    mctx.fillStyle = 'rgba(255,255,255,0.15)';
    mctx.beginPath();
    mctx.moveTo(x + 30, 40);
    mctx.quadraticCurveTo(x + 60, 70, x + 90, 40);
    mctx.quadraticCurveTo(x + 120, 10, x + 150, 40);
    mctx.stroke();
  }

  for (const p of platforms) p.draw(mcamera);

  for (const e of enemies) e.draw(mcamera);

  for (const c of coinItems) c.draw(mcamera);

  for (const p of particles) {
    mctx.fillStyle = `rgba(255,255,100,${p.life / 50})`;
    mctx.beginPath();
    mctx.arc(p.x - mcamera, p.y, p.r, 0, Math.PI * 2);
    mctx.fill();
  }

  if (flag) flag.draw(mcamera);

  mario.draw();
}

function marioLoop() {
  marioUpdate();
  marioDraw();
  requestAnimationFrame(marioLoop);
}

function startMario() {
  if (mrunning) return;
  resetMario();
  mrunning = true;
}

document.addEventListener('keydown', (e) => {
  const section = document.getElementById('mario-section');
  if (!section || !section.classList.contains('active')) return;
  mkeys[e.key] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
});

document.addEventListener('keyup', (e) => {
  mkeys[e.key] = false;
});

mstartBtn.addEventListener('click', startMario);

document.querySelectorAll('.mario-dir-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.dir === 'left') { mkeys['ArrowLeft'] = true; setTimeout(() => mkeys['ArrowLeft'] = false, 100); }
    if (btn.dataset.dir === 'right') { mkeys['ArrowRight'] = true; setTimeout(() => mkeys['ArrowRight'] = false, 100); }
  });
});

document.getElementById('mario-jump-btn')?.addEventListener('click', () => {
  if (mario && mario.onGround) { mario.vy = -10; mario.onGround = false; }
});

resetMario();
marioLoop();
