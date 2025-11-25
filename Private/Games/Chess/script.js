class ChessGame {
    constructor() {
        // Initialize storage availability flag
        this.storageAvailable = this.checkStorageAvailable();
        
        // Try to load saved game first
        if (this.loadGameState()) {
            // Game loaded from localStorage
            this.createBoard();
            this.updateDisplay();
            this.updateMoveHistory();
            if (this.lastMove) {
                this.updateLastMoveInfo();
            }
        } else {
            // Start new game
            this.board = this.initializeBoard();
            this.currentPlayer = 'white';
            this.selectedSquare = null;
            this.moveHistory = [];
            this.lastMove = null;
            this.gameOver = false;
            this.inCheck = false;
            this.checkmate = false;
            this.stalemate = false;
            
            // Track castling rights
            this.castlingRights = {
                white: { kingSide: true, queenSide: true },
                black: { kingSide: true, queenSide: true }
            };
            
            // Track en passant target square (null if not available)
            this.enPassantTarget = null;
            
            this.createBoard();
            this.updateDisplay();
        }
        
        // Show warning if storage is not available
        if (!this.storageAvailable) {
            setTimeout(() => {
                this.showNotification('Note: Game progress will not be saved (Private browsing or storage disabled)', 'warning');
            }, 1000);
        }
    }
    
    checkStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch(e) {
            return false;
        }
    }
    
    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Place white pieces
        board[7][0] = { type: 'rook', color: 'white' };
        board[7][1] = { type: 'knight', color: 'white' };
        board[7][2] = { type: 'bishop', color: 'white' };
        board[7][3] = { type: 'queen', color: 'white' };
        board[7][4] = { type: 'king', color: 'white' };
        board[7][5] = { type: 'bishop', color: 'white' };
        board[7][6] = { type: 'knight', color: 'white' };
        board[7][7] = { type: 'rook', color: 'white' };
        
        for (let i = 0; i < 8; i++) {
            board[6][i] = { type: 'pawn', color: 'white' };
        }
        
        // Place black pieces
        board[0][0] = { type: 'rook', color: 'black' };
        board[0][1] = { type: 'knight', color: 'black' };
        board[0][2] = { type: 'bishop', color: 'black' };
        board[0][3] = { type: 'queen', color: 'black' };
        board[0][4] = { type: 'king', color: 'black' };
        board[0][5] = { type: 'bishop', color: 'black' };
        board[0][6] = { type: 'knight', color: 'black' };
        board[0][7] = { type: 'rook', color: 'black' };
        
        for (let i = 0; i < 8; i++) {
            board[1][i] = { type: 'pawn', color: 'black' };
        }
        
        return board;
    }
    
    createBoard() {
        const boardElement = document.getElementById('chessBoard');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                // Add both click and touch support for better mobile compatibility
                square.addEventListener('click', () => this.handleSquareClick(row, col));
                square.addEventListener('touchend', (e) => {
                    e.preventDefault(); // Prevent ghost click
                    this.handleSquareClick(row, col);
                });
                
                const piece = this.board[row][col];
                if (piece) {
                    square.classList.add(`${piece.color}-${piece.type}`);
                }
                
                boardElement.appendChild(square);
            }
        }
    }
    
    handleSquareClick(row, col) {
        if (this.gameOver) {
            this.showNotification('Game is over! Start a new game to continue playing.', 'info');
            return;
        }
        
        if (this.selectedSquare) {
            // Try to make a move
            const fromRow = this.selectedSquare.row;
            const fromCol = this.selectedSquare.col;
            const piece = this.board[fromRow][fromCol];
            
            if (this.isValidMove(fromRow, fromCol, row, col)) {
                this.makeMove(fromRow, fromCol, row, col);
            } else {
                // Explain why the move is invalid
                this.explainInvalidMove(fromRow, fromCol, row, col);
            }
            this.clearSelection();
        } else {
            // Select a piece
            const piece = this.board[row][col];
            if (piece && piece.color === this.currentPlayer) {
                this.selectSquare(row, col);
            } else if (piece && piece.color !== this.currentPlayer) {
                this.showNotification('You cannot move your opponent\'s pieces!', 'error');
            } else {
                this.showNotification('Please select a piece to move.', 'info');
            }
        }
    }
    
    explainInvalidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const targetPiece = this.board[toRow][toCol];
        
        // Check if trying to capture own piece
        if (targetPiece && targetPiece.color === piece.color) {
            this.showNotification('You cannot capture your own piece!', 'error');
            return;
        }
        
        // Check if the piece can make that basic move
        let isValidBasicMove = false;
        switch (piece.type) {
            case 'pawn':
                isValidBasicMove = this.isValidPawnMove(fromRow, fromCol, toRow, toCol, piece.color);
                break;
            case 'rook':
                isValidBasicMove = this.isValidRookMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'knight':
                isValidBasicMove = this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'bishop':
                isValidBasicMove = this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'queen':
                isValidBasicMove = this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'king':
                isValidBasicMove = this.isValidKingMove(fromRow, fromCol, toRow, toCol);
                if (!isValidBasicMove && Math.abs(toCol - fromCol) === 2) {
                    // Trying to castle but can't - give specific reason
                    const castlingError = this.getCastlingError(fromRow, fromCol, toRow, toCol);
                    this.showNotification(castlingError, 'error');
                    return;
                }
                break;
        }
        
        if (!isValidBasicMove) {
            const pieceNames = {
                'king': 'King',
                'queen': 'Queen',
                'rook': 'Rook',
                'bishop': 'Bishop',
                'knight': 'Knight',
                'pawn': 'Pawn'
            };
            this.showNotification(`${pieceNames[piece.type]} cannot move there! That's not a valid move for this piece.`, 'error');
            return;
        }
        
        // Check if move would leave king in check
        if (this.wouldBeInCheck(fromRow, fromCol, toRow, toCol)) {
            if (this.isKingInCheck(piece.color)) {
                this.showNotification('Your king is in check! You must move out of check.', 'error');
            } else {
                this.showNotification('That move would put your king in check! You must protect your king.', 'error');
            }
            return;
        }
        
        // Generic fallback
        this.showNotification('Invalid move! Please try a different move.', 'error');
    }
    
    showNotification(message, type = 'error') {
        const banner = document.getElementById('notificationBanner');
        const text = document.getElementById('notificationText');
        
        text.textContent = message;
        banner.className = `notification-banner ${type}`;
        
        // Show the banner
        setTimeout(() => {
            banner.classList.add('show');
        }, 10);
        
        // Auto-hide after 4 seconds
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }
        this.notificationTimeout = setTimeout(() => {
            this.hideNotification();
        }, 4000);
    }
    
    hideNotification() {
        const banner = document.getElementById('notificationBanner');
        banner.classList.remove('show');
    }
    
    exportGameMoves() {
        if (this.moveHistory.length === 0) {
            this.showNotification('No moves to export!', 'info');
            return;
        }
        
        let moveText = 'Chess Game Moves\n';
        moveText += '==================\n';
        moveText += `Date: ${new Date().toLocaleDateString()}\n`;
        moveText += `Total Moves: ${this.moveHistory.length}\n\n`;
        
        // Export in PGN-style format
        let moveNumber = 1;
        for (let i = 0; i < this.moveHistory.length; i += 2) {
            const whiteMove = this.moveHistory[i];
            const blackMove = this.moveHistory[i + 1];
            
            if (whiteMove) {
                moveText += `${moveNumber}. ${whiteMove.notation}`;
            }
            if (blackMove) {
                moveText += ` ${blackMove.notation}`;
            }
            moveText += '\n';
            moveNumber++;
        }
        
        // Add game result if checkmate or stalemate
        if (this.checkmate) {
            const winner = this.currentPlayer === 'white' ? '0-1' : '1-0';
            moveText += `\nResult: ${winner}`;
        } else if (this.stalemate) {
            moveText += `\nResult: 1/2-1/2 (Stalemate)`;
        }
        
        return moveText;
    }
    
    importGameMoves(moveText) {
        try {
            // Reset the game first
            this.board = this.initializeBoard();
            this.currentPlayer = 'white';
            this.selectedSquare = null;
            this.moveHistory = [];
            this.lastMove = null;
            this.gameOver = false;
            this.inCheck = false;
            this.checkmate = false;
            this.stalemate = false;
            this.inCheck = false;
            this.checkmate = false;
            this.castlingRights = {
                white: { kingSide: true, queenSide: true },
                black: { kingSide: true, queenSide: true }
            };
            
            // Parse the moves
            const lines = moveText.split('\n');
            const moves = [];
            
            for (const line of lines) {
                // Skip empty lines, headers, and result lines
                if (!line.trim() || line.startsWith('Chess') || line.startsWith('=') || 
                    line.startsWith('Date:') || line.startsWith('Total') || line.startsWith('Result:')) {
                    continue;
                }
                
                // Extract moves from lines like "1. e4 e5" or "5. dxc6 e.p. Qxc6"
                // First, clean up en passant notation (e.p. should be part of the move, not separate)
                const cleanedLine = line.replace(/\s+e\.p\./g, '');
                
                const moveMatches = cleanedLine.match(/\d+\.\s*([^\s]+)(?:\s+([^\s]+))?/);
                if (moveMatches) {
                    if (moveMatches[1]) moves.push(moveMatches[1]);
                    if (moveMatches[2]) moves.push(moveMatches[2]);
                }
            }
            
            // Apply each move
            for (let i = 0; i < moves.length; i++) {
                const moveNotation = moves[i];
                if (!this.processOpponentMove(moveNotation)) {
                    const moveNumber = Math.floor(i / 2) + 1;
                    const color = i % 2 === 0 ? 'White' : 'Black';
                    throw new Error(`Failed to apply move ${moveNumber}. ${moveNotation} (${color})`);
                }
            }
            
            this.updateDisplay();
            this.updateMoveHistory();
            this.showNotification(`Successfully imported ${moves.length} moves!`, 'info');
            return true;
        } catch (error) {
            console.error('Import error:', error);
            this.showNotification(`Failed to import moves! ${error.message}`, 'error');
            return false;
        }
    }
    
    showPromotionDialog(row, col, color) {
        return new Promise((resolve) => {
            const pieces = ['queen', 'rook', 'bishop', 'knight'];
            const pieceSymbols = {
                'queen': color === 'white' ? '♕' : '♛',
                'rook': color === 'white' ? '♖' : '♜',
                'bishop': color === 'white' ? '♗' : '♝',
                'knight': color === 'white' ? '♘' : '♞'
            };
            
            // Create overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            `;
            
            // Create dialog
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            `;
            
            const title = document.createElement('h2');
            title.textContent = 'Promote Pawn';
            title.style.cssText = 'margin: 0 0 20px 0; text-align: center; color: #2c3e50;';
            dialog.appendChild(title);
            
            const subtitle = document.createElement('p');
            subtitle.textContent = 'Choose a piece:';
            subtitle.style.cssText = 'margin: 0 0 20px 0; text-align: center; color: #666;';
            dialog.appendChild(subtitle);
            
            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = 'display: flex; gap: 15px; justify-content: center;';
            
            pieces.forEach(piece => {
                const button = document.createElement('button');
                button.className = `${color}-${piece}`;
                button.style.cssText = `
                    font-size: 60px;
                    width: 90px;
                    height: 90px;
                    border: 3px solid #ddd;
                    background: #f8f9fa;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;
                button.onmouseover = () => {
                    button.style.background = '#3498db';
                    button.style.borderColor = '#2980b9';
                    button.style.transform = 'scale(1.1)';
                };
                button.onmouseout = () => {
                    button.style.background = '#f8f9fa';
                    button.style.borderColor = '#ddd';
                    button.style.transform = 'scale(1)';
                };
                button.onclick = () => {
                    document.body.removeChild(overlay);
                    resolve(piece);
                };
                
                const label = document.createElement('div');
                label.style.cssText = 'text-align: center;';
                label.textContent = piece.charAt(0).toUpperCase() + piece.slice(1);
                
                const wrapper = document.createElement('div');
                wrapper.appendChild(button);
                wrapper.appendChild(label);
                buttonContainer.appendChild(wrapper);
            });
            
            dialog.appendChild(buttonContainer);
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
        });
    }
    
    selectSquare(row, col) {
        this.selectedSquare = { row, col };
        this.updateDisplay();
    }
    
    clearSelection() {
        this.selectedSquare = null;
        this.updateDisplay();
    }
    
    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece || piece.color !== this.currentPlayer) return false;
        
        const targetPiece = this.board[toRow][toCol];
        if (targetPiece && targetPiece.color === piece.color) return false;
        
        // Check basic piece movement rules
        let isValidBasicMove = false;
        switch (piece.type) {
            case 'pawn':
                isValidBasicMove = this.isValidPawnMove(fromRow, fromCol, toRow, toCol, piece.color);
                break;
            case 'rook':
                isValidBasicMove = this.isValidRookMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'knight':
                isValidBasicMove = this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'bishop':
                isValidBasicMove = this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'queen':
                isValidBasicMove = this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'king':
                isValidBasicMove = this.isValidKingMove(fromRow, fromCol, toRow, toCol);
                break;
            default:
                return false;
        }
        
        if (!isValidBasicMove) return false;
        
        // Check if this move would leave the king in check
        return !this.wouldBeInCheck(fromRow, fromCol, toRow, toCol);
    }
    
    isValidPawnMove(fromRow, fromCol, toRow, toCol, color) {
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        
        // Move forward
        if (fromCol === toCol && !this.board[toRow][toCol]) {
            if (toRow === fromRow + direction) return true;
            if (fromRow === startRow && toRow === fromRow + 2 * direction) return true;
        }
        
        // Capture diagonally (normal capture)
        if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction) {
            if (this.board[toRow][toCol] !== null) {
                return true;
            }
            
            // Check for en passant capture
            if (this.enPassantTarget && 
                this.enPassantTarget.row === toRow && 
                this.enPassantTarget.col === toCol) {
                return true;
            }
        }
        
        return false;
    }
    
    isValidRookMove(fromRow, fromCol, toRow, toCol) {
        if (fromRow !== toRow && fromCol !== toCol) return false;
        return this.isPathClear(fromRow, fromCol, toRow, toCol);
    }
    
    isValidKnightMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }
    
    isValidBishopMove(fromRow, fromCol, toRow, toCol) {
        if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) return false;
        return this.isPathClear(fromRow, fromCol, toRow, toCol);
    }
    
    isValidQueenMove(fromRow, fromCol, toRow, toCol) {
        return this.isValidRookMove(fromRow, fromCol, toRow, toCol) || 
               this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
    }
    
    isValidKingMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);
        
        // Normal king move (one square in any direction)
        if (rowDiff <= 1 && colDiff <= 1) {
            return true;
        }
        
        // Check for castling (king moves 2 squares horizontally)
        if (rowDiff === 0 && colDiff === 2) {
            return this.canCastle(fromRow, fromCol, toRow, toCol);
        }
        
        return false;
    }
    
    canCastle(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece || piece.type !== 'king') return false;
        
        const color = piece.color;
        const expectedRow = color === 'white' ? 7 : 0;
        const expectedKingCol = 4;
        
        // King must be on starting position
        if (fromRow !== expectedRow || fromCol !== expectedKingCol) return false;
        
        // King must not be in check (cannot castle out of check)
        if (this.isKingInCheck(color)) return false;
        
        // Determine if kingside or queenside
        const isKingSide = toCol > fromCol;
        const rookCol = isKingSide ? 7 : 0;
        const direction = isKingSide ? 1 : -1;
        
        // Check castling rights
        if (isKingSide && !this.castlingRights[color].kingSide) return false;
        if (!isKingSide && !this.castlingRights[color].queenSide) return false;
        
        // Check if rook is in position
        const rook = this.board[expectedRow][rookCol];
        if (!rook || rook.type !== 'rook' || rook.color !== color) return false;
        
        // Check if squares between king and rook are empty
        const start = Math.min(fromCol, rookCol) + 1;
        const end = Math.max(fromCol, rookCol);
        for (let col = start; col < end; col++) {
            if (this.board[expectedRow][col] !== null) return false;
        }
        
        // Check if king passes through or lands on attacked square
        const opponentColor = color === 'white' ? 'black' : 'white';
        for (let col = fromCol; col !== toCol + direction; col += direction) {
            if (this.isSquareUnderAttack(expectedRow, col, opponentColor)) {
                return false;
            }
        }
        
        return true;
    }
    
    getCastlingError(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece || piece.type !== 'king') return 'Invalid castling attempt!';
        
        const color = piece.color;
        const expectedRow = color === 'white' ? 7 : 0;
        const expectedKingCol = 4;
        
        // King must be on starting position
        if (fromRow !== expectedRow || fromCol !== expectedKingCol) {
            return 'Cannot castle: The king has already moved!';
        }
        
        // King must not be in check
        if (this.isKingInCheck(color)) {
            return 'Cannot castle while in check!';
        }
        
        // Determine if kingside or queenside
        const isKingSide = toCol > fromCol;
        const rookCol = isKingSide ? 7 : 0;
        const direction = isKingSide ? 1 : -1;
        const side = isKingSide ? 'kingside' : 'queenside';
        
        // Check castling rights
        if (isKingSide && !this.castlingRights[color].kingSide) {
            return `Cannot castle ${side}: The king or rook has already moved!`;
        }
        if (!isKingSide && !this.castlingRights[color].queenSide) {
            return `Cannot castle ${side}: The king or rook has already moved!`;
        }
        
        // Check if rook is in position
        const rook = this.board[expectedRow][rookCol];
        if (!rook || rook.type !== 'rook' || rook.color !== color) {
            return `Cannot castle ${side}: The rook is not in position!`;
        }
        
        // Check if squares between king and rook are empty
        const start = Math.min(fromCol, rookCol) + 1;
        const end = Math.max(fromCol, rookCol);
        for (let col = start; col < end; col++) {
            if (this.board[expectedRow][col] !== null) {
                return `Cannot castle ${side}: Pieces are blocking the path!`;
            }
        }
        
        // Check if king passes through or lands on attacked square
        const opponentColor = color === 'white' ? 'black' : 'white';
        for (let col = fromCol; col !== toCol + direction; col += direction) {
            if (this.isSquareUnderAttack(expectedRow, col, opponentColor)) {
                return `Cannot castle ${side}: The king would pass through or land on an attacked square!`;
            }
        }
        
        return 'Cannot castle: Unknown reason!';
    }
    
    isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = Math.sign(toRow - fromRow);
        const colStep = Math.sign(toCol - fromCol);
        
        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;
        
        while (currentRow !== toRow || currentCol !== toCol) {
            if (this.board[currentRow][currentCol] !== null) {
                return false;
            }
            currentRow += rowStep;
            currentCol += colStep;
        }
        
        return true;
    }
    
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];
        
        // Check if this is a castling move
        const isCastling = piece.type === 'king' && Math.abs(toCol - fromCol) === 2;
        let rookMove = null;
        
        // Check if this is an en passant capture
        const isEnPassant = piece.type === 'pawn' && 
                           Math.abs(fromCol - toCol) === 1 && 
                           !capturedPiece && 
                           this.enPassantTarget && 
                           this.enPassantTarget.row === toRow && 
                           this.enPassantTarget.col === toCol;
        
        let enPassantCapturedPiece = null;
        if (isEnPassant) {
            // Remove the pawn that was captured en passant
            const capturedPawnRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
            enPassantCapturedPiece = this.board[capturedPawnRow][toCol];
            this.board[capturedPawnRow][toCol] = null;
        }
        
        if (isCastling) {
            const isKingSide = toCol > fromCol;
            const rookFromCol = isKingSide ? 7 : 0;
            const rookToCol = isKingSide ? 5 : 3;
            const row = fromRow;
            
            // Move the rook
            rookMove = {
                from: { row, col: rookFromCol },
                to: { row, col: rookToCol }
            };
            this.board[row][rookToCol] = this.board[row][rookFromCol];
            this.board[row][rookFromCol] = null;
        }
        
        // Make the move
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Update en passant target
        this.updateEnPassantTarget(piece, fromRow, fromCol, toRow, toCol);
        
        // Update castling rights
        this.updateCastlingRights(piece, fromRow, fromCol, capturedPiece, toRow, toCol);
        
        // Check for pawn promotion
        if (piece.type === 'pawn') {
            const promotionRow = piece.color === 'white' ? 0 : 7;
            if (toRow === promotionRow) {
                // Pawn reached the end - show promotion dialog
                this.showPromotionDialog(toRow, toCol, piece.color).then(promotedPiece => {
                    this.board[toRow][toCol] = { type: promotedPiece, color: piece.color };
                    this.completeMove(fromRow, fromCol, toRow, toCol, piece, capturedPiece || enPassantCapturedPiece, promotedPiece, isCastling, rookMove, isEnPassant);
                });
                return; // Wait for promotion choice
            }
        }
        
        this.completeMove(fromRow, fromCol, toRow, toCol, piece, capturedPiece || enPassantCapturedPiece, null, isCastling, rookMove, isEnPassant);
    }
    
    updateCastlingRights(piece, fromRow, fromCol, capturedPiece, toRow, toCol) {
        // If king moves, lose all castling rights
        if (piece.type === 'king') {
            this.castlingRights[piece.color].kingSide = false;
            this.castlingRights[piece.color].queenSide = false;
        }
        
        // If rook moves, lose castling right on that side
        if (piece.type === 'rook') {
            const row = piece.color === 'white' ? 7 : 0;
            if (fromRow === row) {
                if (fromCol === 7) {
                    this.castlingRights[piece.color].kingSide = false;
                } else if (fromCol === 0) {
                    this.castlingRights[piece.color].queenSide = false;
                }
            }
        }
        
        // If a rook is captured, opponent loses castling rights on that side
        if (capturedPiece && capturedPiece.type === 'rook') {
            const opponentColor = capturedPiece.color;
            const rookRow = opponentColor === 'white' ? 7 : 0;
            if (toRow === rookRow) {
                if (toCol === 7) {
                    this.castlingRights[opponentColor].kingSide = false;
                } else if (toCol === 0) {
                    this.castlingRights[opponentColor].queenSide = false;
                }
            }
        }
    }
    
    updateEnPassantTarget(piece, fromRow, fromCol, toRow, toCol) {
        // Reset en passant target
        this.enPassantTarget = null;
        
        // If a pawn moves two squares, set the en passant target
        if (piece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
            const targetRow = (fromRow + toRow) / 2;
            this.enPassantTarget = { row: targetRow, col: toCol };
        }
    }
    
    completeMove(fromRow, fromCol, toRow, toCol, piece, capturedPiece, promotedTo, isCastling, rookMove, isEnPassant = false) {
        let moveNotation = this.getMoveNotation(piece, fromRow, fromCol, toRow, toCol, capturedPiece, promotedTo, isCastling, isEnPassant);
        
        // Record the move (notation will be updated after checking game state)
        const move = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: piece,
            capturedPiece: capturedPiece,
            notation: moveNotation,
            player: this.currentPlayer,
            promotedTo: promotedTo,
            isCastling: isCastling,
            rookMove: rookMove,
            isEnPassant: isEnPassant
        };
        
        this.moveHistory.push(move);
        this.lastMove = move;
        
        // Switch players
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        // Check for check and checkmate
        this.checkGameState();
        
        // Update notation with check/checkmate symbols
        if (this.checkmate) {
            moveNotation += '#';
        } else if (this.inCheck) {
            moveNotation += '+';
        }
        
        // Update the move record with the final notation
        move.notation = moveNotation;
        
        this.updateDisplay();
        this.updateMoveHistory();
        this.showCurrentMove(moveNotation);
        
        // Save game state to localStorage
        this.saveGameState();
    }
    
    getMoveNotation(piece, fromRow, fromCol, toRow, toCol, capturedPiece, promotedTo, isCastling, isEnPassant = false) {
        // Handle castling notation
        if (isCastling) {
            const isKingSide = toCol > fromCol;
            return isKingSide ? 'O-O' : 'O-O-O';
        }
        
        const files = 'abcdefgh';
        const ranks = '87654321';
        
        const fromSquare = files[fromCol] + ranks[fromRow];
        const toSquare = files[toCol] + ranks[toRow];
        
        let notation = '';
        
        // Piece notation
        switch (piece.type) {
            case 'king': notation += 'K'; break;
            case 'queen': notation += 'Q'; break;
            case 'rook': notation += 'R'; break;
            case 'bishop': notation += 'B'; break;
            case 'knight': notation += 'N'; break;
            case 'pawn': notation += ''; break; // Pawns have no letter
        }
        
        // Add capture notation
        if (capturedPiece || isEnPassant) {
            if (piece.type === 'pawn') {
                notation += files[fromCol]; // For pawn captures, show the file
            }
            notation += 'x';
        }
        
        // Add destination square
        notation += toSquare;
        
        // Add en passant notation
        if (isEnPassant) {
            notation += ' e.p.';
        }
        
        // Add promotion notation
        if (promotedTo) {
            notation += '=';
            switch (promotedTo) {
                case 'queen': notation += 'Q'; break;
                case 'rook': notation += 'R'; break;
                case 'bishop': notation += 'B'; break;
                case 'knight': notation += 'N'; break;
            }
        }
        
        // Note: Check/checkmate symbols will be added later in completeMove/makeOpponentMove
        // after the game state is updated
        
        return notation;
    }
    
    processOpponentMove(moveNotation) {
        try {
            const move = this.parseMove(moveNotation);
            if (move) {
                this.makeOpponentMove(move);
                return true;
            }
        } catch (error) {
            console.error('Error processing move:', error);
        }
        return false;
    }
    
    parseMove(notation) {
        notation = notation.trim();
        
        // Handle castling
        if (notation === 'O-O' || notation === '0-0') {
            return this.getCastlingMove(true); // King-side
        }
        if (notation === 'O-O-O' || notation === '0-0-0') {
            return this.getCastlingMove(false); // Queen-side
        }
        
        const files = 'abcdefgh';
        
        // Check for promotion (e.g., e8=Q, exd8=N+, a8=R#)
        let promotedTo = null;
        let workingNotation = notation.replace(/[+#]$/, ''); // Remove check/checkmate symbols
        
        if (workingNotation.includes('=')) {
            const parts = workingNotation.split('=');
            workingNotation = parts[0];
            const promotionPiece = parts[1];
            switch (promotionPiece) {
                case 'Q': promotedTo = 'queen'; break;
                case 'R': promotedTo = 'rook'; break;
                case 'B': promotedTo = 'bishop'; break;
                case 'N': promotedTo = 'knight'; break;
            }
        }
        
        // Extract destination square (always the last 2 characters of working notation)
        const toFile = workingNotation.slice(-2, -1);
        const toRank = workingNotation.slice(-1);
        
        if (!files.includes(toFile) || !'12345678'.includes(toRank)) {
            throw new Error('Invalid destination square');
        }
        
        const toCol = files.indexOf(toFile);
        const toRow = 8 - parseInt(toRank);
        
        // Determine piece type
        let pieceType = 'pawn';
        let fromInfo = '';
        
        if ('KQRBN'.includes(workingNotation[0])) {
            switch (workingNotation[0]) {
                case 'K': pieceType = 'king'; break;
                case 'Q': pieceType = 'queen'; break;
                case 'R': pieceType = 'rook'; break;
                case 'B': pieceType = 'bishop'; break;
                case 'N': pieceType = 'knight'; break;
            }
            fromInfo = workingNotation.slice(1, -2);
        } else {
            fromInfo = workingNotation.slice(0, -2);
        }
        
        // Remove 'x' for captures
        fromInfo = fromInfo.replace('x', '');
        
        // Find the piece that can make this move
        const possibleMoves = this.findPossibleMoves(pieceType, toRow, toCol, fromInfo);
        
        if (possibleMoves.length === 1) {
            return {
                from: possibleMoves[0],
                to: { row: toRow, col: toCol },
                pieceType: pieceType,
                promotedTo: promotedTo
            };
        }
        
        throw new Error('Ambiguous or invalid move');
    }
    
    findPossibleMoves(pieceType, toRow, toCol, fromInfo) {
        const possibleMoves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === pieceType && piece.color === this.currentPlayer) {
                    if (this.isValidMove(row, col, toRow, toCol)) {
                        // Check if this move matches the fromInfo
                        if (this.matchesFromInfo(row, col, fromInfo)) {
                            possibleMoves.push({ row, col });
                        }
                    }
                }
            }
        }
        
        return possibleMoves;
    }
    
    matchesFromInfo(row, col, fromInfo) {
        if (!fromInfo) return true;
        
        const files = 'abcdefgh';
        const ranks = '87654321';
        
        if (fromInfo.length === 1) {
            // Could be file or rank
            if (files.includes(fromInfo)) {
                return files[col] === fromInfo;
            } else if (ranks.includes(fromInfo)) {
                return ranks[row] === fromInfo;
            }
        } else if (fromInfo.length === 2) {
            // Full square notation
            return files[col] === fromInfo[0] && ranks[row] === fromInfo[1];
        }
        
        return true;
    }
    
    makeOpponentMove(move) {
        const piece = this.board[move.from.row][move.from.col];
        const capturedPiece = this.board[move.to.row][move.to.col];
        
        // Check if this is an en passant capture
        let isEnPassant = false;
        if (piece.type === 'pawn' && 
            this.enPassantTarget && 
            move.to.row === this.enPassantTarget.row && 
            move.to.col === this.enPassantTarget.col &&
            capturedPiece === null) {
            isEnPassant = true;
        }
        
        // Handle castling
        let isCastling = false;
        let rookMove = null;
        if (move.castling) {
            isCastling = true;
            const row = move.from.row;
            rookMove = {
                from: { row, col: move.castling.rookFrom },
                to: { row, col: move.castling.rookTo }
            };
            // Move the rook
            this.board[row][move.castling.rookTo] = this.board[row][move.castling.rookFrom];
            this.board[row][move.castling.rookFrom] = null;
        }
        
        // Make the move
        this.board[move.to.row][move.to.col] = piece;
        this.board[move.from.row][move.from.col] = null;
        
        // Handle en passant capture (remove the captured pawn)
        if (isEnPassant) {
            const capturedPawnRow = piece.color === 'white' ? move.to.row + 1 : move.to.row - 1;
            this.board[capturedPawnRow][move.to.col] = null;
        }
        
        // Update en passant target
        this.updateEnPassantTarget(piece, move.from.row, move.from.col, move.to.row, move.to.col);
        
        // Update castling rights
        this.updateCastlingRights(piece, move.from.row, move.from.col, capturedPiece, move.to.row, move.to.col);
        
        // Handle promotion
        if (move.promotedTo) {
            this.board[move.to.row][move.to.col] = { type: move.promotedTo, color: piece.color };
        }
        
        let moveNotation = this.getMoveNotation(piece, move.from.row, move.from.col, move.to.row, move.to.col, capturedPiece, move.promotedTo, isCastling, isEnPassant);
        
        // Record the move
        const moveRecord = {
            from: move.from,
            to: move.to,
            piece: piece,
            capturedPiece: capturedPiece,
            notation: moveNotation,
            player: this.currentPlayer,
            promotedTo: move.promotedTo,
            isCastling: isCastling,
            rookMove: rookMove
        };
        
        this.moveHistory.push(moveRecord);
        this.lastMove = moveRecord;
        
        // Switch players
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        // Check for check and checkmate
        this.checkGameState();
        
        // Update notation with check/checkmate symbols
        if (this.checkmate) {
            moveNotation += '#';
        } else if (this.inCheck) {
            moveNotation += '+';
        }
        
        // Update the move record with the final notation
        moveRecord.notation = moveNotation;
        
        this.updateDisplay();
        this.updateMoveHistory();
        this.updateLastMoveInfo();
        
        // Save game state to localStorage
        this.saveGameState();
    }
    
    getCastlingMove(kingSide) {
        const row = this.currentPlayer === 'white' ? 7 : 0;
        const kingCol = 4;
        const rookCol = kingSide ? 7 : 0;
        const newKingCol = kingSide ? 6 : 2;
        
        return {
            from: { row, col: kingCol },
            to: { row, col: newKingCol },
            pieceType: 'king',
            castling: { kingSide, rookFrom: rookCol, rookTo: kingSide ? 5 : 3 }
        };
    }
    
    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }
    
    isSquareUnderAttack(row, col, byColor) {
        // Check if the square is under attack by the specified color
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === byColor) {
                    // Check if this piece can attack the target square
                    if (this.canPieceAttackSquare(r, c, row, col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    canPieceAttackSquare(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return false;
        
        // For all pieces except pawns, use the standard move validation
        // For pawns, we need special logic since they attack differently than they move
        if (piece.type === 'pawn') {
            const direction = piece.color === 'white' ? -1 : 1;
            return Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction;
        }
        
        // For kings, only check normal moves (one square), not castling
        if (piece.type === 'king') {
            const rowDiff = Math.abs(fromRow - toRow);
            const colDiff = Math.abs(fromCol - toCol);
            return rowDiff <= 1 && colDiff <= 1;
        }
        
        // For other pieces, check if the move is valid (ignoring check rules)
        switch (piece.type) {
            case 'rook':
                return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
            case 'knight':
                return this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
            case 'bishop':
                return this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
            case 'queen':
                return this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
            default:
                return false;
        }
    }
    
    isKingInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) return false;
        
        const opponentColor = color === 'white' ? 'black' : 'white';
        return this.isSquareUnderAttack(kingPos.row, kingPos.col, opponentColor);
    }
    
    wouldBeInCheck(fromRow, fromCol, toRow, toCol) {
        // Simulate the move
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];
        
        // Check if this is an en passant capture
        const isEnPassant = piece && piece.type === 'pawn' && 
                           Math.abs(fromCol - toCol) === 1 && 
                           !capturedPiece && 
                           this.enPassantTarget && 
                           this.enPassantTarget.row === toRow && 
                           this.enPassantTarget.col === toCol;
        
        let enPassantCapturedPiece = null;
        let enPassantCapturedRow = null;
        
        if (isEnPassant) {
            // Temporarily remove the pawn that was captured en passant
            enPassantCapturedRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
            enPassantCapturedPiece = this.board[enPassantCapturedRow][toCol];
            this.board[enPassantCapturedRow][toCol] = null;
        }
        
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Check if king is in check after this move
        const inCheck = this.isKingInCheck(piece.color);
        
        // Undo the move
        this.board[fromRow][fromCol] = piece;
        this.board[toRow][toCol] = capturedPiece;
        
        // Restore en passant captured pawn
        if (isEnPassant && enPassantCapturedPiece) {
            this.board[enPassantCapturedRow][toCol] = enPassantCapturedPiece;
        }
        
        return inCheck;
    }
    
    hasLegalMoves(color) {
        // Check if the player has any legal moves
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = this.board[fromRow][fromCol];
                if (piece && piece.color === color) {
                    // Try all possible destination squares
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (fromRow === toRow && fromCol === toCol) continue;
                            
                            // Check basic move validity
                            const targetPiece = this.board[toRow][toCol];
                            if (targetPiece && targetPiece.color === piece.color) continue;
                            
                            let isValidBasicMove = false;
                            switch (piece.type) {
                                case 'pawn':
                                    isValidBasicMove = this.isValidPawnMove(fromRow, fromCol, toRow, toCol, piece.color);
                                    break;
                                case 'rook':
                                    isValidBasicMove = this.isValidRookMove(fromRow, fromCol, toRow, toCol);
                                    break;
                                case 'knight':
                                    isValidBasicMove = this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
                                    break;
                                case 'bishop':
                                    isValidBasicMove = this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
                                    break;
                                case 'queen':
                                    isValidBasicMove = this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
                                    break;
                                case 'king':
                                    isValidBasicMove = this.isValidKingMove(fromRow, fromCol, toRow, toCol);
                                    break;
                            }
                            
                            if (isValidBasicMove && !this.wouldBeInCheck(fromRow, fromCol, toRow, toCol)) {
                                return true; // Found a legal move
                            }
                        }
                    }
                }
            }
        }
        return false; // No legal moves found
    }

    
    checkGameState() {
        this.inCheck = this.isKingInCheck(this.currentPlayer);
        
        // Check for insufficient material (draw) - but don't end the game
        if (this.isInsufficientMaterial()) {
            this.showNotification('Draw by insufficient material! (You can continue playing if you wish)', 'warning');
        }
        
        if (this.inCheck) {
            // Check if it's checkmate
            if (!this.hasLegalMoves(this.currentPlayer)) {
                this.checkmate = true;
                this.gameOver = true;
                const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
                this.showNotification(`Checkmate! ${winner} wins!`, 'error');
            }
        } else {
            // Check if it's stalemate (not in check but no legal moves)
            if (!this.hasLegalMoves(this.currentPlayer)) {
                this.stalemate = true;
                this.gameOver = true;
                this.showNotification('Stalemate! It\'s a draw!', 'warning');
            }
        }
    }
    
    isInsufficientMaterial() {
        const pieces = [];
        
        // Collect all pieces on the board
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    pieces.push(piece);
                }
            }
        }
        
        // King vs King
        if (pieces.length === 2) {
            return true;
        }
        
        // King + minor piece vs King
        if (pieces.length === 3) {
            const nonKings = pieces.filter(p => p.type !== 'king');
            if (nonKings.length === 1) {
                const piece = nonKings[0];
                // Only bishop or knight (not queen, rook, or pawn)
                if (piece.type === 'bishop' || piece.type === 'knight') {
                    return true;
                }
            }
        }
        
        // King + bishop vs King + bishop (same color squares)
        if (pieces.length === 4) {
            const bishops = pieces.filter(p => p.type === 'bishop');
            const kings = pieces.filter(p => p.type === 'king');
            
            if (bishops.length === 2 && kings.length === 2) {
                // Find bishop positions
                let bishop1Pos = null, bishop2Pos = null;
                for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                        const piece = this.board[row][col];
                        if (piece && piece.type === 'bishop') {
                            if (!bishop1Pos) {
                                bishop1Pos = { row, col };
                            } else {
                                bishop2Pos = { row, col };
                            }
                        }
                    }
                }
                
                // Check if both bishops are on same color squares
                const bishop1Color = (bishop1Pos.row + bishop1Pos.col) % 2;
                const bishop2Color = (bishop2Pos.row + bishop2Pos.col) % 2;
                if (bishop1Color === bishop2Color) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    updateDisplay() {
        const squares = document.querySelectorAll('.square');
        
        // Find the king position if in check
        let kingInCheckPos = null;
        if (this.inCheck) {
            kingInCheckPos = this.findKing(this.currentPlayer);
        }
        
        squares.forEach(square => {
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            
            // Clear previous classes
            square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
            
            // Add piece class
            const piece = this.board[row][col];
            if (piece) {
                square.classList.add(`${piece.color}-${piece.type}`);
            }
            
            // Highlight selected square
            if (this.selectedSquare && this.selectedSquare.row === row && this.selectedSquare.col === col) {
                square.classList.add('selected');
            }
            
            // Highlight last move
            if (this.lastMove && 
                ((this.lastMove.from.row === row && this.lastMove.from.col === col) ||
                 (this.lastMove.to.row === row && this.lastMove.to.col === col))) {
                square.classList.add('last-move');
            }
            
            // Highlight king in check
            if (kingInCheckPos && kingInCheckPos.row === row && kingInCheckPos.col === col) {
                square.classList.add('king-in-check');
            }
        });
        
        // Update current player display
        let statusText = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)} to move`;
        const currentPlayerElement = document.getElementById('currentPlayer');
        currentPlayerElement.textContent = statusText;
        currentPlayerElement.className = '';
        
        // Update game status
        const gameStatusElement = document.getElementById('gameStatus');
        if (this.checkmate) {
            const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
            gameStatusElement.textContent = `CHECKMATE! ${winner} wins!`;
            gameStatusElement.className = 'error';
            currentPlayerElement.textContent = `Checkmate - ${winner} wins`;
        } else if (this.stalemate) {
            gameStatusElement.textContent = `STALEMATE! It's a draw!`;
            gameStatusElement.className = 'warning';
            currentPlayerElement.textContent = 'Stalemate - Draw';
        } else if (this.inCheck) {
            gameStatusElement.textContent = `CHECK! ${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)} king is in check!`;
            gameStatusElement.className = 'error';
        } else {
            gameStatusElement.textContent = '';
            gameStatusElement.className = '';
        }
    }
    
    updateMoveHistory() {
        const moveList = document.getElementById('moveList');
        moveList.innerHTML = '';
        
        for (let i = 0; i < this.moveHistory.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = this.moveHistory[i];
            const blackMove = this.moveHistory[i + 1];
            
            const moveEntry = document.createElement('div');
            moveEntry.className = 'move-entry';
            moveEntry.innerHTML = `${moveNumber}. ${whiteMove.notation}${blackMove ? ` ${blackMove.notation}` : ''}`;
            moveList.appendChild(moveEntry);
        }
        
        moveList.scrollTop = moveList.scrollHeight;
    }
    
    showCurrentMove(notation) {
        const finalNotation = this.checkmate ? notation + '#' : this.inCheck ? notation + '+' : notation;
        document.getElementById('currentMove').textContent = `Your move: ${finalNotation}`;
        document.getElementById('currentMove').classList.add('success');
        setTimeout(() => {
            document.getElementById('currentMove').classList.remove('success');
            if (!this.gameOver) {
                document.getElementById('currentMove').textContent = 'Click a piece to move';
            } else {
                document.getElementById('currentMove').textContent = 'Game Over';
            }
        }, 3000);
    }
    
    updateLastMoveInfo() {
        if (this.lastMove) {
            const files = 'abcdefgh';
            const ranks = '87654321';
            
            let moveInfo = '';
            
            if (this.lastMove.isCastling) {
                const isKingSide = this.lastMove.to.col > this.lastMove.from.col;
                moveInfo = isKingSide ? 'Castled kingside (O-O)' : 'Castled queenside (O-O-O)';
            } else {
                const fromSquare = files[this.lastMove.from.col] + ranks[this.lastMove.from.row];
                const toSquare = files[this.lastMove.to.col] + ranks[this.lastMove.to.row];
                
                const pieceNames = {
                    'king': 'King',
                    'queen': 'Queen',
                    'rook': 'Rook',
                    'bishop': 'Bishop',
                    'knight': 'Knight',
                    'pawn': 'Pawn'
                };
                
                const pieceName = pieceNames[this.lastMove.piece.type];
                moveInfo = `${pieceName} moved from ${fromSquare} to ${toSquare}`;
                
                if (this.lastMove.promotedTo) {
                    moveInfo += ` and promoted to ${pieceNames[this.lastMove.promotedTo]}`;
                }
            }
            
            document.getElementById('lastMoveInfo').textContent = moveInfo;
        }
    }
    
    undoLastMove() {
        if (this.moveHistory.length === 0) return;
        
        const lastMove = this.moveHistory.pop();
        
        // Restore the board state
        this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
        this.board[lastMove.to.row][lastMove.to.col] = lastMove.capturedPiece;
        
        // Undo en passant capture if applicable
        if (lastMove.isEnPassant) {
            // Restore the captured pawn
            const capturedPawnRow = lastMove.piece.color === 'white' ? lastMove.to.row + 1 : lastMove.to.row - 1;
            this.board[capturedPawnRow][lastMove.to.col] = lastMove.capturedPiece;
            this.board[lastMove.to.row][lastMove.to.col] = null; // Clear the destination square
        }
        
        // Undo castling rook move if applicable
        if (lastMove.isCastling && lastMove.rookMove) {
            const rookToRow = lastMove.rookMove.to.row;
            const rookToCol = lastMove.rookMove.to.col;
            const rookFromRow = lastMove.rookMove.from.row;
            const rookFromCol = lastMove.rookMove.from.col;
            
            this.board[rookFromRow][rookFromCol] = this.board[rookToRow][rookToCol];
            this.board[rookToRow][rookToCol] = null;
        }
        
        // Switch back to the previous player
        this.currentPlayer = lastMove.player;
        
        // Restore en passant target (recalculate based on the previous move)
        this.restoreEnPassantTarget();
        
        // Restore castling rights (simplified - would need to track history for full accuracy)
        // For now, we'll recalculate based on position
        this.recalculateCastlingRights();
        
        // Update last move reference
        this.lastMove = this.moveHistory.length > 0 ? this.moveHistory[this.moveHistory.length - 1] : null;
        
        // Reset game over states
        this.gameOver = false;
        this.checkmate = false;
        this.stalemate = false;
        
        // Recheck game state
        this.checkGameState();
        
        this.updateDisplay();
        this.updateMoveHistory();
        this.updateLastMoveInfo();
        
        // Save game state to localStorage
        this.saveGameState();
    }
    
    recalculateCastlingRights() {
        // Check white castling rights
        const whiteKing = this.board[7][4];
        if (whiteKing && whiteKing.type === 'king' && whiteKing.color === 'white') {
            const whiteKingMoved = this.moveHistory.some(m => 
                m.piece.type === 'king' && m.piece.color === 'white'
            );
            
            const whiteKingsideRook = this.board[7][7];
            const whiteKingsideRookMoved = this.moveHistory.some(m => 
                m.piece.type === 'rook' && m.piece.color === 'white' && m.from.row === 7 && m.from.col === 7
            );
            
            const whiteQueensideRook = this.board[7][0];
            const whiteQueensideRookMoved = this.moveHistory.some(m => 
                m.piece.type === 'rook' && m.piece.color === 'white' && m.from.row === 7 && m.from.col === 0
            );
            
            this.castlingRights.white.kingSide = !whiteKingMoved && !whiteKingsideRookMoved && 
                whiteKingsideRook && whiteKingsideRook.type === 'rook';
            this.castlingRights.white.queenSide = !whiteKingMoved && !whiteQueensideRookMoved && 
                whiteQueensideRook && whiteQueensideRook.type === 'rook';
        }
        
        // Check black castling rights
        const blackKing = this.board[0][4];
        if (blackKing && blackKing.type === 'king' && blackKing.color === 'black') {
            const blackKingMoved = this.moveHistory.some(m => 
                m.piece.type === 'king' && m.piece.color === 'black'
            );
            
            const blackKingsideRook = this.board[0][7];
            const blackKingsideRookMoved = this.moveHistory.some(m => 
                m.piece.type === 'rook' && m.piece.color === 'black' && m.from.row === 0 && m.from.col === 7
            );
            
            const blackQueensideRook = this.board[0][0];
            const blackQueensideRookMoved = this.moveHistory.some(m => 
                m.piece.type === 'rook' && m.piece.color === 'black' && m.from.row === 0 && m.from.col === 0
            );
            
            this.castlingRights.black.kingSide = !blackKingMoved && !blackKingsideRookMoved && 
                blackKingsideRook && blackKingsideRook.type === 'rook';
            this.castlingRights.black.queenSide = !blackKingMoved && !blackQueensideRookMoved && 
                blackQueensideRook && blackQueensideRook.type === 'rook';
        }
    }
    
    restoreEnPassantTarget() {
        // Reset en passant target
        this.enPassantTarget = null;
        
        // Check if the last move in history was a two-square pawn move
        if (this.moveHistory.length > 0) {
            const lastHistoryMove = this.moveHistory[this.moveHistory.length - 1];
            if (lastHistoryMove.piece.type === 'pawn' && 
                Math.abs(lastHistoryMove.to.row - lastHistoryMove.from.row) === 2) {
                const targetRow = (lastHistoryMove.from.row + lastHistoryMove.to.row) / 2;
                this.enPassantTarget = { row: targetRow, col: lastHistoryMove.to.col };
            }
        }
    }
    
    
    saveGameState() {
        // Skip if storage is not available
        if (!this.storageAvailable) {
            return;
        }
        
        const gameState = {
            board: this.board,
            currentPlayer: this.currentPlayer,
            moveHistory: this.moveHistory,
            lastMove: this.lastMove,
            gameOver: this.gameOver,
            inCheck: this.inCheck,
            checkmate: this.checkmate,
            stalemate: this.stalemate,
            castlingRights: this.castlingRights,
            enPassantTarget: this.enPassantTarget
        };
        
        try {
            const stateString = JSON.stringify(gameState);
            localStorage.setItem('chessGameState', stateString);
            console.log(`Game saved: ${this.moveHistory.length} moves`);
        } catch (e) {
            console.error('Failed to save game state:', e);
            // Check if it's a quota exceeded error
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                console.error('localStorage quota exceeded');
                this.storageAvailable = false;
            }
        }
    }
    
    loadGameState() {
        try {
            // Check if localStorage is available
            if (typeof(Storage) === "undefined") {
                console.warn('localStorage not supported in this browser');
                return false;
            }
            
            const savedState = localStorage.getItem('chessGameState');
            if (!savedState) {
                console.log('No saved game state found');
                return false;
            }
            
            console.log('Loading saved game state...');
            const gameState = JSON.parse(savedState);
            
            // Restore all game state
            this.board = gameState.board;
            this.currentPlayer = gameState.currentPlayer;
            this.moveHistory = gameState.moveHistory || [];
            this.lastMove = gameState.lastMove || null;
            this.gameOver = gameState.gameOver || false;
            this.inCheck = gameState.inCheck || false;
            this.checkmate = gameState.checkmate || false;
            this.stalemate = gameState.stalemate || false;
            this.castlingRights = gameState.castlingRights || {
                white: { kingSide: true, queenSide: true },
                black: { kingSide: true, queenSide: true }
            };
            this.enPassantTarget = gameState.enPassantTarget || null;
            this.selectedSquare = null;
            
            console.log(`Game loaded: ${this.moveHistory.length} moves, ${this.currentPlayer} to move`);
            return true;
        } catch (e) {
            console.error('Failed to load game state:', e);
            return false;
        }
    }
    
    clearSavedGame() {
        try {
            localStorage.removeItem('chessGameState');
        } catch (e) {
            console.error('Failed to clear saved game:', e);
        }
    }
    
    resetGame() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.lastMove = null;
        this.gameOver = false;
        this.inCheck = false;
        this.checkmate = false;
        this.stalemate = false;
        
        // Reset castling rights
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        
        // Reset en passant target
        this.enPassantTarget = null;
        
        // Clear saved game
        this.clearSavedGame();
        
        this.createBoard();
        this.updateDisplay();
        this.updateMoveHistory();
        
        document.getElementById('moveList').innerHTML = '';
        document.getElementById('currentMove').textContent = 'Click a piece to move';
        document.getElementById('lastMoveInfo').textContent = 'Game started';
        document.getElementById('gameStatus').textContent = '';
        document.getElementById('gameStatus').className = '';
    }
}

// Global game instance
let game;

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    game = new ChessGame();
});

// Global functions for HTML onclick handlers
function processOpponentMove() {
    const input = document.getElementById('opponentMove');
    const moveNotation = input.value.trim();
    
    if (!moveNotation) {
        game.showNotification('Please enter a move notation (e.g., e4, Nf3, O-O)', 'info');
        return;
    }
    
    if (game.processOpponentMove(moveNotation)) {
        input.value = '';
        input.classList.remove('error');
        input.classList.add('success');
        setTimeout(() => input.classList.remove('success'), 2000);
    } else {
        input.classList.add('error');
        game.showNotification('Invalid move notation! Please check the format (e.g., e4, Nf3, Qxh5, O-O)', 'error');
        setTimeout(() => input.classList.remove('error'), 2000);
    }
}

function resetGame() {
    if (confirm('Are you sure you want to start a new game?')) {
        game.resetGame();
    }
}

function undoLastMove() {
    game.undoLastMove();
}

function closeNotification() {
    if (game) {
        game.hideNotification();
    }
}

function exportGame() {
    if (!game) return;
    
    const moveText = game.exportGameMoves();
    if (!moveText) return;
    
    // Create a blob and download it
    const blob = new Blob([moveText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-game-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    game.showNotification('Game moves exported successfully!', 'info');
}

function importGame(event) {
    if (!game) return;
    
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        game.importGameMoves(content);
    };
    reader.onerror = function() {
        game.showNotification('Failed to read file!', 'error');
    };
    reader.readAsText(file);
    
    // Reset the file input so the same file can be imported again
    event.target.value = '';
}

// Allow Enter key to submit opponent move
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('opponentMove');
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            processOpponentMove();
        }
    });
});