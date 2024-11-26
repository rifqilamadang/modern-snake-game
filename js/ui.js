class UI {
    constructor(game) {
        this.game = game;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.gameLoop = null;
        this.setupDOMElements();
        this.setupEventListeners();
        this.showStartModal();
    }

    setupDOMElements() {
        // Score elements
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.levelElement = document.getElementById('level');
        this.finalScoreElement = document.getElementById('finalScore');
        this.finalLevelElement = document.getElementById('finalLevel');

        // Modal elements
        this.startModal = document.getElementById('startModal');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.startGameBtn = document.getElementById('startGameBtn');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.mainMenuBtn = document.getElementById('mainMenuBtn');

        // Game mode elements
        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.difficultyButtons = document.querySelectorAll('.difficulty-btn');
        this.noWallsToggle = document.getElementById('noWallsToggle');
        this.wallToggle = document.getElementById('wallToggle');

        // Initialize scores
        this.updateScore();
    }

    setupEventListeners() {
        // Game mode selection
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.game.gameMode = btn.dataset.mode;
                this.checkStartButton();
            });
        });

        // Difficulty selection
        this.difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.difficultyButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.game.speed = parseInt(btn.dataset.speed);
                this.checkStartButton();
            });
        });

        // Wall toggle in controls info
        if (this.wallToggle) {
            this.wallToggle.addEventListener('change', () => {
                // Sync both toggles
                if (this.noWallsToggle) {
                    this.noWallsToggle.checked = this.wallToggle.checked;
                }
                this.game.noWalls = this.wallToggle.checked;
                
                // Only reset if game is active
                if (!this.game.isGameOver && !this.game.isPaused) {
                    const currentScore = this.game.score;
                    const currentSnake = [...this.game.snake];
                    const currentDirection = this.game.direction;
                    const currentNextDirection = this.game.nextDirection;
                    
                    this.game.reset();
                    
                    // Restore game state
                    this.game.score = currentScore;
                    this.game.snake = currentSnake;
                    this.game.direction = currentDirection;
                    this.game.nextDirection = currentNextDirection;
                    this.game.noWalls = this.wallToggle.checked;
                    
                    this.startGameLoop();
                }
            });
        }

        // Wall toggle in start modal
        if (this.noWallsToggle) {
            this.noWallsToggle.addEventListener('change', () => {
                // Sync both toggles
                if (this.wallToggle) {
                    this.wallToggle.checked = this.noWallsToggle.checked;
                }
                this.game.noWalls = this.noWallsToggle.checked;
                
                // Only reset if game is active
                if (!this.game.isGameOver && !this.game.isPaused) {
                    const currentScore = this.game.score;
                    const currentSnake = [...this.game.snake];
                    const currentDirection = this.game.direction;
                    const currentNextDirection = this.game.nextDirection;
                    
                    this.game.reset();
                    
                    // Restore game state
                    this.game.score = currentScore;
                    this.game.snake = currentSnake;
                    this.game.direction = currentDirection;
                    this.game.nextDirection = currentNextDirection;
                    this.game.noWalls = this.noWallsToggle.checked;
                    
                    this.startGameLoop();
                }
            });
        }

        // Game buttons
        this.startGameBtn.addEventListener('click', () => {
            this.hideStartModal();
            this.game.reset();
            this.startGameLoop();
        });

        this.playAgainBtn.addEventListener('click', () => {
            this.restartGame();
        });

        this.mainMenuBtn.addEventListener('click', () => {
            this.showStartModal();
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.game.isGameOver) return;

            switch(e.key.toLowerCase()) {
                case 'arrowup':
                case 'w':
                    e.preventDefault();
                    if (this.game.direction !== 'down') {
                        this.game.nextDirection = 'up';
                    }
                    break;
                case 'arrowdown':
                case 's':
                    e.preventDefault();
                    if (this.game.direction !== 'up') {
                        this.game.nextDirection = 'down';
                    }
                    break;
                case 'arrowleft':
                case 'a':
                    e.preventDefault();
                    if (this.game.direction !== 'right') {
                        this.game.nextDirection = 'left';
                    }
                    break;
                case 'arrowright':
                case 'd':
                    e.preventDefault();
                    if (this.game.direction !== 'left') {
                        this.game.nextDirection = 'right';
                    }
                    break;
                case 'p':
                    e.preventDefault();
                    this.game.togglePause();
                    break;
                case ' ':
                    e.preventDefault();
                    if (!this.game.isGameOver && !this.game.isPaused) {
                        this.game.speedBoost = true;
                    }
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                this.game.speedBoost = false;
            }
        });

        // Mobile controls
        const mobileControls = {
            'upBtn': 'up',
            'downBtn': 'down',
            'leftBtn': 'left',
            'rightBtn': 'right'
        };

        Object.entries(mobileControls).forEach(([btnId, direction]) => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (!this.game.isGameOver) {
                        if ((direction === 'up' && this.game.direction !== 'down') ||
                            (direction === 'down' && this.game.direction !== 'up') ||
                            (direction === 'left' && this.game.direction !== 'right') ||
                            (direction === 'right' && this.game.direction !== 'left')) {
                            this.game.nextDirection = direction;
                        }
                    }
                });
            }
        });

        // Boost button for mobile
        const boostBtn = document.getElementById('boostBtn');
        if (boostBtn) {
            boostBtn.addEventListener('touchstart', () => {
                if (!this.game.isGameOver && !this.game.isPaused) {
                    this.game.speedBoost = true;
                }
            });
            boostBtn.addEventListener('touchend', () => {
                this.game.speedBoost = false;
            });
        }
    }

    startGameLoop() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }

        const loop = () => {
            if (!this.game.isPaused && !this.game.isGameOver) {
                this.game.moveSnake();
                if (this.game.isGameOver) {
                    this.showGameOver();
                }
            }
            this.game.draw();
            this.updateScore();

            if (!this.game.isGameOver) {
                setTimeout(() => {
                    this.gameLoop = requestAnimationFrame(loop);
                }, this.game.getCurrentSpeed());
            }
        };

        this.gameLoop = requestAnimationFrame(loop);
    }

    checkStartButton() {
        const modeSelected = document.querySelector('.mode-btn.active');
        const difficultySelected = document.querySelector('.difficulty-btn.active');
        this.startGameBtn.disabled = !(modeSelected && difficultySelected);
    }

    updateScore() {
        if (this.scoreElement) this.scoreElement.textContent = this.game.score;
        if (this.highScoreElement) this.highScoreElement.textContent = this.highScore;
        if (this.levelElement) this.levelElement.textContent = this.game.level;
        if (this.finalScoreElement) this.finalScoreElement.textContent = this.game.score;
        if (this.finalLevelElement) this.finalLevelElement.textContent = this.game.level;

        if (this.game.score > this.highScore) {
            this.highScore = this.game.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            if (this.highScoreElement) {
                this.highScoreElement.textContent = this.highScore;
            }
        }
    }

    showGameOver() {
        // Update final scores
        this.updateScore();
        if (this.finalScoreElement) {
            this.finalScoreElement.textContent = this.game.score;
        }
        if (this.finalLevelElement) {
            this.finalLevelElement.textContent = Math.floor(this.game.score / 100) + 1;
        }
        
        // Update high score if needed
        if (this.game.score > this.highScore) {
            this.highScore = this.game.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            if (this.highScoreElement) {
                this.highScoreElement.textContent = this.highScore;
            }
        }

        // Hide start modal if visible
        this.hideStartModal();

        // Show game over modal
        if (this.gameOverModal) {
            this.gameOverModal.classList.add('active');
            this.gameOverModal.style.display = 'flex';
        }

        // Clear any ongoing game loop
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
    }

    hideGameOver() {
        if (this.gameOverModal) {
            this.gameOverModal.classList.remove('active');
            this.gameOverModal.style.display = 'none';
        }
    }

    showStartModal() {
        if (this.startModal) {
            this.startModal.classList.add('active');
            this.startModal.style.display = 'flex';
            
            // Reset selections
            this.modeButtons.forEach(btn => btn.classList.remove('active'));
            this.difficultyButtons.forEach(btn => btn.classList.remove('active'));
            
            // Set wall mode to match game state for both toggles
            if (this.noWallsToggle) {
                this.noWallsToggle.checked = this.game.noWalls;
            }
            if (this.wallToggle) {
                this.wallToggle.checked = this.game.noWalls;
            }
            
            // Set default selections
            const defaultMode = document.querySelector('.mode-btn[data-mode="classic"]');
            const defaultSpeed = document.querySelector('.difficulty-btn[data-speed="100"]');
            
            if (defaultMode) defaultMode.classList.add('active');
            if (defaultSpeed) defaultSpeed.classList.add('active');
            
            // Sync game settings with UI state
            this.game.gameMode = 'classic';
            this.game.speed = 100;
            
            // Keep the current no walls setting
            if (this.noWallsToggle) {
                this.game.noWalls = this.noWallsToggle.checked;
            }
            
            this.checkStartButton();
        }
    }

    hideStartModal() {
        if (this.startModal) {
            this.startModal.classList.remove('active');
            this.startModal.style.display = 'none';
        }
    }

    restartGame() {
        // Keep the current no walls setting when restarting
        const currentNoWalls = this.game.noWalls;
        
        this.hideGameOver();
        this.game.reset();
        
        // Restore no walls setting to both toggles
        this.game.noWalls = currentNoWalls;
        if (this.noWallsToggle) {
            this.noWallsToggle.checked = currentNoWalls;
        }
        if (this.wallToggle) {
            this.wallToggle.checked = currentNoWalls;
        }
        
        this.startGameLoop();
    }
}

export default UI;
