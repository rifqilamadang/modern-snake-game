import Game, { GRID_WIDTH, GRID_HEIGHT, CELL_SIZE } from './game.js';
import UI from './ui.js';

let game, ui;

function getCanvas() {
    return document.getElementById('snakeCanvas');
}

function resizeCanvas() {
    const canvas = getCanvas();
    if (!canvas) return;

    // Calculate available space
    const maxWidth = window.innerWidth - 40;
    const maxHeight = window.innerHeight - 40;
    
    // Set canvas dimensions
    canvas.width = GRID_WIDTH * CELL_SIZE;  // 890px
    canvas.height = GRID_HEIGHT * CELL_SIZE; // 402px
    
    // Calculate scale to fit screen while maintaining aspect ratio
    const scaleX = maxWidth / canvas.width;
    const scaleY = maxHeight / canvas.height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond original size
    
    canvas.style.transform = `scale(${scale})`;
    canvas.style.transformOrigin = 'center center';

    // If game exists, redraw it
    if (game) {
        game.draw();
    }
}

function init() {
    const canvas = getCanvas();
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    // Initialize game components
    resizeCanvas();
    game = new Game(canvas);
    ui = new UI(game);
}

// Handle window resize with debouncing
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 250);
});

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', init);
