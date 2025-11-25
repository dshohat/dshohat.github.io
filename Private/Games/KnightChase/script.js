class KnightChaseGame {
    constructor() {
        // Initialize game state
        this.boardSize = 8;
        this.board = this.initializeBoard();
        this.currentPlayer = 1; // Player 1 starts
        this.player1Position = { row: 7, col: 0 }; // A1
        this.player2Position = { row: 0, col: 7 }; // H8
        this.blockedSquares = new Set(); // Track blocked squares
        this.moveHistory = [];
        this.gameOver = false;
        this.selectedSquare = null;
        
        // Mark starting positions as occupied but not blocked yet
        this.board[7][0] = 'player1';
        this.board[0][7] = 'player2';
        
        this.createBoard();
        this.updateDisplay();
        this.updateStatistics();
    }
    
    initializeBoard() {
        // Create an 8x8 board with all squares empty
        return Array(this.boardSize).fill(null).map(() => 
            Array(this.boardSize).fill(null)
        );
    }
    
    createBoard() {
        const boardElement = document.getElementById('gameBoard');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                // Add click handler
                square.addEventListener('click', () => this.handleSquareClick(row, col));
                
                boardElement.appendChild(square);
            }
        }
        
        this.renderBoard();
    }
    
    renderBoard() {
        const squares = document.querySelectorAll('.square');
        
        squares.forEach(square => {
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            const key = `${row},${col}`;
            
            // Reset classes
            square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
            square.textContent = '';
            
            // Add player positions
            if (row === this.player1Position.row && col === this.player1Position.col) {
                square.classList.add('player1');
                square.textContent = '♞';
            } else if (row === this.player2Position.row && col === this.player2Position.col) {
                square.classList.add('player2');
                square.textContent = '♞';
            } else if (this.blockedSquares.has(key)) {
                square.classList.add('blocked');
            }
            
            // Highlight selected square
            if (this.selectedSquare && 
                this.selectedSquare.row === row && 
                this.selectedSquare.col === col) {
                square.classList.add('selected');
            }
        });
    }
    
    handleSquareClick(row, col) {
        if (this.gameOver) {
            return;
        }
        
        const currentPlayerPos = this.currentPlayer === 1 ? 
            this.player1Position : this.player2Position;
        
        // If clicking on current player's position, select it
        if (row === currentPlayerPos.row && col === currentPlayerPos.col) {
            this.selectedSquare = { row, col };
            this.showValidMoves();
            return;
        }
        
        // If a square is selected, try to move there
        if (this.selectedSquare) {
            const validMoves = this.getValidMoves(
                this.selectedSquare.row, 
                this.selectedSquare.col
            );
            
            const isValidMove = validMoves.some(
                move => move.row === row && move.col === col
            );
            
            if (isValidMove) {
                this.makeMove(row, col);
            }
            
            this.selectedSquare = null;
            this.clearValidMoveHighlights();
        }
    }
    
    showValidMoves() {
        this.clearValidMoveHighlights();
        
        if (!this.selectedSquare) return;
        
        const validMoves = this.getValidMoves(
            this.selectedSquare.row, 
            this.selectedSquare.col
        );
        
        validMoves.forEach(move => {
            const square = document.querySelector(
                `.square[data-row="${move.row}"][data-col="${move.col}"]`
            );
            if (square) {
                square.classList.add('valid-move');
            }
        });
        
        this.renderBoard();
        
        // Re-add valid move highlights after rendering
        validMoves.forEach(move => {
            const square = document.querySelector(
                `.square[data-row="${move.row}"][data-col="${move.col}"]`
            );
            if (square) {
                square.classList.add('valid-move');
            }
        });
    }
    
    clearValidMoveHighlights() {
        document.querySelectorAll('.valid-move').forEach(square => {
            square.classList.remove('valid-move');
        });
    }
    
    getValidMoves(row, col) {
        // Knight moves: 2 squares in one direction, 1 square perpendicular
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        const validMoves = [];
        
        for (const [dRow, dCol] of knightMoves) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            // Check if move is within bounds
            if (newRow >= 0 && newRow < this.boardSize && 
                newCol >= 0 && newCol < this.boardSize) {
                
                const key = `${newRow},${newCol}`;
                
                // Check if square is not blocked
                if (!this.blockedSquares.has(key)) {
                    validMoves.push({ row: newRow, col: newCol });
                }
            }
        }
        
        return validMoves;
    }
    
    makeMove(toRow, toCol) {
        const currentPlayerPos = this.currentPlayer === 1 ? 
            this.player1Position : this.player2Position;
        
        const fromRow = currentPlayerPos.row;
        const fromCol = currentPlayerPos.col;
        
        // Check for capture
        const opponentPos = this.currentPlayer === 1 ? 
            this.player2Position : this.player1Position;
        
        if (toRow === opponentPos.row && toCol === opponentPos.col) {
            this.endGame(`Player ${this.currentPlayer} wins by capture!`);
            return;
        }
        
        // Move the piece
        if (this.currentPlayer === 1) {
            this.player1Position = { row: toRow, col: toCol };
        } else {
            this.player2Position = { row: toRow, col: toCol };
        }
        
        // Block the square we left
        const fromKey = `${fromRow},${fromCol}`;
        this.blockedSquares.add(fromKey);
        
        // Record move in history
        const moveNotation = this.getSquareNotation(fromRow, fromCol) + 
                            '-' + 
                            this.getSquareNotation(toRow, toCol);
        this.moveHistory.push({
            player: this.currentPlayer,
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            notation: moveNotation
        });
        
        // Update display
        this.renderBoard();
        this.updateMoveHistory();
        this.updateStatistics();
        
        // Check if opponent has any valid moves
        const nextPlayer = this.currentPlayer === 1 ? 2 : 1;
        const nextPlayerPos = nextPlayer === 1 ? 
            this.player1Position : this.player2Position;
        
        const opponentMoves = this.getValidMoves(
            nextPlayerPos.row, 
            nextPlayerPos.col
        );
        
        if (opponentMoves.length === 0) {
            this.endGame(`Player ${this.currentPlayer} wins! Opponent has no valid moves.`);
            return;
        }
        
        // Switch players
        this.currentPlayer = nextPlayer;
        this.updateDisplay();
    }
    
    getSquareNotation(row, col) {
        const files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const rank = 8 - row;
        return files[col] + rank;
    }
    
    updateDisplay() {
        const currentPlayerElement = document.getElementById('currentPlayer');
        if (currentPlayerElement) {
            currentPlayerElement.textContent = `Player ${this.currentPlayer}'s Turn`;
            currentPlayerElement.style.color = this.currentPlayer === 1 ? '#3b82f6' : '#ef4444';
        }
    }
    
    updateMoveHistory() {
        const moveListElement = document.getElementById('moveList');
        if (!moveListElement) return;
        
        moveListElement.innerHTML = '';
        
        this.moveHistory.forEach((move, index) => {
            const moveEntry = document.createElement('div');
            moveEntry.className = 'move-entry';
            moveEntry.textContent = `${index + 1}. Player ${move.player}: ${move.notation}`;
            moveListElement.appendChild(moveEntry);
        });
        
        // Scroll to bottom
        moveListElement.scrollTop = moveListElement.scrollHeight;
    }
    
    updateStatistics() {
        // Total moves
        const totalMovesElement = document.getElementById('totalMoves');
        if (totalMovesElement) {
            totalMovesElement.textContent = this.moveHistory.length;
        }
        
        // Blocked squares
        const blockedCountElement = document.getElementById('blockedCount');
        if (blockedCountElement) {
            blockedCountElement.textContent = this.blockedSquares.size;
        }
        
        // Available moves for each player
        const player1MovesElement = document.getElementById('player1Moves');
        if (player1MovesElement) {
            const moves = this.getValidMoves(
                this.player1Position.row, 
                this.player1Position.col
            );
            player1MovesElement.textContent = moves.length;
        }
        
        const player2MovesElement = document.getElementById('player2Moves');
        if (player2MovesElement) {
            const moves = this.getValidMoves(
                this.player2Position.row, 
                this.player2Position.col
            );
            player2MovesElement.textContent = moves.length;
        }
    }
    
    endGame(message) {
        this.gameOver = true;
        const messageElement = document.getElementById('gameMessage');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.style.display = 'block';
        }
        
        // Add celebration effect
        this.celebrateWin();
    }
    
    celebrateWin() {
        const winnerPos = this.currentPlayer === 1 ? 
            this.player1Position : this.player2Position;
        
        const winnerSquare = document.querySelector(
            `.square[data-row="${winnerPos.row}"][data-col="${winnerPos.col}"]`
        );
        
        if (winnerSquare) {
            winnerSquare.style.animation = 'selectedPulse 0.3s ease-in-out infinite';
        }
    }
    
    undoLastMove() {
        if (this.moveHistory.length === 0 || this.gameOver) {
            return;
        }
        
        const lastMove = this.moveHistory.pop();
        
        // Restore player position
        if (lastMove.player === 1) {
            this.player1Position = lastMove.from;
        } else {
            this.player2Position = lastMove.from;
        }
        
        // Unblock the square
        const fromKey = `${lastMove.from.row},${lastMove.from.col}`;
        this.blockedSquares.delete(fromKey);
        
        // Switch back to previous player
        this.currentPlayer = lastMove.player;
        
        // Update display
        this.selectedSquare = null;
        this.clearValidMoveHighlights();
        this.renderBoard();
        this.updateDisplay();
        this.updateMoveHistory();
        this.updateStatistics();
        
        // Clear any game over message
        const messageElement = document.getElementById('gameMessage');
        if (messageElement) {
            messageElement.textContent = '';
        }
    }
    
    resetGame() {
        // Confirm reset if game is in progress
        if (this.moveHistory.length > 0 && !this.gameOver) {
            if (!confirm('Are you sure you want to start a new game? Current progress will be lost.')) {
                return;
            }
        }
        
        // Reset all game state
        this.board = this.initializeBoard();
        this.currentPlayer = 1;
        this.player1Position = { row: 7, col: 0 };
        this.player2Position = { row: 0, col: 7 };
        this.blockedSquares = new Set();
        this.moveHistory = [];
        this.gameOver = false;
        this.selectedSquare = null;
        
        this.board[7][0] = 'player1';
        this.board[0][7] = 'player2';
        
        // Clear message
        const messageElement = document.getElementById('gameMessage');
        if (messageElement) {
            messageElement.textContent = '';
        }
        
        // Update display
        this.clearValidMoveHighlights();
        this.renderBoard();
        this.updateDisplay();
        this.updateMoveHistory();
        this.updateStatistics();
    }
}

// Initialize game when page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new KnightChaseGame();
});
