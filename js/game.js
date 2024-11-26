import Particle from './particle.js';

// Constants
const CELL_SIZE = 20;
const GRID_WIDTH = 44; // 890/20 ≈ 44 cells wide
const GRID_HEIGHT = 20; // 402/20 ≈ 20 cells high

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Set canvas size to match new dimensions
        this.canvas.width = GRID_WIDTH * CELL_SIZE; 
        this.canvas.height = GRID_HEIGHT * CELL_SIZE; 
        
        this.particles = [];
        this.speedBoost = false;
        this.reset();
        this.noWalls = false; 
    }

    reset() {
        this.snake = [{ x: 3 * CELL_SIZE, y: 3 * CELL_SIZE }];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.level = 1;
        this.speed = 100;
        this.isGameOver = false;
        this.isPaused = false;
        this.gameMode = 'classic';
        this.particles = [];
        
        // Regenerate food based on current wall mode
        this.generateFood();
    }

    generateFood() {
        let newFood;
        const wallThickness = 20;
        const padding = this.noWalls ? 0 : wallThickness;
        
        do {
            // Calculate available space considering wall mode
            const availableWidth = GRID_WIDTH - (this.noWalls ? 0 : 2);
            const availableHeight = GRID_HEIGHT - (this.noWalls ? 0 : 2);
            
            newFood = {
                x: Math.floor(Math.random() * availableWidth) * CELL_SIZE + padding,
                y: Math.floor(Math.random() * availableHeight) * CELL_SIZE + padding
            };
        } while (
            this.snake.some(segment => 
                segment.x === newFood.x && 
                segment.y === newFood.y
            )
        );
        
        this.food = newFood;
        this.createFoodParticles();
    }

    createFoodParticles() {
        const foodX = this.food.x + CELL_SIZE / 2;
        const foodY = this.food.y + CELL_SIZE / 2;
        for (let i = 0; i < 5; i++) {
            this.particles.push(new Particle(foodX, foodY, '#00ff87'));
        }
    }

    createExplosionParticles(x, y) {
        const colors = ['#00ff87', '#fff', '#60efff'];
        for (let i = 0; i < 20; i++) {
            this.particles.push(
                new Particle(x, y, colors[Math.floor(Math.random() * colors.length)])
            );
        }
    }

    moveSnake() {
        if (this.isPaused || this.isGameOver) return;

        const head = { ...this.snake[0] };
        
        // Update direction
        this.direction = this.nextDirection;
        
        // Move head
        switch (this.direction) {
            case 'up': head.y -= CELL_SIZE; break;
            case 'down': head.y += CELL_SIZE; break;
            case 'left': head.x -= CELL_SIZE; break;
            case 'right': head.x += CELL_SIZE; break;
        }

        const wallThickness = 20;
        
        // Check wall collision
        if (!this.noWalls) {
            if (head.x < wallThickness || 
                head.x >= this.canvas.width - wallThickness || 
                head.y < wallThickness || 
                head.y >= this.canvas.height - wallThickness) {
                return this.gameOver();
            }
        } else {
            // Wrap around if no walls
            if (head.x < 0) head.x = this.canvas.width - CELL_SIZE;
            if (head.x >= this.canvas.width) head.x = 0;
            if (head.y < 0) head.y = this.canvas.height - CELL_SIZE;
            if (head.y >= this.canvas.height) head.y = 0;
        }

        // Check self collision
        if (this.checkSelfCollision(head)) {
            return this.gameOver();
        }

        this.snake.unshift(head);

        // Check if snake ate food
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            if (this.score % 50 === 0) {
                this.level++;
                this.speed = Math.max(50, this.speed - 10);
            }
            this.generateFood();
            
            // Create particles at food location
            for (let i = 0; i < 10; i++) {
                this.particles.push(new Particle(this.food.x + CELL_SIZE/2, this.food.y + CELL_SIZE/2));
            }
        } else {
            this.snake.pop();
        }
    }

    checkWallCollision(head) {
        return head.x < 0 || head.x >= GRID_WIDTH * CELL_SIZE || 
               head.y < 0 || head.y >= GRID_HEIGHT * CELL_SIZE;
    }

    checkSelfCollision(head) {
        // Skip the head (index 0) when checking self collision
        return this.snake.slice(1).some(segment => 
            segment.x === head.x && segment.y === head.y
        );
    }

    gameOver() {
        this.isGameOver = true;
        const head = this.snake[0];
        
        // Create explosion effect at snake's head
        this.createExplosionParticles(head.x + CELL_SIZE / 2, head.y + CELL_SIZE / 2);
        
        // Stop any ongoing movement
        this.direction = null;
        this.nextDirection = null;
        this.speedBoost = false;
        
        return true;
    }

    getCurrentSpeed() {
        return this.speedBoost ? Math.floor(this.speed * 0.5) : this.speed;
    }

    drawGrid() {
        // Draw background
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawGrid();
        
        // Draw walls if enabled
        if (!this.noWalls) {
            // Save current context state
            this.ctx.save();
            
            const wallThickness = 20;
            
            // Draw brick pattern
            this.ctx.strokeStyle = '#8b0000'; // Dark red
            this.ctx.lineWidth = 2;
            
            // Draw horizontal bricks
            const brickWidth = 40;
            const brickHeight = wallThickness;
            
            // Top wall bricks
            for (let x = 0; x < this.canvas.width; x += brickWidth) {
                this.ctx.fillStyle = '#cc0000';
                this.ctx.fillRect(x, 0, brickWidth - 2, wallThickness);
                this.ctx.strokeRect(x, 0, brickWidth - 2, wallThickness);
            }
            
            // Bottom wall bricks
            for (let x = 0; x < this.canvas.width; x += brickWidth) {
                this.ctx.fillStyle = '#cc0000';
                this.ctx.fillRect(x, this.canvas.height - wallThickness, brickWidth - 2, wallThickness);
                this.ctx.strokeRect(x, this.canvas.height - wallThickness, brickWidth - 2, wallThickness);
            }
            
            // Left wall bricks
            for (let y = 0; y < this.canvas.height; y += brickHeight) {
                this.ctx.fillStyle = '#cc0000';
                this.ctx.fillRect(0, y, wallThickness, brickHeight - 2);
                this.ctx.strokeRect(0, y, wallThickness, brickHeight - 2);
            }
            
            // Right wall bricks
            for (let y = 0; y < this.canvas.height; y += brickHeight) {
                this.ctx.fillStyle = '#cc0000';
                this.ctx.fillRect(this.canvas.width - wallThickness, y, wallThickness, brickHeight - 2);
                this.ctx.strokeRect(this.canvas.width - wallThickness, y, wallThickness, brickHeight - 2);
            }
            
            // Add glow effect
            this.ctx.shadowColor = '#ff0000';
            this.ctx.shadowBlur = 15;
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Restore context state
            this.ctx.restore();
        }

        // Draw snake with gradient effect
        this.snake.forEach((segment, index) => {
            const isHead = index === 0;
            
            if (isHead) {
                // Head with neon effect
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#4dff4d';  // Green glow
                this.ctx.fillStyle = '#33ff33';    // Bright green head
            } else {
                // Body segments with gradient
                const brightness = 1 - (index / this.snake.length) * 0.6;
                this.ctx.fillStyle = `hsl(120, 100%, ${brightness * 40}%)`;
                this.ctx.shadowBlur = 0;
            }

            // Draw rounded rectangle for each segment
            const radius = 4;  // Radius for rounded corners
            const x = segment.x + 1;
            const y = segment.y + 1;
            const width = CELL_SIZE - 2;
            const height = CELL_SIZE - 2;

            this.ctx.beginPath();
            this.ctx.moveTo(x + radius, y);
            this.ctx.lineTo(x + width - radius, y);
            this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            this.ctx.lineTo(x + width, y + height - radius);
            this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            this.ctx.lineTo(x + radius, y + height);
            this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            this.ctx.lineTo(x, y + radius);
            this.ctx.quadraticCurveTo(x, y, x + radius, y);
            this.ctx.closePath();
            this.ctx.fill();
        });

        // Reset shadow effect
        this.ctx.shadowBlur = 0;

        // Draw food with glow effect
        this.ctx.shadowColor = '#e74c3c';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x + CELL_SIZE / 2,
            this.food.y + CELL_SIZE / 2,
            CELL_SIZE / 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Update and draw particles
        this.particles = this.particles.filter(particle => {
            particle.update();
            particle.draw(this.ctx);
            return !particle.isDead();
        });

        // Draw pause overlay
        if (this.isPaused && !this.isGameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    setDirection(newDirection) {
        const opposites = {
            up: 'down',
            down: 'up',
            left: 'right',
            right: 'left'
        };
        
        if (this.direction !== opposites[newDirection]) {
            this.nextDirection = newDirection;
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
    }

    toggleNoWalls() {
        this.noWalls = !this.noWalls;
    }
}

export { CELL_SIZE, GRID_WIDTH, GRID_HEIGHT };
