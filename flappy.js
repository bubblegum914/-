const fcanvas = document.getElementById('flappyCanvas');
const fctx = fcanvas.getContext('2d');
const fscoreSpan = document.getElementById('flappy-score');
const fbestSpan = document.getElementById('flappy-best');
const fstartBtn = document.getElementById('flappy-startBtn');
const fmessageEl = document.getElementById('flappy-message');

const FW = 400, FH = 600;
const GRAVITY = 0.45;
const FLAP_VEL = -7.5;
const PIPE_W = 55;
const PIPE_GAP = 150;
const PIPE_SPEED = 3;
const BIRD_R = 16;

let frunning = false;
let fover = false;
let fscore = 0;
let ftick = 0;
let fbest = parseInt(localStorage.getItem('flappyBest') || '0');
let bird;
let pipes = [];
let pipeTimer = 0;
let pipeInterval = 100;
let clouds = [];
let particles = [];
let scorePopups = [];
let groundOffset = 0;

fbestSpan.textContent = fbest;

const CLOUD_COUNT = 6;

function initClouds() {
  clouds = [];
  for (let i = 0; i < CLOUD_COUNT; i++) {
    clouds.push({
      x: Math.random() * FW,
      y: 30 + Math.random() * 200,
      w: 60 + Math.random() * 100,
      speed: 0.2 + Math.random() * 0.4,
      opacity: 0.4 + Math.random() * 0.4,
    });
  }
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 3;
    this.vy = (Math.random() - 0.5) * 3;
    this.life = 1;
    this.decay = 0.02 + Math.random() * 0.02;
    this.r = 2 + Math.random() * 3;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.05;
    this.life -= this.decay;
  }

  draw() {
    fctx.globalAlpha = this.life;
    fctx.fillStyle = '#fff';
    fctx.beginPath();
    fctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    fctx.fill();
    fctx.globalAlpha = 1;
  }
}

class ScorePopup {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vy = -2;
    this.life = 1;
  }

  update() {
    this.y += this.vy;
    this.vy *= 0.95;
    this.life -= 0.025;
  }

  draw() {
    fctx.globalAlpha = this.life;
    fctx.fillStyle = '#fff';
    fctx.font = 'bold 24px Arial';
    fctx.textAlign = 'center';
    fctx.fillText('+1', this.x, this.y);
    fctx.globalAlpha = 1;
  }
}

class Bird {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 100;
    this.y = FH / 2;
    this.vy = 0;
    this.rot = 0;
    this.wingAngle = 0;
    this.wingDir = 1;
  }

  flap() {
    this.vy = FLAP_VEL;
    this.wingAngle = -0.8;
    this.wingDir = 1;

    for (let i = 0; i < 6; i++) {
      particles.push(new Particle(this.x - 5, this.y));
    }
  }

  update() {
    this.vy += GRAVITY;
    this.y += this.vy;
    this.rot = Math.max(-0.5, Math.min(1.5, this.vy * 0.05));

    this.wingAngle += 0.08 * this.wingDir;
    if (this.wingAngle > 0.5) this.wingDir = -1;
    if (this.wingAngle < -0.3) this.wingDir = 1;
  }

  draw() {
    fctx.save();
    fctx.translate(this.x, this.y);
    fctx.rotate(this.rot);

    const r = BIRD_R;

    this.drawTail(r);
    this.drawFeet(r);

    this.drawBody(r);
    this.drawWing(r);
    this.drawTummy(r);
    this.drawHead(r);
    this.drawBeak(r);
    this.drawEye(r);
    this.drawBlush(r);

    fctx.restore();
  }

  drawBody(r) {
    fctx.fillStyle = '#f0b820';
    fctx.beginPath();
    fctx.ellipse(0, 2, r, r * 0.92, 0, 0, Math.PI * 2);
    fctx.fill();

    fctx.fillStyle = '#e8a810';
    fctx.beginPath();
    fctx.ellipse(-1, 4, r * 0.85, r * 0.75, -0.1, 0, Math.PI * 2);
    fctx.fill();
  }

  drawTummy(r) {
    fctx.fillStyle = '#f8e8a0';
    fctx.beginPath();
    fctx.ellipse(1, 6, r * 0.5, r * 0.4, 0, 0, Math.PI * 2);
    fctx.fill();

    for (let i = 0; i < 4; i++) {
      const ty = 4 + i * 3;
      fctx.strokeStyle = 'rgba(200,160,60,0.3)';
      fctx.lineWidth = 0.5;
      fctx.beginPath();
      fctx.moveTo(-4, ty);
      fctx.lineTo(5, ty);
      fctx.stroke();
    }
  }

  drawHead(r) {
    fctx.fillStyle = '#f5c030';
    const headR = r * 0.65;
    fctx.beginPath();
    fctx.arc(6, -7, headR, 0, Math.PI * 2);
    fctx.fill();
    fctx.fillStyle = '#e8a810';
    fctx.beginPath();
    fctx.arc(6, -5, headR * 0.8, 0, Math.PI * 2);
    fctx.fill();

    fctx.fillStyle = '#f5c030';
    fctx.beginPath();
    fctx.ellipse(5, -12, 3, 4, 0.2, 0, Math.PI * 2);
    fctx.fill();
    fctx.beginPath();
    fctx.ellipse(8, -13, 2.5, 3.5, -0.1, 0, Math.PI * 2);
    fctx.fill();
  }

  drawEye(r) {
    fctx.fillStyle = '#fff';
    fctx.beginPath();
    fctx.ellipse(8, -8, 5.5, 6, 0, 0, Math.PI * 2);
    fctx.fill();

    fctx.fillStyle = '#2a1a0a';
    fctx.beginPath();
    fctx.arc(9.5, -7.5, 3.5, 0, Math.PI * 2);
    fctx.fill();

    fctx.fillStyle = '#fff';
    fctx.beginPath();
    fctx.arc(10.5, -9, 1.8, 0, Math.PI * 2);
    fctx.fill();
    fctx.beginPath();
    fctx.arc(8, -6.5, 1, 0, Math.PI * 2);
    fctx.fill();
  }

  drawBeak(r) {
    fctx.fillStyle = '#f80';
    fctx.beginPath();
    fctx.moveTo(12, -5);
    fctx.lineTo(20, -2);
    fctx.lineTo(12, 0);
    fctx.closePath();
    fctx.fill();

    fctx.fillStyle = '#e06000';
    fctx.beginPath();
    fctx.moveTo(12, -5);
    fctx.lineTo(18, -2.5);
    fctx.lineTo(12, -2);
    fctx.closePath();
    fctx.fill();

    fctx.fillStyle = '#f90';
    fctx.beginPath();
    fctx.moveTo(12, -1);
    fctx.lineTo(19, -1.5);
    fctx.lineTo(12, 0);
    fctx.closePath();
    fctx.fill();

    fctx.fillStyle = '#400';
    fctx.beginPath();
    fctx.ellipse(17, -2, 0.5, 0.3, 0, 0, Math.PI * 2);
    fctx.fill();
  }

  drawBlush(r) {
    fctx.fillStyle = 'rgba(255,150,150,0.35)';
    fctx.beginPath();
    fctx.ellipse(5, -1, 4, 2.5, 0, 0, Math.PI * 2);
    fctx.fill();
  }

  drawWing(r) {
    const wa = this.wingAngle;
    const wx = -5 + Math.sin(wa) * 3;
    const wy = 5 + Math.cos(wa) * 2;

    fctx.fillStyle = '#d09010';
    fctx.beginPath();
    fctx.ellipse(wx, wy, 8, 5 + Math.cos(wa) * 3, -0.3 + Math.sin(wa) * 0.2, 0, Math.PI * 2);
    fctx.fill();

    fctx.fillStyle = '#c08008';
    fctx.beginPath();
    fctx.moveTo(wx - 6, wy - 2);
    fctx.quadraticCurveTo(wx - 12, wy + Math.cos(wa) * 5, wx - 4, wy + 5);
    fctx.closePath();
    fctx.fill();

    fctx.fillStyle = '#b07000';
    fctx.beginPath();
    fctx.moveTo(wx - 4, wy - 1);
    fctx.quadraticCurveTo(wx - 10, wy + 2 + Math.cos(wa) * 4, wx - 3, wy + 4);
    fctx.closePath();
    fctx.fill();

    fctx.strokeStyle = '#a06000';
    fctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const fy = wy - 2 + i * 2.5;
      const fx = wx - 5 + i * 1.5;
      fctx.beginPath();
      fctx.moveTo(fx, fy);
      fctx.quadraticCurveTo(fx - 3, fy + 1, fx - 5, fy + 2);
      fctx.stroke();
    }
  }

  drawTail(r) {
    fctx.fillStyle = '#d09010';
    for (let i = -1; i <= 1; i++) {
      fctx.beginPath();
      fctx.moveTo(-r + 2, i * 3);
      fctx.quadraticCurveTo(-r - 6 - Math.abs(i) * 2, i * 5, -r - 4, i * 7);
      fctx.quadraticCurveTo(-r, i * 5, -r + 2, i * 2);
      fctx.fill();
    }

    fctx.fillStyle = '#c08008';
    for (let i = -1; i <= 1; i++) {
      fctx.beginPath();
      fctx.moveTo(-r + 3, i * 3 + 1);
      fctx.quadraticCurveTo(-r - 3 - Math.abs(i) * 2, i * 5 + 1, -r - 2, i * 6);
      fctx.quadraticCurveTo(-r + 1, i * 4, -r + 3, i * 2 + 1);
      fctx.fill();
    }
  }

  drawFeet(r) {
    fctx.strokeStyle = '#f80';
    fctx.lineWidth = 1.5;
    fctx.lineCap = 'round';

    for (const side of [-1, 1]) {
      const fx = side * 3;
      const fy = r * 0.85;

      fctx.beginPath();
      fctx.moveTo(fx, fy);
      fctx.lineTo(fx, fy + 8);
      fctx.stroke();

      fctx.beginPath();
      fctx.moveTo(fx - 3, fy + 8);
      fctx.lineTo(fx, fy + 8);
      fctx.lineTo(fx + 3, fy + 8);
      fctx.stroke();

      fctx.beginPath();
      fctx.moveTo(fx - 2, fy + 10);
      fctx.lineTo(fx, fy + 8);
      fctx.lineTo(fx + 2, fy + 10);
      fctx.stroke();
    }
  }
}

class Pipe {
  constructor() {
    this.x = FW;
    const minY = 60;
    const maxY = FH - PIPE_GAP - 60;
    this.topH = minY + Math.random() * (maxY - minY);
    this.bottomY = this.topH + PIPE_GAP;
    this.scored = false;
  }

  update() {
    this.x -= PIPE_SPEED;
  }

  draw() {
    const x = this.x;
    const pw = PIPE_W;

    this.drawPipe(x, 0, pw, this.topH, true);
    this.drawPipe(x, this.bottomY, pw, FH - this.bottomY, false);
  }

  drawPipe(x, y, w, h, isTop) {
    const grad = fctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, '#3a3');
    grad.addColorStop(0.2, '#5c5');
    grad.addColorStop(0.5, '#4a4');
    grad.addColorStop(0.8, '#5c5');
    grad.addColorStop(1, '#2a2');
    fctx.fillStyle = grad;
    fctx.fillRect(x, y, w, h);

    fctx.fillStyle = '#6c6';
    if (isTop) {
      fctx.fillRect(x - 3, y + h - 22, w + 6, 22);
    } else {
      fctx.fillRect(x - 3, y, w + 6, 22);
    }

    fctx.fillStyle = '#8e8';
    if (isTop) {
      fctx.fillRect(x + 4, y + h - 20, 8, 18);
      fctx.fillRect(x + w - 12, y + h - 20, 8, 18);
    } else {
      fctx.fillRect(x + 4, y + 2, 8, 18);
      fctx.fillRect(x + w - 12, y + 2, 8, 18);
    }

    fctx.strokeStyle = '#2a2';
    fctx.lineWidth = 2;
    fctx.strokeRect(x, y, w, h);

    if (isTop) {
      fctx.strokeStyle = '#2a2';
      fctx.lineWidth = 1.5;
      fctx.strokeRect(x - 3, y + h - 22, w + 6, 22);
    } else {
      fctx.strokeStyle = '#2a2';
      fctx.lineWidth = 1.5;
      fctx.strokeRect(x - 3, y, w + 6, 22);
    }

    for (let row = 0; row < h; row += 28) {
      fctx.strokeStyle = 'rgba(0,0,0,0.08)';
      fctx.lineWidth = 1;
      fctx.beginPath();
      fctx.moveTo(x, y + row + 14);
      fctx.lineTo(x + w, y + row + 14);
      fctx.stroke();
    }
  }

  hits(bx, by, br) {
    if (bx + br > this.x && bx - br < this.x + PIPE_W) {
      if (by - br < this.topH || by + br > this.bottomY) return true;
    }
    return false;
  }
}

function drawSky() {
  const grad = fctx.createLinearGradient(0, 0, 0, FH - 80);
  grad.addColorStop(0, '#1a8fc4');
  grad.addColorStop(0.3, '#4dc9f6');
  grad.addColorStop(0.6, '#80d8ff');
  grad.addColorStop(1, '#b8e8ff');
  fctx.fillStyle = grad;
  fctx.fillRect(0, 0, FW, FH - 80);
}

function drawClouds() {
  for (const c of clouds) {
    c.x -= c.speed;
    if (c.x + c.w < 0) {
      c.x = FW + 20;
      c.y = 30 + Math.random() * 200;
      c.w = 60 + Math.random() * 100;
    }

    fctx.globalAlpha = c.opacity;
    fctx.fillStyle = '#fff';

    const cx = c.x;
    const cy = c.y;
    const w = c.w;

    fctx.beginPath();
    fctx.arc(cx, cy, w * 0.2, 0, Math.PI * 2);
    fctx.arc(cx + w * 0.25, cy - w * 0.05, w * 0.25, 0, Math.PI * 2);
    fctx.arc(cx + w * 0.5, cy - w * 0.1, w * 0.28, 0, Math.PI * 2);
    fctx.arc(cx + w * 0.7, cy - w * 0.05, w * 0.22, 0, Math.PI * 2);
    fctx.arc(cx + w * 0.85, cy, w * 0.18, 0, Math.PI * 2);
    fctx.arc(cx + w * 0.3, cy + w * 0.05, w * 0.2, 0, Math.PI * 2);
    fctx.arc(cx + w * 0.6, cy + w * 0.05, w * 0.22, 0, Math.PI * 2);
    fctx.fill();

    fctx.globalAlpha = 1;
  }
}

function drawHills() {
  fctx.fillStyle = '#5a8c3a';
  fctx.beginPath();
  fctx.moveTo(0, FH - 80);
  for (let x = 0; x <= FW; x += 4) {
    const y = FH - 80 - 20 - Math.sin(x * 0.008 + 1) * 18 - Math.sin(x * 0.02) * 8;
    fctx.lineTo(x, y);
  }
  fctx.lineTo(FW, FH - 80);
  fctx.closePath();
  fctx.fill();

  fctx.fillStyle = '#6a9c4a';
  fctx.beginPath();
  fctx.moveTo(0, FH - 80);
  for (let x = 0; x <= FW; x += 4) {
    const y = FH - 80 - 10 - Math.sin(x * 0.012 + 3) * 12 - Math.sin(x * 0.025) * 5;
    fctx.lineTo(x, y);
  }
  fctx.lineTo(FW, FH - 80);
  fctx.closePath();
  fctx.fill();
}

function drawGround() {
  const groundY = FH - 80;

  fctx.fillStyle = '#8B5E3C';
  fctx.fillRect(0, groundY, FW, 80);

  fctx.fillStyle = '#7a4e2c';
  fctx.fillRect(0, groundY, FW, 4);

  fctx.fillStyle = '#6a3e1c';
  for (let x = -groundOffset; x < FW; x += 6) {
    fctx.fillRect(x, groundY + 4, 3, 6);
  }

  fctx.fillStyle = '#4a8c2a';
  for (let x = -groundOffset; x < FW; x += 4) {
    const bladeH = 6 + Math.sin(x * 0.5 + ftick * 0.02) * 3;
    fctx.fillRect(x, groundY - bladeH, 2, bladeH);
  }

  fctx.fillStyle = '#5a9c3a';
  for (let x = -groundOffset + 2; x < FW; x += 8) {
    const bladeH = 8 + Math.cos(x * 0.4 + ftick * 0.03) * 3;
    fctx.fillRect(x, groundY - bladeH, 2, bladeH);
  }

  fctx.fillStyle = '#3a7c1a';
  fctx.fillRect(0, groundY - 2, FW, 2);
}

function resetFlappy() {
  bird = new Bird();
  pipes = [];
  particles = [];
  scorePopups = [];
  fscore = 0;
  pipeTimer = 0;
  pipeInterval = 100;
  fover = false;
  fscoreSpan.textContent = '0';
  fmessageEl.textContent = '';
  initClouds();
}

function flappyUpdate() {
  ftick++;
  groundOffset = (groundOffset + PIPE_SPEED) % 6;

  if (!frunning || fover) return;

  bird.update();

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    if (particles[i].life <= 0) particles.splice(i, 1);
  }

  for (let i = scorePopups.length - 1; i >= 0; i--) {
    scorePopups[i].update();
    if (scorePopups[i].life <= 0) scorePopups.splice(i, 1);
  }

  if (bird.y + BIRD_R > FH - 80 || bird.y - BIRD_R < 0) {
    fover = true;
    frunning = false;
    endFlappy();
    return;
  }

  pipeTimer++;
  if (pipeTimer >= pipeInterval) {
    pipeTimer = 0;
    pipes.push(new Pipe());
    pipeInterval = Math.max(55, 100 - fscore * 0.5);
  }

  for (let i = pipes.length - 1; i >= 0; i--) {
    pipes[i].update();
    if (pipes[i].x + PIPE_W < 0) {
      pipes.splice(i, 1);
      continue;
    }
    if (!pipes[i].scored && pipes[i].x + PIPE_W < bird.x) {
      pipes[i].scored = true;
      fscore++;
      fscoreSpan.textContent = fscore;
      scorePopups.push(new ScorePopup(bird.x + 20, bird.y));
    }
    if (pipes[i].hits(bird.x, bird.y, BIRD_R)) {
      fover = true;
      frunning = false;
      endFlappy();
      return;
    }
  }
}

function endFlappy() {
  if (fscore > fbest) {
    fbest = fscore;
    localStorage.setItem('flappyBest', fbest.toString());
    fbestSpan.textContent = fbest;
  }
  fmessageEl.textContent = 'GAME OVER\nScore: ' + fscore;
}

function flappyDraw() {
  fctx.clearRect(0, 0, FW, FH);

  drawSky();
  drawClouds();
  drawHills();

  for (const p of pipes) p.draw();

  for (const p of particles) p.draw();

  for (const s of scorePopups) s.draw();

  bird.draw();

  drawGround();

  if (!frunning && !fover) {
    fctx.fillStyle = 'rgba(0,0,0,0.3)';
    fctx.fillRect(0, 0, FW, FH);

    fctx.fillStyle = '#fff';
    fctx.font = 'bold 36px Arial';
    fctx.textAlign = 'center';
    fctx.fillText('FLAPPY BIRD', FW / 2, FH / 2 - 40);

    fctx.font = '18px Arial';
    fctx.fillText('Press SPACE or Tap to start', FW / 2, FH / 2 + 20);
  }
}

function flappyLoop() {
  flappyUpdate();
  flappyDraw();
  requestAnimationFrame(flappyLoop);
}

function startFlappy() {
  if (frunning) return;
  resetFlappy();
  frunning = true;
}

function doFlap() {
  if (!frunning && !fover) {
    startFlappy();
  }
  if (!frunning) return;
  bird.flap();
}

document.addEventListener('keydown', (e) => {
  const section = document.getElementById('flappy-section');
  if (!section.classList.contains('active')) return;
  if (e.key === ' ' || e.key === 'ArrowUp') {
    e.preventDefault();
    doFlap();
  }
});

fcanvas.addEventListener('click', doFlap);
fstartBtn.addEventListener('click', startFlappy);

document.getElementById('flappy-tap-btn')?.addEventListener('click', doFlap);

resetFlappy();
flappyLoop();
