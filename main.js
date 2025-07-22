const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = 400;

let width = canvas.width;
let height = canvas.height;

const overlay = document.getElementById("overlay");

// Constants
const GROUND_HEIGHT = 40;
const GRAVITY = 0.7;
const JUMP_VELOCITY = -22;
const PLAYER_WIDTH = 80;
const PLAYER_HEIGHT = 110;
const OBSTACLE_WIDTH = 60;
const OBSTACLE_HEIGHT = 60;
const COLLECTIBLE_SIZE = 50;
const SPAWN_INTERVAL_START = 2000;
const COLLECTIBLE_INTERVAL_START = 2500;
const MIN_SPAWN_INTERVAL = 600;
const MIN_COLLECTIBLE_INTERVAL = 800;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;

// Speed Control
let baseSpeed = 3;
const speedIncrement = 0.001;

// Game State
let gameState = "start";
let score = 0;
let lastObstacleTime = 0;
let lastCollectibleTime = 0;
let groundOffset = 0;
let obstacles = [];
let collectibles = [];
let player;

// Load Images
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

IMAGES.player.src = "assets/student/s.png"; // Spritesheet (744x256, 4 frames)
IMAGES.ground.src = "assets/background/grass.png";
IMAGES.phone.src = "assets/distractions/phone.png";
IMAGES.party.src = "assets/distractions/party.png";
IMAGES.bed.src = "assets/distractions/beer.png";
IMAGES.game.src = "assets/distractions/movies.png";
IMAGES.sleep.src = "assets/distractions/pizza.png";
IMAGES.resume.src = "assets/collectibles/books.png";
IMAGES.referral.src = "assets/collectibles/job.png";
IMAGES.laptop.src = "assets/collectibles/work.png";
IMAGES.internship.src = "assets/collectibles/linkedin.png";
IMAGES.certificate.src = "assets/collectibles/programming.png";

const OBSTACLE_TYPES = [
  { name: "Phone" },
  { name: "Party" },
  { name: "Bed" },
  { name: "Game" },
  { name: "Sleep" },
];

const COLLECTIBLE_TYPES = [
  { name: "Resume" },
  { name: "Referral" },
  { name: "Laptop" },
  { name: "Internship" },
  { name: "Certificate" },
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

class Player {
  constructor() {
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.x = 100;
    this.y = height - GROUND_HEIGHT - this.height;
    this.vy = 0;
    this.isOnGround = true;

    // Sprite Animation
    this.frameIndex = 0;
    this.frameCount = 4;
    this.frameWidth = 186;
    this.frameHeight = 256;
    this.frameTimer = 0;
    this.frameInterval = 100;
  }

  update(dt) {
    this.vy += GRAVITY;
    this.y += this.vy;

    if (this.y + this.height >= height - GROUND_HEIGHT) {
      this.y = height - GROUND_HEIGHT - this.height;
      this.vy = 0;
      this.isOnGround = true;
    } else {
      this.isOnGround = false;
    }

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
      this.vy = JUMP_VELOCITY;
      this.isOnGround = false;
    }
  }

  draw() {
    const cropRight = 16;
    ctx.drawImage(
      IMAGES.player,
      this.frameIndex * this.frameWidth + cropRight,
      0,
      this.frameWidth - cropRight * 2,
      this.frameHeight,
      this.x,
      this.y,
      this.width,
      this.height
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
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, width, height - GROUND_HEIGHT);

  ctx.fillStyle = "#111";
  ctx.fillRect(0, height - GROUND_HEIGHT, width, GROUND_HEIGHT);
}

function drawGround() {
  const tileWidth = IMAGES.ground.width;
  const tileHeight = GROUND_HEIGHT;

  for (let x = -groundOffset; x < width; x += tileWidth) {
    ctx.drawImage(
      IMAGES.ground,
      x,
      height - GROUND_HEIGHT,
      tileWidth,
      tileHeight
    );
  }
}

function drawScore() {
  ctx.fillStyle = "#fff";
  ctx.font = "18px Arial";
  ctx.fillText("Score: " + Math.floor(score), 20, 30);
  ctx.fillText("Best: " + highScore, 20, 55);
}

function updateGame(dt) {
  player.update(dt);

  baseSpeed += speedIncrement;
  groundOffset += baseSpeed;

  obstacles.forEach((o) => (o.speed = baseSpeed));
  collectibles.forEach((c) => (c.speed = baseSpeed));

  if (groundOffset > IMAGES.ground.width) groundOffset = 0;

  let currentSpawnInterval = Math.max(
    MIN_SPAWN_INTERVAL,
    SPAWN_INTERVAL_START - score * 2
  );
  let currentCollectibleInterval = Math.max(
    MIN_COLLECTIBLE_INTERVAL,
    COLLECTIBLE_INTERVAL_START - score * 2.5
  );

  if (Date.now() - lastObstacleTime > currentSpawnInterval) {
    obstacles.push(new Obstacle());
    lastObstacleTime = Date.now();
  }

  if (Date.now() - lastCollectibleTime > currentCollectibleInterval) {
    collectibles.push(new Collectible());
    lastCollectibleTime = Date.now();
  }

  obstacles.forEach((o) => o.update());
  obstacles = obstacles.filter((o) => o.x + o.width > 0);

  collectibles.forEach((c) => c.update());
  collectibles = collectibles.filter((c) => c.x + c.size > 0 && !c.collected);

  for (let o of obstacles) {
    if (rectsOverlap(player.getRect(), o.getRect())) {
      const currentScore = Math.floor(score);

      if (currentScore > highScore) {
        highScore = currentScore;
        localStorage.setItem("highScore", highScore);
      }

      gameState = "gameover";
      console.log(
        "Game Over! currentScore:",
        currentScore,
        "highScore:",
        highScore
      );
      showOverlay(
        `Game Over<br>
       Score: ${currentScore}<br>
       Best: ${highScore}<br>
       Press Space to Restart`
      );
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
  obstacles.forEach((o) => o.draw());
  collectibles.forEach((c) => c.draw());
  drawScore();
}

function showOverlay(text = "") {
  const currentScore = Math.floor(score);
  const savedHighScore = parseInt(localStorage.getItem("highScore")) || 0;

  const isGameOver = gameState === "gameover";
  const isStart = gameState === "start";

  overlay.innerHTML = `
    <div style="
      text-align: center;
      font-family: 'Segoe UI', Tahoma, sans-serif;
      color: #fff;
      padding: 20px;
    ">
      ${
        isGameOver
          ? `
        <div style="font-size: 36px; font-weight: bold; margin-bottom: 10px; color: #ff4d4d;">
          Game Over
        </div>
        <div style="font-size: 20px; margin-bottom: 8px;">
          Score: ${currentScore}
        </div>
        <div style="font-size: 20px; margin-bottom: 20px;">
          Best: ${Math.max(currentScore, savedHighScore)}
        </div>
        <div style="font-size: 16px; opacity: 0.7;">
          Press <strong>Space</strong> to Restart
        </div>
      `
          : isStart
          ? `
        <div style="font-size: 30px; margin-bottom: 10px;">
          Welcome to Runway Runner!
        </div>
        <div style="font-size: 18px; margin-bottom: 8px;">
          Best: ${savedHighScore}
        </div>
        <div style="font-size: 16px; opacity: 0.7;">
  Tap or press <strong>Space</strong> to play
</div>

      `
          : ""
      }
    </div>
  `;
  overlay.style.display = "flex";
}

function hideOverlay() {
  overlay.innerHTML = "";
  overlay.style.display = "none";
}

function startOrJump() {
  if (gameState === "start" || gameState === "gameover") {
    hideOverlay();
    resetGame();
    gameState = "running";
  } else if (gameState === "running") {
    player.jump();
  }
}

// Spacebar support for desktop
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    startOrJump();
    e.preventDefault();
  }
});

// Touch support for mobile
window.addEventListener("touchstart", (e) => {
  startOrJump();
  e.preventDefault();
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = 400;
  width = canvas.width;
  height = canvas.height;
  if (player) player.y = height - GROUND_HEIGHT - player.height;
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
  const dt = now - lastFrame;
  lastFrame = now;
  if (gameState === "running") {
    updateGame(dt);
    drawGame();
  }
  requestAnimationFrame(gameLoop);
}

loadAllImages(IMAGES, () => {
  showOverlay(`Best: ${highScore}<br>Tap or Press Space to Start`);
  requestAnimationFrame(gameLoop);
});
