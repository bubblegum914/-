const racingCanvas = document.getElementById('racingCanvas');
const rctx = racingCanvas.getContext('2d');
const racingScoreSpan = document.getElementById('racing-score');
const racingSpeedSpan = document.getElementById('racing-speed');
const racingStartBtn = document.getElementById('racing-startBtn');
const racingMessageEl = document.getElementById('racing-message');

const RW = 400, RH = 600;
const ROAD_W = 240;
const LANE_COUNT = 4;
const LANE_W = ROAD_W / LANE_COUNT;
const ROAD_X = (RW - ROAD_W) / 2;

let racingScore = 0;
let racingSpeed = 0;
let maxSpeed = 8;
let racingRunning = false;
let racingOver = false;

let playerCar;
let enemyCars = [];
let roadOffset = 0;
let spawnTimer = 0;
let frameCount = 0;

const CAR_W = 30;
const CAR_H = 50;

const CAR_COLORS = ['#f44', '#4f4', '#44f', '#ff4', '#f4f', '#4ff'];

const KEY = {};

class PlayerCar {
  constructor() {
    this.w = CAR_W;
    this.h = CAR_H;
    this.reset();
  }

  reset() {
    this.x = RW / 2 - this.w / 2;
    this.y = RH - 100;
    this.speed = 4;
  }

  update() {
    if (KEY['ArrowLeft'] || KEY['a']) this.x -= this.speed;
    if (KEY['ArrowRight'] || KEY['d']) this.x += this.speed;
    const leftLimit = ROAD_X + 5;
    const rightLimit = ROAD_X + ROAD_W - this.w - 5;
    if (this.x < leftLimit) this.x = leftLimit;
    if (this.x > rightLimit) this.x = rightLimit;
  }

  draw() {
    rctx.save();
    rctx.translate(this.x + this.w / 2, this.y + this.h / 2);

    rctx.fillStyle = '#0af';
    rctx.fillRect(-this.w / 2, -this.h / 2 + 5, this.w, this.h - 10);

    rctx.fillStyle = '#08d';
    rctx.fillRect(-this.w / 2 + 4, -this.h / 2 + 2, this.w - 8, this.h / 3);

    rctx.fillStyle = '#fff';
    rctx.fillRect(-8, -this.h / 2 + 12, 5, 8);
    rctx.fillRect(3, -this.h / 2 + 12, 5, 8);

    rctx.fillStyle = '#f44';
    rctx.fillRect(-this.w / 2 + 3, this.h / 2 - 15, 8, 10);
    rctx.fillRect(this.w / 2 - 11, this.h / 2 - 15, 8, 10);

    rctx.restore();
  }

  getRect() {
    return { x: this.x + 4, y: this.y + 4, w: this.w - 8, h: this.h - 8 };
  }
}

class EnemyCar {
  constructor(lane, speed) {
    this.lane = lane;
    this.x = ROAD_X + lane * LANE_W + (LANE_W - CAR_W) / 2;
    this.y = -CAR_H;
    this.w = CAR_W;
    this.h = CAR_H;
    this.speed = speed;
    this.color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
  }

  update() {
    this.y += this.speed;
  }

  draw() {
    rctx.save();
    rctx.translate(this.x + this.w / 2, this.y + this.h / 2);

    rctx.fillStyle = this.color;
    rctx.fillRect(-this.w / 2, -this.h / 2 + 5, this.w, this.h - 10);

    rctx.fillStyle = '#222';
    rctx.fillRect(-this.w / 2 + 4, -this.h / 2 + 2, this.w - 8, this.h / 3);

    rctx.fillStyle = '#fff';
    rctx.fillRect(-8, -this.h / 2 + 12, 5, 8);
    rctx.fillRect(3, -this.h / 2 + 12, 5, 8);

    rctx.fillStyle = '#f44';
    rctx.fillRect(-this.w / 2 + 3, this.h / 2 - 15, 8, 10);
    rctx.fillRect(this.w / 2 - 11, this.h / 2 - 15, 8, 10);

    rctx.restore();
  }

  getRect() {
    return { x: this.x + 4, y: this.y + 4, w: this.w - 8, h: this.h - 8 };
  }
}

function rectCollide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function drawRoad() {
  rctx.fillStyle = '#2a2a2a';
  rctx.fillRect(0, 0, RW, RH);

  rctx.fillStyle = '#444';
  rctx.fillRect(ROAD_X, 0, ROAD_W, RH);

  rctx.fillStyle = '#fff';
  rctx.fillRect(ROAD_X, 0, 3, RH);
  rctx.fillRect(ROAD_X + ROAD_W - 3, 0, 3, RH);

  rctx.strokeStyle = '#ff0';
  rctx.lineWidth = 2;
  rctx.setLineDash([20, 15]);
  for (let i = 1; i < LANE_COUNT; i++) {
    const lx = ROAD_X + i * LANE_W;
    rctx.beginPath();
    rctx.moveTo(lx, -roadOffset);
    rctx.lineTo(lx, RH - roadOffset);
    rctx.stroke();
  }
  rctx.setLineDash([]);

  rctx.fillStyle = '#0a0';
  rctx.fillRect(0, 0, ROAD_X, RH);
  rctx.fillRect(ROAD_X + ROAD_W, 0, RW - ROAD_X - ROAD_W, RH);
}

function spawnEnemy() {
  const lane = Math.floor(Math.random() * LANE_COUNT);
  const baseSpeed = 2 + racingSpeed * 0.3;
  const speed = baseSpeed + Math.random() * 1.5;
  enemyCars.push(new EnemyCar(lane, speed));
}

function resetRacing() {
  playerCar = new PlayerCar();
  enemyCars = [];
  racingScore = 0;
  racingSpeed = 1;
  roadOffset = 0;
  spawnTimer = 0;
  frameCount = 0;
  racingOver = false;
  racingScoreSpan.textContent = '0';
  racingSpeedSpan.textContent = '1';
  racingMessageEl.textContent = '';
}

function racingUpdate() {
  if (!racingRunning || racingOver) return;

  frameCount++;
  roadOffset = (roadOffset + racingSpeed) % 20;
  playerCar.update();

  racingSpeed = Math.min(maxSpeed, 1 + Math.floor(racingScore / 100) * 0.5);
  racingSpeedSpan.textContent = Math.round(racingSpeed * 10) / 10;

  spawnTimer++;
  const spawnRate = Math.max(20, 60 - racingSpeed * 4);
  if (spawnTimer >= spawnRate) {
    spawnTimer = 0;
    if (Math.random() < 0.7) spawnEnemy();
  }

  for (let i = enemyCars.length - 1; i >= 0; i--) {
    enemyCars[i].update();
    if (enemyCars[i].y > RH + 50) {
      enemyCars.splice(i, 1);
      racingScore += 10;
      racingScoreSpan.textContent = racingScore;
    }
  }

  const pr = playerCar.getRect();
  for (const e of enemyCars) {
    if (rectCollide(pr, e.getRect())) {
      racingOver = true;
      racingRunning = false;
      racingMessageEl.textContent = 'CRASH! Score: ' + racingScore;
      return;
    }
  }

  racingScore += 0.05;
  racingScoreSpan.textContent = Math.floor(racingScore);
}

function racingDraw() {
  rctx.clearRect(0, 0, RW, RH);
  drawRoad();
  for (const e of enemyCars) e.draw();
  playerCar.draw();
}

function racingLoop() {
  racingUpdate();
  racingDraw();
  requestAnimationFrame(racingLoop);
}

function startRacing() {
  if (racingRunning) return;
  resetRacing();
  racingRunning = true;
  racingOver = false;
}

document.addEventListener('keydown', (e) => {
  const racingSection = document.getElementById('racing-section');
  if (!racingSection.classList.contains('active')) return;
  KEY[e.key] = true;
  if (!racingRunning || racingOver) return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault();
});

document.addEventListener('keyup', (e) => {
  KEY[e.key] = false;
});

racingStartBtn.addEventListener('click', startRacing);

document.querySelectorAll('.racing-dir-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!racingRunning || racingOver) return;
    const step = 40;
    if (btn.dataset.dir === 'left') playerCar.x -= step;
    if (btn.dataset.dir === 'right') playerCar.x += step;
    const leftLimit = ROAD_X + 5;
    const rightLimit = ROAD_X + ROAD_W - playerCar.w - 5;
    if (playerCar.x < leftLimit) playerCar.x = leftLimit;
    if (playerCar.x > rightLimit) playerCar.x = rightLimit;
  });
});

resetRacing();
racingLoop();
