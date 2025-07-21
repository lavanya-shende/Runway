const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = 400;

let width = canvas.width;
let height = canvas.height;

const overlay = document.getElementById('overlay');

// Constants
const GROUND_HEIGHT = 40;
const GRAVITY = 0.7;
const JUMP_VELOCITY = -22;
const PLAYER_WIDTH = 80;
const PLAYER_HEIGHT = 110;
const OBSTACLE_WIDTH = 60;
const OBSTACLE_HEIGHT = 60;
const COLLECTIBLE_SIZE = 50;
const SPAWN_INTERVAL = 1200;
const COLLECTIBLE_INTERVAL = 1800;

// Dynamic Speed Control
let baseSpeed = 3;
const speedIncrement = 0.001;

let gameState = 'start';
let score = 0;
let highScore = 0;
let lastObstacleTime = 0;
let lastCollectibleTime = 0;
let groundOffset = 0;
let obstacles = [];
let collectibles = [];
let player;

const IMAGES = {
  player: new Image(),
  ground: new Image(),

  phone: new Image(),
  party: new Image(),
  bed: new Image(),
  game: new Image(),
  sleep: new Image(),

  resume: new Image(),
  referral: new Image(),
  laptop: new Image(),
  internship: new Image(),
  certificate: new Image(),
};

IMAGES.player.src = 'assets/student/s.png'; // Spritesheet (823x297)
IMAGES.ground.src = 'assets/background/grass.png';

IMAGES.phone.src = 'assets/distractions/phone.png';
IMAGES.party.src = 'assets/distractions/party.png';
IMAGES.bed.src = 'assets/distractions/beer.png';
IMAGES.game.src = 'assets/distractions/movies.png';
IMAGES.sleep.src = 'assets/distractions/pizza.png';

IMAGES.resume.src = 'assets/collectibles/books.png';
IMAGES.referral.src = 'assets/collectibles/job.png';
IMAGES.laptop.src = 'assets/collectibles/work.png';
IMAGES.internship.src = 'assets/collectibles/linkedin.png';
IMAGES.certificate.src = 'assets/collectibles/programming.png';

const OBSTACLE_TYPES = [
  { name: 'Phone' },
  { name: 'Party' },
  { name: 'Bed' },
  { name: 'Game' },
  { name: 'Sleep' },
];

const COLLECTIBLE_TYPES = [
  { name: 'Resume' },
  { name: 'Referral' },
  { name: 'Laptop' },
  { name: 'Internship' },
  { name: 'Certificate' },
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

class Player {
    constructor() {
      this.width = 80; // how big to draw on canvas
      this.height = 110;
      this.x = 100;
      this.y = height - GROUND_HEIGHT - this.height;
      this.vy = 0;
      this.isOnGround = true;
  
      // Sprite animation (744x256 → 4 frames)
      this.frameIndex = 0;
      this.frameCount = 4;
      this.frameWidth = 186;     // 744 / 4
      this.frameHeight = 256;    // full image height
      this.frameTimer = 0;
      this.frameInterval = 100;
    }
  
    update(dt) {
      // Apply gravity
      this.vy += GRAVITY;
      this.y += this.vy;
  
      // Land on ground
      if (this.y + this.height >= height - GROUND_HEIGHT) {
        this.y = height - GROUND_HEIGHT - this.height;
        this.vy = 0;
        this.isOnGround = true;
      } else {
        this.isOnGround = false;
      }
  
      // Animate only while running (on ground)
      if (this.isOnGround) {
        this.frameTimer += dt;
        if (this.frameTimer >= this.frameInterval) {
          this.frameIndex = (this.frameIndex + 1) % this.frameCount;
          this.frameTimer = 0;
        }
      }
    }
  
    jump() {
      if (this.isOnGround) {
        this.vy = JUMP_VELOCITY; // now jump works fine
        this.isOnGround = false;
      }
    }
  
    draw() {
      // Optional crop: trim 10px from both left and right of each frame
    //   const cropOffset = 10;
      const cropRight = 16;

  
      ctx.drawImage(
        IMAGES.player,
        Math.floor(this.frameIndex * this.frameWidth + cropRight), 0,
        this.frameWidth - cropRight * 2, this.frameHeight,
        this.x, this.y,
        this.width, this.height
      );
    }
  
    getRect() {
      return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
  }
  

class Obstacle {
  constructor() {
    this.type = randomChoice(OBSTACLE_TYPES);
    this.width = OBSTACLE_WIDTH;
    this.height = OBSTACLE_HEIGHT;
    this.x = width + 20;
    this.y = height - GROUND_HEIGHT - this.height;
    this.speed = baseSpeed;
    this.image = IMAGES[this.type.name.toLowerCase()];
  }

  update() {
    this.x -= this.speed;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  getRect() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}

class Collectible {
  constructor() {
    this.type = randomChoice(COLLECTIBLE_TYPES);
    this.size = COLLECTIBLE_SIZE;
    this.x = width + 20;
    this.y = height - GROUND_HEIGHT - this.size - 80 - Math.random() * 60;
    this.speed = baseSpeed;
    this.collected = false;
    this.image = IMAGES[this.type.name.toLowerCase()];
  }

  update() {
    this.x -= this.speed;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
  }

  getRect() {
    return { x: this.x, y: this.y, width: this.size, height: this.size };
  }
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function resetGame() {
  player = new Player();
  obstacles = [];
  collectibles = [];
  score = 0;
  baseSpeed = 3;
  groundOffset = 0;
  lastObstacleTime = 0;
  lastCollectibleTime = 0;
  width = canvas.width;
  height = canvas.height;
}

function drawBackground() {
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, width, height - GROUND_HEIGHT);

  ctx.fillStyle = '#111';
  ctx.fillRect(0, height - GROUND_HEIGHT, width, GROUND_HEIGHT);
}

function drawGround() {
  const tileWidth = IMAGES.ground.width;
  const tileHeight = GROUND_HEIGHT;

  for (let x = -groundOffset; x < width; x += tileWidth) {
    ctx.drawImage(IMAGES.ground, x, height - GROUND_HEIGHT, tileWidth, tileHeight);
  }
}

function drawScore() {
  ctx.fillStyle = '#fff';
  ctx.font = '18px Arial';
  ctx.fillText('Score: ' + Math.floor(score), 20, 30);
}

function updateGame(dt) {
  player.update(dt);

  baseSpeed += speedIncrement;
  groundOffset += baseSpeed;

  obstacles.forEach(o => o.speed = baseSpeed);
  collectibles.forEach(c => c.speed = baseSpeed);

  if (groundOffset > IMAGES.ground.width) groundOffset = 0;

  if (Date.now() - lastObstacleTime > SPAWN_INTERVAL) {
    const newObstacle = new Obstacle();
    newObstacle.speed = baseSpeed;
    obstacles.push(newObstacle);
    lastObstacleTime = Date.now();
  }

  if (Date.now() - lastCollectibleTime > COLLECTIBLE_INTERVAL) {
    const newCollectible = new Collectible();
    newCollectible.speed = baseSpeed;
    collectibles.push(newCollectible);
    lastCollectibleTime = Date.now();
  }

  obstacles.forEach(o => o.update());
  obstacles = obstacles.filter(o => o.x + o.width > 0);

  collectibles.forEach(c => c.update());
  collectibles = collectibles.filter(c => c.x + c.size > 0 && !c.collected);

  for (let o of obstacles) {
    if (rectsOverlap(player.getRect(), o.getRect())) {
      gameState = 'gameover';
      highScore = Math.max(highScore, Math.floor(score));
      showOverlay(`Game Over<br>Score: ${Math.floor(score)}<br>`);
      return;
    }
  }

  for (let c of collectibles) {
    if (!c.collected && rectsOverlap(player.getRect(), c.getRect())) {
      c.collected = true;
      score += 10;
    }
  }

  score += dt * 0.03;
}

function drawGame() {
  drawBackground();
  drawGround();
  player.draw();
  obstacles.forEach(o => o.draw());
  collectibles.forEach(c => c.draw());
  drawScore();
}

function showOverlay(text) {
  overlay.innerHTML = text;
  overlay.style.display = 'flex';
}

function hideOverlay() {
  overlay.innerHTML = '';
  overlay.style.display = 'none';
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (gameState === 'start') {
      hideOverlay();
      resetGame();
      gameState = 'running';
    } else if (gameState === 'running') {
      player.jump();
    } else if (gameState === 'gameover') {
      hideOverlay();
      resetGame();
      gameState = 'running';
    }
    e.preventDefault();
  }
});

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = 400;
  width = canvas.width;
  height = canvas.height;
  if (player) {
    player.y = height - GROUND_HEIGHT - player.height;
  }
});

function loadAllImages(images, callback) {
  let loaded = 0;
  const total = Object.keys(images).length;
  for (let key in images) {
    images[key].onload = () => {
      loaded++;
      if (loaded === total) callback();
    };
  }
}

let lastFrame = performance.now();
function gameLoop(now) {
  let dt = now - lastFrame;
  lastFrame = now;
  if (gameState === 'running') {
    updateGame(dt);
    drawGame();
  }
  requestAnimationFrame(gameLoop);
}

loadAllImages(IMAGES, () => {
  showOverlay('Press Space to Start');
  requestAnimationFrame(gameLoop);
});
