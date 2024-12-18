// Game Constants
const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const BOOST_SPEED = 50;
const CELL_SIZE = 20;

// Game Variables
let canvas, ctx;
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let gameInterval;
let score = 0;
let highScore = 0;
let isGameOver = false;
let isPaused = false;
let particles = [];
let level = 1;
let gameMode = 'classic';
let selectedSpeed = INITIAL_SPEED;
let walls = [];

// DOM Elements
let scoreElement, highScoreElement, levelElement, finalScoreElement, finalLevelElement;

// Particle System
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.initialSize = Math.random() * 3 + 2; // Store initial size
        this.size = this.initialSize;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.alpha = 1;
        this.gravity = 0.1;
        this.friction = 0.99;
        this.life = 1; // Life parameter from 1 to 0
    }

    update() {
        this.speedX *= this.friction;
        this.speedY *= this.friction;
        this.speedY += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.02;
        this.alpha = this.life;
        this.size = Math.max(0.1, this.initialSize * this.life);
    }

    draw(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

// Initialize Game
function initGame() {
    // Initialize DOM elements
    scoreElement = document.getElementById('score');
    highScoreElement = document.getElementById('highScore');
    levelElement = document.getElementById('level');
    finalScoreElement = document.getElementById('finalScore');
    finalLevelElement = document.getElementById('finalLevel');
    canvas = document.getElementById('snakeCanvas');

    // Check if required elements exist
    if (!canvas || !scoreElement || !highScoreElement || !levelElement) {
        console.error('Required game elements not found!');
        return;
    }

    ctx = canvas.getContext('2d');
    
    // Initialize high score
    highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
    
    // Set initial game state
    resetGame();
    
    // Set up the canvas size
    resizeCanvas();
    window.addEventListener('resize', () => {
        clearTimeout(window.resizeTimeout);
        window.resizeTimeout = setTimeout(() => {
            resizeCanvas();
        }, 250); // Debounce resize events
    });
    
    // Set up event listeners
    setupEventListeners();
    
    // Update initial score display
    updateScore();
    
    // Show start modal
    showStartModal();
}

function resetGame() {
    score = 0;
    level = 1;
    direction = 'right';
    nextDirection = 'right';
    snake = [
        { x: 3 * CELL_SIZE, y: 3 * CELL_SIZE }
    ];
    isGameOver = false;
    isPaused = false;
    particles = [];
    
    initializeWalls();
    createFood();
    updateScore();
    
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    
    gameInterval = setInterval(() => {
        if (!isPaused && !isGameOver) {
            moveSnake();
            draw();
        }
    }, selectedSpeed);
}

function initializeWalls() {
    walls = [];
    // Add border walls
    for (let x = 0; x < GRID_SIZE; x++) {
        // Top and bottom walls
        walls.push({ x: x * CELL_SIZE, y: 0 });
        walls.push({ x: x * CELL_SIZE, y: (GRID_SIZE - 1) * CELL_SIZE });
    }
    for (let y = 0; y < GRID_SIZE; y++) {
        // Left and right walls
        walls.push({ x: 0, y: y * CELL_SIZE });
        walls.push({ x: (GRID_SIZE - 1) * CELL_SIZE, y: y * CELL_SIZE });
    }
}

function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);

    // Mobile controls
    document.getElementById('upBtn').addEventListener('touchstart', () => changeDirection('up'));
    document.getElementById('downBtn').addEventListener('touchstart', () => changeDirection('down'));
    document.getElementById('leftBtn').addEventListener('touchstart', () => changeDirection('left'));
    document.getElementById('rightBtn').addEventListener('touchstart', () => changeDirection('right'));
    document.getElementById('boostBtn').addEventListener('touchstart', () => setGameSpeed(BOOST_SPEED));
    document.getElementById('boostBtn').addEventListener('touchend', () => setGameSpeed(selectedSpeed));

    // Mouse controls for mobile buttons
    document.getElementById('upBtn').addEventListener('mousedown', () => changeDirection('up'));
    document.getElementById('downBtn').addEventListener('mousedown', () => changeDirection('down'));
    document.getElementById('leftBtn').addEventListener('mousedown', () => changeDirection('left'));
    document.getElementById('rightBtn').addEventListener('mousedown', () => changeDirection('right'));
    document.getElementById('boostBtn').addEventListener('mousedown', () => setGameSpeed(BOOST_SPEED));
    document.getElementById('boostBtn').addEventListener('mouseup', () => setGameSpeed(selectedSpeed));

    // Game over buttons
    document.getElementById('playAgainBtn').addEventListener('click', resetGame);
    document.getElementById('mainMenuBtn').addEventListener('click', showStartModal);

    // Mode selection
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameMode = btn.dataset.mode;
            checkStartButton();
        });
    });

    // Difficulty selection
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedSpeed = parseInt(btn.dataset.speed);
            gameSpeed = selectedSpeed;
            checkStartButton();
        });
    });

    // Start game button
    document.getElementById('startGameBtn').addEventListener('click', () => {
        if (gameMode && selectedSpeed) {
            document.getElementById('startModal').style.display = 'none';
            startGame();
        }
    });
}

function checkStartButton() {
    const startBtn = document.getElementById('startGameBtn');
    startBtn.disabled = !(gameMode && selectedSpeed);
}

function handleKeyPress(event) {
    // Prevent default browser scrolling
    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(event.code) > -1) {
        event.preventDefault();
    }

    // Don't handle keys if game is over or paused
    if (isGameOver || isPaused) {
        return;
    }

    if (event.key === 'p' || event.key === 'P') {
        togglePause();
        return;
    }

    if (event.code === 'Space') {
        setGameSpeed(event.type === 'keydown' ? BOOST_SPEED : selectedSpeed);
        return;
    }

    switch (event.key) {
        case 'ArrowUp':
            if (direction !== 'down') changeDirection('up');
            break;
        case 'ArrowDown':
            if (direction !== 'up') changeDirection('down');
            break;
        case 'ArrowLeft':
            if (direction !== 'right') changeDirection('left');
            break;
        case 'ArrowRight':
            if (direction !== 'left') changeDirection('right');
            break;
    }
}

function changeDirection(newDirection) {
    const opposites = {
        'up': 'down',
        'down': 'up',
        'left': 'right',
        'right': 'left'
    };

    if (newDirection !== opposites[direction]) {
        nextDirection = newDirection;
    }
}

function createFood() {
    let newFood;
    let attempts = 0;
    const maxAttempts = GRID_SIZE * GRID_SIZE;
    
    do {
        newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        attempts++;
        
        // If we can't find a valid position after many attempts, reset the game
        if (attempts > maxAttempts) {
            gameOver();
            return;
        }
    } while (
        snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
        walls.some(wall => wall.x === newFood.x && wall.y === newFood.y)
    );

    food = newFood;
    createFoodParticles();
}

function createFoodParticles() {
    const foodX = food.x + CELL_SIZE / 2;
    const foodY = food.y + CELL_SIZE / 2;
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle(foodX, foodY, '#00ff87'));
    }
}

function moveSnake() {
    if (isGameOver || isPaused) return;
    
    direction = nextDirection;
    const head = { ...snake[0] };

    switch (direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }

    // Check for collisions
    if (checkCollision()) {
        gameOver();
        return;
    }

    // Add new head
    snake.unshift(head);

    // Check if food is eaten
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
        }
        createFood();
        updateScore();
        
        // Level up every 100 points with speed limit
        if (score % 100 === 0) {
            level++;
            // Ensure speed doesn't go below minimum of 50ms
            selectedSpeed = Math.max(50, INITIAL_SPEED - (level - 1) * 10);
            updateScore();
        }
    } else {
        snake.pop();
    }
}

function checkCollision() {
    const head = snake[0];
    
    // Check wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        return true;
    }
    
    // Check wall obstacles collision
    for (const wall of walls) {
        if (head.x === wall.x && head.y === wall.y) {
            return true;
        }
    }
    
    // Check self collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Draw walls
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff3333';
    ctx.fillStyle = '#ff3333';
    walls.forEach(wall => {
        ctx.fillRect(wall.x, wall.y, CELL_SIZE - 2, CELL_SIZE - 2);
    });
    
    // Draw food with glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ff87';
    ctx.fillStyle = '#00ff87';
    ctx.fillRect(food.x, food.y, CELL_SIZE - 2, CELL_SIZE - 2);
    
    // Draw snake with glow effect
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Head has stronger glow
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#fff';
        } else {
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#00ff87';
        }
        ctx.fillRect(segment.x, segment.y, CELL_SIZE - 2, CELL_SIZE - 2);
    });
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Update and draw particles
    particles = particles.filter(particle => {
        if (!particle.isDead()) {
            particle.update();
            particle.draw(ctx);
            return true;
        }
        return false;
    });
    
    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Level: ${level}`, 10, 60);
    
    // Draw pause indicator if game is paused
    if (isPaused && !isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    const cellSize = canvas.width / GRID_SIZE;
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
    }
}

function updateScore() {
    // Update main game scores
    if (scoreElement) scoreElement.textContent = score;
    if (highScoreElement) highScoreElement.textContent = highScore;
    if (levelElement) levelElement.textContent = level;

    // Update final scores in game over modal
    if (finalScoreElement) finalScoreElement.textContent = score;
    if (finalLevelElement) finalLevelElement.textContent = level;
}

function gameOver() {
    isGameOver = true;
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    
    // Update high score
    if (score > highScore) {
        const oldHighScore = highScore;
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        
        // Animate high score change
        let current = oldHighScore;
        const increment = Math.ceil((highScore - oldHighScore) / 20);
        const animateScore = () => {
            current = Math.min(current + increment, highScore);
            if (highScoreElement) highScoreElement.textContent = current;
            if (current < highScore) {
                requestAnimationFrame(animateScore);
            }
        };
        animateScore();
    }
    
    updateScore();
    
    // Create explosion effect
    const head = snake[0];
    createExplosionParticles(head.x + CELL_SIZE / 2, head.y + CELL_SIZE / 2);
    
    // Show game over modal with fade-in animation
    const modal = document.getElementById('gameOverModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transition = 'opacity 0.5s';
        }, 0);
    }
}

function createExplosionParticles(x, y) {
    const colors = ['#00ff87', '#fff', '#60efff'];
    for (let i = 0; i < 30; i++) {
        particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]));
    }
}

function startGame() {
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    
    document.getElementById('startModal').style.display = 'none';
    resetGame();
    
    gameInterval = setInterval(() => {
        if (!isPaused && !isGameOver) {
            moveSnake();
            draw();
        }
    }, selectedSpeed);
}

function togglePause() {
    if (isGameOver) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        // Stop game interval
        if (gameInterval) {
            clearInterval(gameInterval);
            gameInterval = null;
        }
        
        // Show pause overlay with animation
        const overlay = document.createElement('div');
        overlay.id = 'pauseOverlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        
        const pauseText = document.createElement('div');
        pauseText.textContent = 'PAUSED';
        pauseText.style.cssText = `
            color: white;
            font-size: 40px;
            font-weight: bold;
            text-shadow: 0 0 10px #00ff87;
        `;
        
        overlay.appendChild(pauseText);
        canvas.parentElement.appendChild(overlay);
        
        // Trigger animation
        setTimeout(() => overlay.style.opacity = '1', 0);
    } else {
        // Remove pause overlay
        const overlay = document.getElementById('pauseOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }
        
        // Restart game interval
        startGame();
    }
}

function setGameSpeed(speed) {
    if (!isGameOver && !isPaused) {
        clearInterval(gameInterval);
        gameInterval = setInterval(() => {
            if (!isPaused && !isGameOver) {
                moveSnake();
                draw();
            }
        }, speed);
    }
}

function resizeCanvas() {
    const gameArea = document.querySelector('.game-area');
    if (!gameArea) return;

    // Get the game area dimensions
    const gameAreaRect = gameArea.getBoundingClientRect();
    
    // Calculate the maximum size that maintains the aspect ratio
    const size = Math.min(
        gameAreaRect.width,
        gameAreaRect.height,
        Math.min(window.innerWidth, window.innerHeight) * 0.8
    );
    
    // Set canvas size
    canvas.width = size;
    canvas.height = size;
    
    // Adjust cell size based on new canvas size
    CELL_SIZE = size / GRID_SIZE;
    
    // Redraw immediately to prevent flicker
    draw();
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        initGame();
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});
