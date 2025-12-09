class FourInARowGame {
    constructor() {
        this.ROWS = 6;
        this.COLS = 7;
        this.board = [];
        this.currentPlayer = 'red'; // 'red' or 'yellow'
        this.gameOver = false;
        this.moveHistory = [];
        this.winningCells = [];
        
        // Scores
        this.scores = {
            red: 0,
            yellow: 0,
            draws: 0
        };
        
        // Load saved state
        this.loadState();
        
        // Initialize the board
        this.createBoard();
        this.renderBoard();
        this.updateDisplay();
        this.updateScoreboard();
        this.setupColumnHover();
    }
    
    loadState() {
        try {
            // Load scores
            const savedScores = localStorage.getItem('fourInARow-scores');
            if (savedScores) {
                this.scores = JSON.parse(savedScores);
            }
            
            // Load game state
            const savedGame = localStorage.getItem('fourInARow-game');
            if (savedGame) {
                const state = JSON.parse(savedGame);
                this.board = state.board;
                this.currentPlayer = state.currentPlayer;
                this.gameOver = state.gameOver;
                this.moveHistory = state.moveHistory || [];
                this.winningCells = state.winningCells || [];
            } else {
                this.initializeBoard();
            }
        } catch (e) {
            console.error('Failed to load state:', e);
            this.initializeBoard();
        }
    }
    
    saveState() {
        try {
            // Save scores
            localStorage.setItem('fourInARow-scores', JSON.stringify(this.scores));
            
            // Save game state
            const state = {
                board: this.board,
                currentPlayer: this.currentPlayer,
                gameOver: this.gameOver,
                moveHistory: this.moveHistory,
                winningCells: this.winningCells
            };
            localStorage.setItem('fourInARow-game', JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    }
    
    initializeBoard() {
        this.board = [];
        for (let row = 0; row < this.ROWS; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.COLS; col++) {
                this.board[row][col] = null;
            }
        }
        this.moveHistory = [];
        this.winningCells = [];
        this.gameOver = false;
        this.currentPlayer = 'red';
    }
    
    createBoard() {
        const boardElement = document.getElementById('gameBoard');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => this.handleCellClick(col));
                boardElement.appendChild(cell);
            }
        }
    }
    
    setupColumnHover() {
        const indicators = document.querySelectorAll('.column-indicator');
        const boardElement = document.getElementById('gameBoard');
        
        indicators.forEach((indicator, col) => {
            indicator.addEventListener('click', () => this.handleCellClick(col));
        });
        
        // Show indicator on column hover
        boardElement.addEventListener('mouseover', (e) => {
            if (this.gameOver) return;
            const cell = e.target.closest('.cell');
            if (cell) {
                const col = parseInt(cell.dataset.col);
                this.highlightColumn(col);
            }
        });
        
        boardElement.addEventListener('mouseout', () => {
            this.clearColumnHighlights();
        });
    }
    
    highlightColumn(col) {
        const indicators = document.querySelectorAll('.column-indicator');
        indicators.forEach((ind, i) => {
            ind.classList.remove('active', 'red-hover', 'yellow-hover');
            if (i === col && this.getAvailableRow(col) !== -1) {
                ind.classList.add('active');
                ind.classList.add(this.currentPlayer === 'red' ? 'red-hover' : 'yellow-hover');
            }
        });
    }
    
    clearColumnHighlights() {
        const indicators = document.querySelectorAll('.column-indicator');
        indicators.forEach(ind => {
            ind.classList.remove('active', 'red-hover', 'yellow-hover');
        });
    }
    
    handleCellClick(col) {
        if (this.gameOver) return;
        
        const row = this.getAvailableRow(col);
        if (row === -1) return; // Column is full
        
        this.makeMove(row, col);
    }
    
    getAvailableRow(col) {
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (this.board[row][col] === null) {
                return row;
            }
        }
        return -1; // Column is full
    }
    
    makeMove(row, col) {
        // Place the piece
        this.board[row][col] = this.currentPlayer;
        this.moveHistory.push({ row, col, player: this.currentPlayer });
        
        // Render with animation
        this.renderBoard();
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('dropping');
            setTimeout(() => cell.classList.remove('dropping'), 400);
        }
        
        // Check for win
        const winResult = this.checkWin(row, col);
        if (winResult) {
            this.gameOver = true;
            this.winningCells = winResult;
            this.scores[this.currentPlayer]++;
            this.saveState();
            this.highlightWinningCells();
            this.updateScoreboard();
            setTimeout(() => this.showWinModal(this.currentPlayer), 600);
            return;
        }
        
        // Check for draw
        if (this.isBoardFull()) {
            this.gameOver = true;
            this.scores.draws++;
            this.saveState();
            this.updateScoreboard();
            setTimeout(() => this.showWinModal('draw'), 600);
            return;
        }
        
        // Switch player
        this.currentPlayer = this.currentPlayer === 'red' ? 'yellow' : 'red';
        this.updateDisplay();
        this.saveState();
    }
    
    checkWin(row, col) {
        const player = this.board[row][col];
        const directions = [
            { dr: 0, dc: 1 },  // Horizontal
            { dr: 1, dc: 0 },  // Vertical
            { dr: 1, dc: 1 },  // Diagonal down-right
            { dr: 1, dc: -1 }  // Diagonal down-left
        ];
        
        for (const { dr, dc } of directions) {
            const cells = this.countInDirection(row, col, dr, dc, player);
            if (cells.length >= 4) {
                return cells;
            }
        }
        
        return null;
    }
    
    countInDirection(row, col, dr, dc, player) {
        const cells = [{ row, col }];
        
        // Count in positive direction
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && this.board[r][c] === player) {
            cells.push({ row: r, col: c });
            r += dr;
            c += dc;
        }
        
        // Count in negative direction
        r = row - dr;
        c = col - dc;
        while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && this.board[r][c] === player) {
            cells.push({ row: r, col: c });
            r -= dr;
            c -= dc;
        }
        
        return cells;
    }
    
    isBoardFull() {
        for (let col = 0; col < this.COLS; col++) {
            if (this.board[0][col] === null) {
                return false;
            }
        }
        return true;
    }
    
    highlightWinningCells() {
        this.winningCells.forEach(({ row, col }) => {
            const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('winning');
            }
        });
    }
    
    renderBoard() {
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    cell.classList.remove('red', 'yellow', 'winning');
                    if (this.board[row][col] === 'red') {
                        cell.classList.add('red');
                    } else if (this.board[row][col] === 'yellow') {
                        cell.classList.add('yellow');
                    }
                }
            }
        }
        
        // Re-highlight winning cells if game is over
        if (this.gameOver && this.winningCells.length > 0) {
            this.highlightWinningCells();
        }
    }
    
    updateDisplay() {
        const statusElement = document.getElementById('currentPlayer');
        const emoji = this.currentPlayer === 'red' ? '🔴' : '🟡';
        const name = this.currentPlayer === 'red' ? 'Red' : 'Yellow';
        
        statusElement.innerHTML = `
            <span class="turn-indicator ${this.currentPlayer}-turn">${emoji}</span>
            <span>${name}'s Turn</span>
        `;
    }
    
    updateScoreboard() {
        document.getElementById('redScore').textContent = this.scores.red;
        document.getElementById('yellowScore').textContent = this.scores.yellow;
        document.getElementById('drawScore').textContent = this.scores.draws;
    }
    
    showWinModal(result) {
        const modal = document.getElementById('winModal');
        const message = document.getElementById('winMessage');
        const subtext = document.getElementById('winSubtext');
        
        message.classList.remove('red-wins', 'yellow-wins', 'draw');
        
        if (result === 'draw') {
            message.textContent = "🤝 It's a Draw!";
            message.classList.add('draw');
            subtext.textContent = "The board is full with no winner.";
        } else {
            const emoji = result === 'red' ? '🔴' : '🟡';
            const name = result === 'red' ? 'Red' : 'Yellow';
            message.textContent = `${emoji} ${name} Wins!`;
            message.classList.add(result === 'red' ? 'red-wins' : 'yellow-wins');
            subtext.textContent = `Congratulations! ${name} connected four in a row!`;
        }
        
        modal.classList.add('show');
    }
    
    closeModal() {
        const modal = document.getElementById('winModal');
        modal.classList.remove('show');
    }
    
    startNewGame() {
        this.closeModal();
        this.resetGame();
    }
    
    resetGame() {
        this.initializeBoard();
        this.renderBoard();
        this.updateDisplay();
        this.saveState();
    }
    
    undoMove() {
        if (this.moveHistory.length === 0 || this.gameOver) return;
        
        const lastMove = this.moveHistory.pop();
        this.board[lastMove.row][lastMove.col] = null;
        this.currentPlayer = lastMove.player;
        
        this.renderBoard();
        this.updateDisplay();
        this.saveState();
    }
    
    clearScores() {
        if (confirm('Are you sure you want to clear all scores?')) {
            this.scores = { red: 0, yellow: 0, draws: 0 };
            this.updateScoreboard();
            this.saveState();
        }
    }
}

// Initialize game when page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new FourInARowGame();
});
