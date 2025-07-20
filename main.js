const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = 200;

let width = canvas.width;
let height = canvas.height;

const overlay = document.getElementById('overlay');

// Constants
const GROUND_HEIGHT = 30;
const GRAVITY = 0.7;
const JUMP_VELOCITY = -14;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 60;
const OBSTACLE_WIDTH = 40;
const OBSTACLE_HEIGHT = 40;
const COLLECTIBLE_SIZE = 30;
const GROUND_SCROLL_SPEED = 6;
const SPAWN_INTERVAL = 1200;
const COLLECTIBLE_INTERVAL = 1800;

// Game state
let gameState = 'start';
let score = 0;
let highScore = 0;
let lastObstacleTime = 0;
let lastCollectibleTime = 0;
let groundOffset = 0;
let obstacles = [];
let collectibles = [];
let player;

// Load images
const IMAGES = {
  player: new Image(),
  ground: new Image(),
  phone: new Image(),
  party: new Image(),
  bed: new Image(),
  resume: new Image(),
  referral: new Image(),
  laptop: new Image(),
};

IMAGES.player.src = 'assets/student/runner.png';
IMAGES.ground.src = 'assets/background/grass.png';
IMAGES.phone.src = 'assets/distractions/phone.png';
IMAGES.party.src = 'assets/distractions/party.png';
IMAGES.bed.src = 'assets/distractions/beer.png';
IMAGES.resume.src = 'assets/collectibles/books.png';
IMAGES.referral.src = 'assets/collectibles/job.png';
IMAGES.laptop.src = 'assets/collectibles/desk.png';

// Obstacle & collectible types
const OBSTACLE_TYPES = [
  { name: 'Phone' },
  { name: 'Party' },
  { name: 'Bed' },
];
const COLLECTIBLE_TYPES = [
  { name: 'Resume' },
  { name: 'Referral' },
  { name: 'Laptop' },
];

// Utility
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Player
class Player {
  constructor() {
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.x = 50;
    this.y = height - GROUND_HEIGHT - this.height;
    this.vy = 0;
    this.isOnGround = true;
  }

  update() {
    this.vy += GRAVITY;
    this.y += this.vy;
    if (this.y + this.height >= height - GROUND_HEIGHT) {
      this.y = height - GROUND_HEIGHT - this.height;
      this.vy = 0;
      this.isOnGround = true;
    } else {
      this.isOnGround = false;
    }
  }

  jump() {
    if (this.isOnGround) {
      this.vy = JUMP_VELOCITY;
      this.isOnGround = false;
    }
  }

  draw() {
    ctx.drawImage(IMAGES.player, this.x, this.y, this.width, this.height);
  }

  getRect() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}

// Obstacle
class Obstacle {
  constructor() {
    this.type = randomChoice(OBSTACLE_TYPES);
    this.width = OBSTACLE_WIDTH;
    this.height = OBSTACLE_HEIGHT;
    this.x = width + 20;
    this.y = height - GROUND_HEIGHT - this.height;
    this.speed = GROUND_SCROLL_SPEED;
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

// Collectible
class Collectible {
  constructor() {
    this.type = randomChoice(COLLECTIBLE_TYPES);
    this.size = COLLECTIBLE_SIZE;
    this.x = width + 20;
    this.y = height - GROUND_HEIGHT - this.size - 50 - Math.random() * 50;
    this.speed = GROUND_SCROLL_SPEED;
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

// Collision detection
function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Reset game
function resetGame() {
  player = new Player();
  obstacles = [];
  collectibles = [];
  score = 0;
  groundOffset = 0;
  lastObstacleTime = 0;
  lastCollectibleTime = 0;
  width = canvas.width;
  height = canvas.height;
}

// Ground and background
function drawBackground() {
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, width, height);
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
  ctx.font = '16px Arial';
  ctx.fillText('Score: ' + Math.floor(score), 20, 30);
}

// Game update
function updateGame(dt) {
  player.update();

  groundOffset += GROUND_SCROLL_SPEED;
  if (groundOffset > IMAGES.ground.width) groundOffset = 0;

  if (Date.now() - lastObstacleTime > SPAWN_INTERVAL) {
    obstacles.push(new Obstacle());
    lastObstacleTime = Date.now();
  }

  if (Date.now() - lastCollectibleTime > COLLECTIBLE_INTERVAL) {
    collectibles.push(new Collectible());
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
      showOverlay(`Game Over<br>Score: ${Math.floor(score)}<br><span style="font-size:1rem;">Press Space to Restart</span>`);
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

// Key input
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

// Resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  width = canvas.width;
  height = canvas.height;
  if (player) {
    player.y = height - GROUND_HEIGHT - player.height;
  }
});

// Wait for all images to load before starting game
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

// Game loop
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

// Start after images load
loadAllImages(IMAGES, () => {
  showOverlay('Press Space to Start');
  requestAnimationFrame(gameLoop);
});
