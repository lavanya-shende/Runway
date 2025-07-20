const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

const gravity = 1.5;

class Player {
  constructor() {
    this.position = { x: 100, y: 100 };
    this.velocity = { x: 0, y: 0 };
    this.width = 32;
    this.height = 32;
    this.speed = 5;
  }

  draw() {
    c.fillStyle = 'red';
    c.fillRect(this.position.x, this.position.y, this.width, this.height);
  }

  update(platforms) {
    this.draw();

    // Horizontal movement
    this.position.x += this.velocity.x;

    // Vertical movement
    this.velocity.y += gravity;
    this.position.y += this.velocity.y;

    // Platform collision
    platforms.forEach(platform => {
      const isAbovePlatform = this.position.y + this.height <= platform.position.y;
      const willLandOnPlatform = this.position.y + this.height + this.velocity.y >= platform.position.y;
      const isWithinPlatformWidth =
        this.position.x + this.width >= platform.position.x &&
        this.position.x <= platform.position.x + platform.width;

      if (isAbovePlatform && willLandOnPlatform && isWithinPlatformWidth) {
        this.velocity.y = 0;
        this.position.y = platform.position.y - this.height;
      }
    });

    // Bottom of canvas ground collision
    if (this.position.y + this.height >= canvas.height) {
      this.velocity.y = 0;
      this.position.y = canvas.height - this.height;
    }
  }
}

class Platform {
  constructor(x, y) {
    this.position = { x, y };
    this.width = 250;
    this.height = 20;
  }

  draw() {
    c.fillStyle = 'blue';
    c.fillRect(this.position.x, this.position.y, this.width, this.height);
  }
}

const player = new Player();

let platforms = [
  new Platform(300, 400),
  new Platform(600, 300),
  new Platform(1000, 350),
  new Platform(1400, 250),
  new Platform(1800, 300),
];

const keys = {
  right: { pressed: false },
  left: { pressed: false }
};

let scrollOffset = 0;

function animate() {
  requestAnimationFrame(animate);
  c.clearRect(0, 0, canvas.width, canvas.height);

  // Movement control
  if (keys.right.pressed) {
    player.velocity.x = player.speed;
  } else if (keys.left.pressed) {
    player.velocity.x = -player.speed;
  } else {
    player.velocity.x = 0;
  }

  // World scrolling
  if (player.position.x + player.width >= canvas.width / 2 && keys.right.pressed) {
    scrollOffset += player.speed;
    platforms.forEach(platform => {
      platform.position.x -= player.speed;
    });
    player.velocity.x = 0;
  } else if (player.position.x <= 100 && keys.left.pressed) {
    scrollOffset -= player.speed;
    platforms.forEach(platform => {
      platform.position.x += player.speed;
    });
    player.velocity.x = 0;
  }

  player.update(platforms);
  platforms.forEach(platform => platform.draw());
}

animate();

addEventListener('keydown', (event) => {
  switch (event.key) {
    case "ArrowUp":
      // Jump only if on ground
      if (player.velocity.y === 0) {
        player.velocity.y = -30;
      }
      break;
    case "ArrowLeft":
      keys.left.pressed = true;
      break;
    case "ArrowRight":
      keys.right.pressed = true;
      break;
  }
});

addEventListener('keyup', (event) => {
  switch (event.key) {
    case "ArrowLeft":
      keys.left.pressed = false;
      break;
    case "ArrowRight":
      keys.right.pressed = false;
      break;
  }
});
