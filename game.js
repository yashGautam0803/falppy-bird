const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');

// Set canvas size
canvas.width = 400;
canvas.height = 600;

// Game constants
const GRAVITY = 0.5;
const JUMP_FORCE = -10;
const PIPE_SPEED = 2;
const PIPE_GAP = 150;
const PIPE_SPAWN_RATE = 1500;
const GROUND_HEIGHT = 50;

// Game variables
let bird = {
    x: 50,
    y: canvas.height / 2,
    width: 34,
    height: 24,
    velocity: 0,
    wingAngle: 0,
    rotation: 0
};

let pipes = [];
let clouds = [];
let score = 0;
let highScore = 0;
let gameRunning = true;
let lastPipeSpawn = 0;

// Create initial clouds
for (let i = 0; i < 3; i++) {
    clouds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height / 2),
        width: 60 + Math.random() * 40,
        height: 30 + Math.random() * 20,
        speed: 0.2 + Math.random() * 0.3
    });
}

// Touch controls for mobile
let touchStartY = 0;
let touchEndY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartY = e.touches[0].clientY;
    
    if (!gameRunning) {
        resetGame();
    } else {
        bird.velocity = JUMP_FORCE;
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchEndY = e.changedTouches[0].clientY;
});

// Keyboard controls for PC
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (!gameRunning) {
            resetGame();
        }
        bird.velocity = JUMP_FORCE;
    }
});

// Game functions
function resetGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.rotation = 0;
    pipes = [];
    score = 0;
    gameRunning = true;
    gameOverElement.classList.add('hidden');
    scoreElement.textContent = `Score: ${score} | High Score: ${highScore}`;
}

function updateHighScore(newScore) {
    if (newScore > highScore) {
        highScore = newScore;
        localStorage.setItem('highScore', highScore);
    }
}

function createPipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - PIPE_GAP - minHeight - GROUND_HEIGHT;
    const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    
    pipes.push({
        x: canvas.width,
        y: 0,
        width: 60,
        height: height,
        passed: false
    });
    
    pipes.push({
        x: canvas.width,
        y: height + PIPE_GAP,
        width: 60,
        height: canvas.height - height - PIPE_GAP - GROUND_HEIGHT
    });
}

function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width/2, bird.y + bird.height/2);
    
    // Calculate rotation based on velocity
    bird.rotation = Math.min(Math.max(bird.velocity * 0.1, -0.5), 0.5);
    ctx.rotate(bird.rotation);

    // Body
    const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, bird.width/2);
    bodyGradient.addColorStop(0, '#FFD700');
    bodyGradient.addColorStop(1, '#FFA500');
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.width/2, bird.height/2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing animation
    bird.wingAngle += 0.2;
    const wingAngle = Math.sin(bird.wingAngle) * 0.5;
    ctx.rotate(wingAngle);
    
    // Wing
    const wingGradient = ctx.createLinearGradient(-bird.width/2, 0, -bird.width/2, -bird.height/2);
    wingGradient.addColorStop(0, '#FFA500');
    wingGradient.addColorStop(1, '#FF8C00');
    ctx.fillStyle = wingGradient;
    ctx.beginPath();
    ctx.moveTo(-bird.width/2, 0);
    ctx.quadraticCurveTo(-bird.width, -bird.height/2, -bird.width/2, -bird.height/2);
    ctx.fill();

    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(bird.width/4, -bird.height/4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(bird.width/4, -bird.height/4, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.moveTo(bird.width/2, 0);
    ctx.lineTo(bird.width/2 + 10, -5);
    ctx.lineTo(bird.width/2 + 10, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawPipe(pipe) {
    // Pipe body with gradient
    const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
    pipeGradient.addColorStop(0, '#2E8B57');
    pipeGradient.addColorStop(0.5, '#3CB371');
    pipeGradient.addColorStop(1, '#2E8B57');
    ctx.fillStyle = pipeGradient;
    ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);

    // Pipe edge with shadow
    ctx.fillStyle = '#228B22';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillRect(pipe.x, pipe.y, pipe.width, 15);
    ctx.fillRect(pipe.x, pipe.y + pipe.height - 15, pipe.width, 15);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function drawGround() {
    // Ground with gradient and texture
    const groundGradient = ctx.createLinearGradient(0, canvas.height - GROUND_HEIGHT, 0, canvas.height);
    groundGradient.addColorStop(0, '#8B4513');
    groundGradient.addColorStop(1, '#A0522D');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

    // Ground texture
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.fillRect(i, canvas.height - GROUND_HEIGHT, 10, GROUND_HEIGHT);
    }
}

function drawCloud(cloud) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.width/3, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.width/3, cloud.y - cloud.height/4, cloud.width/4, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.width/2, cloud.y, cloud.width/3, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.width/1.5, cloud.y - cloud.height/4, cloud.width/4, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function update() {
    if (!gameRunning) return;

    // Update bird
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    // Update clouds
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width;
            cloud.y = Math.random() * (canvas.height / 2);
        }
    });

    // Check for collisions with top and bottom
    if (bird.y <= 0 || bird.y + bird.height >= canvas.height - GROUND_HEIGHT) {
        gameOver();
    }

    // Spawn new pipes
    const now = Date.now();
    if (now - lastPipeSpawn > PIPE_SPAWN_RATE) {
        createPipe();
        lastPipeSpawn = now;
    }

    // Update pipes
    pipes.forEach((pipe, index) => {
        pipe.x -= PIPE_SPEED;

        // Check for collisions
        if (bird.x + bird.width > pipe.x &&
            bird.x < pipe.x + pipe.width &&
            bird.y < pipe.y + pipe.height &&
            bird.y + bird.height > pipe.y) {
            gameOver();
        }

        // Check if pipe is passed
        if (!pipe.passed && pipe.x + pipe.width < bird.x) {
            pipe.passed = true;
            if (index % 2 === 0) { // Only count score for top pipe
                score++;
                scoreElement.textContent = `Score: ${score} | High Score: ${highScore}`;
            }
        }

        // Remove pipes that are off screen
        if (pipe.x + pipe.width < 0) {
            pipes.splice(index, 1);
        }
    });
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(0.5, '#B0E0E6');
    skyGradient.addColorStop(1, '#E0F7FF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clouds
    clouds.forEach(cloud => drawCloud(cloud));

    // Draw pipes
    pipes.forEach(pipe => drawPipe(pipe));

    // Draw ground
    drawGround();

    // Draw bird
    drawBird();
}

function gameOver() {
    gameRunning = false;
    updateHighScore(score);
    gameOverElement.classList.remove('hidden');
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop(); 