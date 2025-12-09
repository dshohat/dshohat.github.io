class BackgammonGame {
    constructor() {
        // Game constants
        this.POINTS_COUNT = 24;
        this.PIECES_PER_PLAYER = 15;
        this.MATCH_TARGET = 3; // Best of 5 means first to 3 wins
        
        // Players: 'white' moves from 24 toward 1, 'black' moves from 1 toward 24
        this.currentPlayer = 'white';
        this.gameOver = false;
        
        // Dice
        this.dice = [];
        this.availableMoves = [];
        this.hasRolled = false;
        
        // Board state
        // points[0] = off-board, points[1-24] = actual points
        // Positive = white pieces, Negative = black pieces
        this.points = new Array(25).fill(0);
        
        // Bar (captured pieces)
        this.bar = { white: 0, black: 0 };
        
        // Borne off pieces
        this.borneOff = { white: 0, black: 0 };
        
        // Match scores
        this.matchScore = { white: 0, black: 0 };
        
        // Move history for undo
        this.moveHistory = [];
        this.turnStartState = null;
        
        // Selected piece
        this.selectedPoint = null;
        
        // Load saved state
        this.loadState();
        
        // Initialize UI
        this.renderBoard();
        this.updateDisplay();
        this.setupEventListeners();
    }
    
    // ==================== State Management ====================
    
    loadState() {
        try {
            // Load match scores
            const savedScores = localStorage.getItem('backgammon-matchScore');
            if (savedScores) {
                this.matchScore = JSON.parse(savedScores);
            }
            
            // Load game state
            const savedGame = localStorage.getItem('backgammon-game');
            if (savedGame) {
                const state = JSON.parse(savedGame);
                this.points = state.points;
                this.bar = state.bar;
                this.borneOff = state.borneOff;
                this.currentPlayer = state.currentPlayer;
                this.gameOver = state.gameOver;
                this.dice = state.dice || [];
                this.availableMoves = state.availableMoves || [];
                this.hasRolled = state.hasRolled || false;
                this.fullHistory = state.fullHistory || [];
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
            // Save match scores
            localStorage.setItem('backgammon-matchScore', JSON.stringify(this.matchScore));
            
            // Save game state
            const state = {
                points: this.points,
                bar: this.bar,
                borneOff: this.borneOff,
                currentPlayer: this.currentPlayer,
                gameOver: this.gameOver,
                dice: this.dice,
                availableMoves: this.availableMoves,
                hasRolled: this.hasRolled,
                fullHistory: this.fullHistory || []
            };
            localStorage.setItem('backgammon-game', JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    }
    
    initializeBoard() {
        // Reset all points
        this.points = new Array(25).fill(0);
        
        // Standard backgammon starting position
        // White pieces (positive): moving from 24 toward 1
        this.points[24] = 2;   // 2 white on point 24
        this.points[13] = 5;   // 5 white on point 13
        this.points[8] = 3;    // 3 white on point 8
        this.points[6] = 5;    // 5 white on point 6
        
        // Black pieces (negative): moving from 1 toward 24
        this.points[1] = -2;   // 2 black on point 1
        this.points[12] = -5;  // 5 black on point 12
        this.points[17] = -3;  // 3 black on point 17
        this.points[19] = -5;  // 5 black on point 19
        
        // Reset other state
        this.bar = { white: 0, black: 0 };
        this.borneOff = { white: 0, black: 0 };
        this.currentPlayer = 'white';
        this.gameOver = false;
        this.dice = [];
        this.availableMoves = [];
        this.hasRolled = false;
        this.moveHistory = [];
        this.fullHistory = [];
        this.selectedPoint = null;
    }
    
    // Save a snapshot for full undo capability
    saveSnapshot() {
        this.fullHistory.push({
            points: [...this.points],
            bar: { ...this.bar },
            borneOff: { ...this.borneOff },
            currentPlayer: this.currentPlayer,
            dice: [...this.dice],
            availableMoves: [...this.availableMoves],
            hasRolled: this.hasRolled
        });
        // Limit history to prevent memory issues (keep last 50 moves)
        if (this.fullHistory.length > 50) {
            this.fullHistory.shift();
        }
    }
    
    // ==================== Dice Rolling ====================
    
    rollDice() {
        if (this.hasRolled || this.gameOver) return;
        
        // Save turn start state for undo
        this.turnStartState = {
            points: [...this.points],
            bar: { ...this.bar },
            borneOff: { ...this.borneOff }
        };
        this.moveHistory = [];
        
        // Roll two dice
        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;
        
        // Doubles = 4 moves of that number
        if (die1 === die2) {
            this.dice = [die1, die1, die1, die1];
        } else {
            this.dice = [die1, die2];
        }
        
        this.availableMoves = [...this.dice];
        this.hasRolled = true;
        
        // Animate dice
        this.animateDice(die1, die2);
        
        // Check if player can move
        if (!this.hasAnyValidMove()) {
            this.showMessage("No valid moves available!");
            setTimeout(() => {
                this.endTurn();
            }, 1500);
        }
        
        this.renderBoard();
        this.updateDisplay();
        this.saveState();
    }
    
    animateDice(die1, die2) {
        const dieEl1 = document.getElementById('die1');
        const dieEl2 = document.getElementById('die2');
        
        dieEl1.classList.add('rolling');
        dieEl2.classList.add('rolling');
        
        setTimeout(() => {
            dieEl1.classList.remove('rolling');
            dieEl2.classList.remove('rolling');
            dieEl1.textContent = die1;
            dieEl2.textContent = die2;
        }, 500);
    }
    
    // ==================== Move Validation ====================
    
    hasAnyValidMove() {
        const player = this.currentPlayer;
        
        // Check if player has pieces on bar
        if (this.bar[player] > 0) {
            return this.availableMoves.some(die => this.canEnterFromBar(die));
        }
        
        // Check all points for valid moves
        for (let from = 1; from <= 24; from++) {
            if (this.hasPlayerPiece(from, player)) {
                for (const die of this.availableMoves) {
                    if (this.isValidMove(from, die)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    canEnterFromBar(die) {
        const player = this.currentPlayer;
        let targetPoint;
        
        if (player === 'white') {
            // White enters from opponent's home board (points 19-24)
            targetPoint = 25 - die;
        } else {
            // Black enters from opponent's home board (points 1-6)
            targetPoint = die;
        }
        
        return this.canLandOn(targetPoint, player);
    }
    
    isValidMove(from, die) {
        const player = this.currentPlayer;
        
        // Must move pieces from bar first
        if (this.bar[player] > 0) {
            return false;
        }
        
        // Check if there's a piece on the from point
        if (!this.hasPlayerPiece(from, player)) {
            return false;
        }
        
        // Calculate target point
        let to;
        if (player === 'white') {
            to = from - die; // White moves from high to low
        } else {
            to = from + die; // Black moves from low to high
        }
        
        // Check bearing off
        if (player === 'white' && to <= 0) {
            return this.canBearOff(player) && this.isValidBearOff(from, die, player);
        }
        if (player === 'black' && to >= 25) {
            return this.canBearOff(player) && this.isValidBearOff(from, die, player);
        }
        
        // Regular move
        return this.canLandOn(to, player);
    }
    
    hasPlayerPiece(point, player) {
        if (player === 'white') {
            return this.points[point] > 0;
        } else {
            return this.points[point] < 0;
        }
    }
    
    canLandOn(point, player) {
        if (point < 1 || point > 24) return false;
        
        const pieces = this.points[point];
        
        if (player === 'white') {
            // Can land if empty, own pieces, or single opponent piece (blot)
            return pieces >= -1;
        } else {
            return pieces <= 1;
        }
    }
    
    canBearOff(player) {
        // All pieces must be in home board
        if (this.bar[player] > 0) return false;
        
        if (player === 'white') {
            // White's home board is points 1-6
            for (let i = 7; i <= 24; i++) {
                if (this.points[i] > 0) return false;
            }
        } else {
            // Black's home board is points 19-24
            for (let i = 1; i <= 18; i++) {
                if (this.points[i] < 0) return false;
            }
        }
        
        return true;
    }
    
    isValidBearOff(from, die, player) {
        if (player === 'white') {
            const target = from - die;
            if (target === 0) {
                // Exact roll
                return true;
            } else if (target < 0) {
                // Can only bear off with higher roll if no pieces on higher points
                for (let i = from + 1; i <= 6; i++) {
                    if (this.points[i] > 0) return false;
                }
                return true;
            }
        } else {
            const target = from + die;
            if (target === 25) {
                // Exact roll
                return true;
            } else if (target > 25) {
                // Can only bear off with higher roll if no pieces on lower points
                for (let i = from - 1; i >= 19; i--) {
                    if (this.points[i] < 0) return false;
                }
                return true;
            }
        }
        return false;
    }
    
    getValidMovesFrom(from) {
        const validMoves = [];
        const player = this.currentPlayer;
        
        for (const die of this.availableMoves) {
            let to;
            if (player === 'white') {
                to = from - die;
            } else {
                to = from + die;
            }
            
            // Bearing off
            if ((player === 'white' && to <= 0) || (player === 'black' && to >= 25)) {
                if (this.canBearOff(player) && this.isValidBearOff(from, die, player)) {
                    validMoves.push({ to: player === 'white' ? 'bearOff' : 'bearOff', die });
                }
            } else if (this.canLandOn(to, player)) {
                validMoves.push({ to, die });
            }
        }
        
        return validMoves;
    }
    
    // ==================== Making Moves ====================
    
    handlePointClick(point) {
        if (this.gameOver) return;
        
        // Must roll dice first
        if (!this.hasRolled) {
            this.showMessage("Roll the dice first!");
            return;
        }
        
        const player = this.currentPlayer;
        
        // If player has pieces on bar and is selecting entry point
        if (this.bar[player] > 0) {
            if (this.selectedPoint === 'bar') {
                // User is choosing where to enter from bar
                if (this.handleBarEntryClick(point)) {
                    return;
                }
                // If clicked point wasn't valid, just deselect
                this.selectedPoint = null;
                this.renderBoard();
                return;
            }
            // Start bar entry selection
            this.handleBarClick();
            return;
        }
        
        // If clicking on bearing off area
        if (point === 'bearOff') {
            if (this.selectedPoint !== null && this.selectedPoint !== 'bar') {
                this.tryBearOff();
            }
            return;
        }
        
        // If a piece is already selected
        if (this.selectedPoint !== null && this.selectedPoint !== 'bar') {
            // If clicking on same point, deselect
            if (this.selectedPoint === point) {
                this.selectedPoint = null;
                this.renderBoard();
                return;
            }
            
            // Try to move to clicked point
            if (this.tryMove(this.selectedPoint, point)) {
                this.selectedPoint = null;
            } else {
                // If can't move, try selecting new piece
                if (this.hasPlayerPiece(point, player)) {
                    this.selectedPoint = point;
                } else {
                    this.selectedPoint = null;
                }
            }
            this.renderBoard();
            return;
        }
        
        // Select piece if it belongs to current player
        if (this.hasPlayerPiece(point, player)) {
            this.selectedPoint = point;
            this.renderBoard();
        }
    }
    
    handleBarClick() {
        if (this.gameOver || !this.hasRolled) return;
        
        const player = this.currentPlayer;
        if (this.bar[player] === 0) return;
        
        // Get all valid entry points
        const validEntries = [];
        for (let i = 0; i < this.availableMoves.length; i++) {
            const die = this.availableMoves[i];
            if (this.canEnterFromBar(die)) {
                let targetPoint;
                if (player === 'white') {
                    targetPoint = 25 - die;
                } else {
                    targetPoint = die;
                }
                // Avoid duplicates (for doubles)
                if (!validEntries.find(e => e.targetPoint === targetPoint)) {
                    validEntries.push({ targetPoint, dieIndex: i, die });
                }
            }
        }
        
        if (validEntries.length === 0) {
            this.showMessage("No valid entry point available!");
            return;
        }
        
        // If only one option, execute immediately
        if (validEntries.length === 1) {
            this.executeBarEntry(validEntries[0].targetPoint, validEntries[0].dieIndex);
            this.afterMove();
            return;
        }
        
        // Multiple options - highlight valid entry points and let user choose
        this.selectedPoint = 'bar';
        this.showMessage("Click a highlighted point to enter from bar");
        this.renderBoard();
    }
    
    handleBarEntryClick(point) {
        const player = this.currentPlayer;
        
        // Find the die that gets us to this point
        for (let i = 0; i < this.availableMoves.length; i++) {
            const die = this.availableMoves[i];
            let targetPoint;
            if (player === 'white') {
                targetPoint = 25 - die;
            } else {
                targetPoint = die;
            }
            
            if (targetPoint === point && this.canEnterFromBar(die)) {
                this.selectedPoint = null;
                this.executeBarEntry(targetPoint, i);
                this.afterMove();
                return true;
            }
        }
        return false;
    }
    
    getValidBarEntryPoints() {
        const player = this.currentPlayer;
        const validPoints = [];
        
        for (const die of this.availableMoves) {
            if (this.canEnterFromBar(die)) {
                let targetPoint;
                if (player === 'white') {
                    targetPoint = 25 - die;
                } else {
                    targetPoint = die;
                }
                if (!validPoints.includes(targetPoint)) {
                    validPoints.push(targetPoint);
                }
            }
        }
        
        return validPoints;
    }
    
    tryMove(from, to) {
        const player = this.currentPlayer;
        const die = Math.abs(to - from);
        
        // Find the die that matches
        const dieIndex = this.availableMoves.findIndex(d => {
            let expectedTo;
            if (player === 'white') {
                expectedTo = from - d;
            } else {
                expectedTo = from + d;
            }
            return expectedTo === to && this.canLandOn(to, player);
        });
        
        if (dieIndex === -1) return false;
        
        // Execute the move
        this.executeMove(from, to, dieIndex);
        this.afterMove();
        return true;
    }
    
    tryBearOff() {
        if (this.selectedPoint === null) return;
        
        const from = this.selectedPoint;
        const player = this.currentPlayer;
        
        if (!this.canBearOff(player)) return;
        
        // Find valid bear off die
        for (let i = 0; i < this.availableMoves.length; i++) {
            const die = this.availableMoves[i];
            if (this.isValidBearOff(from, die, player)) {
                this.executeBearOff(from, i);
                this.selectedPoint = null;
                this.afterMove();
                return;
            }
        }
        
        this.showMessage("Cannot bear off from this point!");
    }
    
    executeMove(from, to, dieIndex) {
        const player = this.currentPlayer;
        const opponent = player === 'white' ? 'black' : 'white';
        
        // Save snapshot before move for full undo
        this.saveSnapshot();
        
        // Save move for undo
        this.moveHistory.push({
            type: 'move',
            from,
            to,
            dieIndex,
            die: this.availableMoves[dieIndex],
            captured: false
        });
        
        // Check if capturing a blot
        if ((player === 'white' && this.points[to] === -1) ||
            (player === 'black' && this.points[to] === 1)) {
            // Capture the blot
            this.points[to] = 0;
            this.bar[opponent]++;
            this.moveHistory[this.moveHistory.length - 1].captured = true;
        }
        
        // Move the piece
        if (player === 'white') {
            this.points[from]--;
            this.points[to]++;
        } else {
            this.points[from]++;
            this.points[to]--;
        }
        
        // Use the die
        this.availableMoves.splice(dieIndex, 1);
    }
    
    executeBarEntry(to, dieIndex) {
        const player = this.currentPlayer;
        const opponent = player === 'white' ? 'black' : 'white';
        
        // Save snapshot before move for full undo
        this.saveSnapshot();
        
        // Save move for undo
        this.moveHistory.push({
            type: 'barEntry',
            to,
            dieIndex,
            die: this.availableMoves[dieIndex],
            captured: false
        });
        
        // Check if capturing a blot
        if ((player === 'white' && this.points[to] === -1) ||
            (player === 'black' && this.points[to] === 1)) {
            this.points[to] = 0;
            this.bar[opponent]++;
            this.moveHistory[this.moveHistory.length - 1].captured = true;
        }
        
        // Enter from bar
        this.bar[player]--;
        if (player === 'white') {
            this.points[to]++;
        } else {
            this.points[to]--;
        }
        
        // Use the die
        this.availableMoves.splice(dieIndex, 1);
    }
    
    executeBearOff(from, dieIndex) {
        const player = this.currentPlayer;
        
        // Save snapshot before move for full undo
        this.saveSnapshot();
        
        // Save move for undo
        this.moveHistory.push({
            type: 'bearOff',
            from,
            dieIndex,
            die: this.availableMoves[dieIndex]
        });
        
        // Remove piece from board
        if (player === 'white') {
            this.points[from]--;
        } else {
            this.points[from]++;
        }
        
        // Add to borne off
        this.borneOff[player]++;
        
        // Use the die
        this.availableMoves.splice(dieIndex, 1);
    }
    
    afterMove() {
        // Check for win
        if (this.borneOff[this.currentPlayer] === this.PIECES_PER_PLAYER) {
            this.handleGameWin();
            return;
        }
        
        // Check if turn should end
        if (this.availableMoves.length === 0 || !this.hasAnyValidMove()) {
            this.endTurn();
        }
        
        this.renderBoard();
        this.updateDisplay();
        this.saveState();
    }
    
    endTurn() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.dice = [];
        this.availableMoves = [];
        this.hasRolled = false;
        this.moveHistory = [];
        this.turnStartState = null;
        this.selectedPoint = null;
        
        this.clearMessage();
        this.renderBoard();
        this.updateDisplay();
        this.saveState();
    }
    
    // ==================== Win Detection ====================
    
    handleGameWin() {
        const winner = this.currentPlayer;
        const loser = winner === 'white' ? 'black' : 'white';
        
        // Check for gammon (opponent has 0 pieces borne off)
        const isGammon = this.borneOff[loser] === 0;
        const points = isGammon ? 2 : 1;
        
        this.matchScore[winner] += points;
        this.gameOver = true;
        
        this.saveState();
        this.updateDisplay();
        
        // Check for match win
        const matchWon = this.matchScore[winner] >= this.MATCH_TARGET;
        
        setTimeout(() => {
            this.showWinModal(winner, isGammon, points, matchWon);
        }, 500);
    }
    
    // ==================== Undo ====================
    
    undoMove() {
        if (this.fullHistory.length === 0 || this.gameOver) return;
        
        // Restore from full history snapshot
        const snapshot = this.fullHistory.pop();
        
        this.points = snapshot.points;
        this.bar = snapshot.bar;
        this.borneOff = snapshot.borneOff;
        this.currentPlayer = snapshot.currentPlayer;
        this.dice = snapshot.dice;
        this.availableMoves = snapshot.availableMoves;
        this.hasRolled = snapshot.hasRolled;
        
        // Also pop from moveHistory to keep in sync
        if (this.moveHistory.length > 0) {
            this.moveHistory.pop();
        }
        
        this.selectedPoint = null;
        this.renderBoard();
        this.updateDisplay();
        this.saveState();
    }
    
    // ==================== Rendering ====================
    
    renderBoard() {
        // Render all points
        for (let i = 1; i <= 24; i++) {
            this.renderPoint(i);
        }
        
        // Render bar
        this.renderBar();
        
        // Render bearing off areas
        this.renderBearingOff();
        
        // Update dice display
        this.renderDice();
        
        // Update roll button state
        const rollBtn = document.getElementById('rollButton');
        rollBtn.disabled = this.hasRolled || this.gameOver;
        
        // Highlight valid moves
        if (this.selectedPoint !== null && this.selectedPoint !== 'bar') {
            this.highlightValidMoves();
        }
        
        // Highlight valid bar entry points
        if (this.selectedPoint === 'bar') {
            this.highlightBarEntryPoints();
        }
    }
    
    highlightBarEntryPoints() {
        const validPoints = this.getValidBarEntryPoints();
        validPoints.forEach(point => {
            const pointEl = document.querySelector(`.point[data-point="${point}"]`);
            if (pointEl) {
                pointEl.classList.add('valid-target');
            }
        });
    }
    
    renderPoint(pointNum) {
        const pointEl = document.querySelector(`.point[data-point="${pointNum}"]`);
        if (!pointEl) return;
        
        pointEl.innerHTML = '';
        pointEl.classList.remove('selected', 'valid-target', 'has-pieces');
        
        const pieces = this.points[pointNum];
        const count = Math.abs(pieces);
        const color = pieces > 0 ? 'white' : pieces < 0 ? 'black' : null;
        
        if (count > 0) {
            pointEl.classList.add('has-pieces');
            
            // Determine if point is on top or bottom half
            const isTopHalf = pointNum >= 13;
            
            // Calculate piece spacing based on point height
            const pointHeight = pointEl.offsetHeight || 180;
            const pieceSize = Math.min(38, pointHeight * 0.21);
            const spacing = pieceSize * 0.75;
            
            // Create pieces (max 5 visible, then show count)
            const displayCount = Math.min(count, 5);
            for (let i = 0; i < displayCount; i++) {
                const piece = document.createElement('div');
                piece.className = `piece ${color}-piece`;
                if (isTopHalf) {
                    piece.style.top = `${i * spacing}px`;
                } else {
                    piece.style.bottom = `${i * spacing}px`;
                }
                pointEl.appendChild(piece);
            }
            
            // Show count if more than 5
            if (count > 5) {
                const countEl = document.createElement('div');
                countEl.className = 'piece-count';
                countEl.textContent = count;
                if (isTopHalf) {
                    countEl.style.top = `${displayCount * spacing}px`;
                } else {
                    countEl.style.bottom = `${displayCount * spacing}px`;
                }
                pointEl.appendChild(countEl);
            }
        }
        
        // Highlight selected point
        if (this.selectedPoint === pointNum) {
            pointEl.classList.add('selected');
        }
        
        // Add click handler
        pointEl.onclick = () => this.handlePointClick(pointNum);
    }
    
    renderBar() {
        const whiteBarEl = document.getElementById('whiteBar');
        const blackBarEl = document.getElementById('blackBar');
        
        // Clear bars
        whiteBarEl.innerHTML = '';
        blackBarEl.innerHTML = '';
        
        // Remove existing click handlers
        const topBar = document.getElementById('topBar');
        const bottomBar = document.getElementById('bottomBar');
        
        // Render white pieces on bar
        for (let i = 0; i < this.bar.white; i++) {
            const piece = document.createElement('div');
            piece.className = 'piece white-piece bar-piece';
            whiteBarEl.appendChild(piece);
        }
        
        // Render black pieces on bar
        for (let i = 0; i < this.bar.black; i++) {
            const piece = document.createElement('div');
            piece.className = 'piece black-piece bar-piece';
            blackBarEl.appendChild(piece);
        }
        
        // Add click handlers to bars
        topBar.onclick = () => {
            if (this.currentPlayer === 'white' && this.bar.white > 0) {
                this.handleBarClick();
            }
        };
        bottomBar.onclick = () => {
            if (this.currentPlayer === 'black' && this.bar.black > 0) {
                this.handleBarClick();
            }
        };
        
        // Highlight bar if player has pieces there
        topBar.classList.toggle('active', this.currentPlayer === 'white' && this.bar.white > 0 && this.hasRolled);
        bottomBar.classList.toggle('active', this.currentPlayer === 'black' && this.bar.black > 0 && this.hasRolled);
    }
    
    renderBearingOff() {
        const whiteBornOffEl = document.getElementById('whiteBornOff');
        const blackBornOffEl = document.getElementById('blackBornOff');
        
        // Clear areas
        whiteBornOffEl.innerHTML = '';
        blackBornOffEl.innerHTML = '';
        
        // Render white borne off pieces
        for (let i = 0; i < this.borneOff.white; i++) {
            const piece = document.createElement('div');
            piece.className = 'piece white-piece borne-off-piece';
            whiteBornOffEl.appendChild(piece);
        }
        
        // Render black borne off pieces
        for (let i = 0; i < this.borneOff.black; i++) {
            const piece = document.createElement('div');
            piece.className = 'piece black-piece borne-off-piece';
            blackBornOffEl.appendChild(piece);
        }
        
        // Add click handlers for bearing off
        const whiteBearingOff = document.getElementById('whiteBearingOff');
        const blackBearingOff = document.getElementById('blackBearingOff');
        
        whiteBearingOff.onclick = () => {
            if (this.currentPlayer === 'white') {
                this.handlePointClick('bearOff');
            }
        };
        blackBearingOff.onclick = () => {
            if (this.currentPlayer === 'black') {
                this.handlePointClick('bearOff');
            }
        };
        
        // Highlight if can bear off
        const canWhiteBearOff = this.currentPlayer === 'white' && this.canBearOff('white') && this.selectedPoint !== null;
        const canBlackBearOff = this.currentPlayer === 'black' && this.canBearOff('black') && this.selectedPoint !== null;
        
        whiteBearingOff.classList.toggle('can-bear-off', canWhiteBearOff);
        blackBearingOff.classList.toggle('can-bear-off', canBlackBearOff);
    }
    
    renderDice() {
        const die1El = document.getElementById('die1');
        const die2El = document.getElementById('die2');
        const movesEl = document.getElementById('movesRemaining');
        
        if (this.dice.length === 0) {
            die1El.textContent = '-';
            die2El.textContent = '-';
            die1El.classList.remove('used');
            die2El.classList.remove('used');
            movesEl.textContent = '';
        } else {
            // Original dice values
            die1El.textContent = this.dice[0];
            die2El.textContent = this.dice.length > 1 ? this.dice[1] : this.dice[0];
            
            // Show used state
            const originalDice = this.dice[0] === this.dice[1] ? 
                [this.dice[0], this.dice[0], this.dice[0], this.dice[0]] :
                [this.dice[0], this.dice[1]];
            
            die1El.classList.toggle('used', !this.availableMoves.includes(this.dice[0]));
            
            if (originalDice.length === 4) {
                // Doubles
                const usedCount = 4 - this.availableMoves.length;
                die1El.classList.toggle('used', usedCount >= 2);
                die2El.classList.toggle('used', usedCount >= 4);
            } else {
                die1El.classList.toggle('used', !this.availableMoves.includes(originalDice[0]));
                die2El.classList.toggle('used', !this.availableMoves.includes(originalDice[1]));
            }
            
            // Show remaining moves
            if (this.availableMoves.length > 0) {
                movesEl.textContent = `Moves: ${this.availableMoves.join(', ')}`;
            } else {
                movesEl.textContent = 'No moves left';
            }
        }
    }
    
    highlightValidMoves() {
        if (this.selectedPoint === null) return;
        
        const validMoves = this.getValidMovesFrom(this.selectedPoint);
        
        validMoves.forEach(move => {
            if (move.to === 'bearOff') {
                // Highlight bearing off area
                const bearOffEl = document.getElementById(this.currentPlayer === 'white' ? 'whiteBearingOff' : 'blackBearingOff');
                bearOffEl.classList.add('valid-target');
            } else {
                const pointEl = document.querySelector(`.point[data-point="${move.to}"]`);
                if (pointEl) {
                    pointEl.classList.add('valid-target');
                }
            }
        });
    }
    
    updateDisplay() {
        // Update current player display
        const playerEl = document.getElementById('currentPlayer');
        const emoji = this.currentPlayer === 'white' ? '⚪' : '⚫';
        const name = this.currentPlayer === 'white' ? 'White' : 'Black';
        
        playerEl.innerHTML = `
            <span class="turn-indicator">${emoji}</span>
            <span>${name}'s Turn</span>
        `;
        
        // Show roll prompt if hasn't rolled
        if (!this.hasRolled && !this.gameOver) {
            this.showMessage("Click 'Roll Dice' to start your turn");
        }
        
        // Update match scores
        document.getElementById('whiteMatchScore').textContent = this.matchScore.white;
        document.getElementById('blackMatchScore').textContent = this.matchScore.black;
        
        // Update match status
        const statusEl = document.getElementById('matchStatus');
        if (this.matchScore.white >= this.MATCH_TARGET) {
            statusEl.textContent = 'White wins the match!';
        } else if (this.matchScore.black >= this.MATCH_TARGET) {
            statusEl.textContent = 'Black wins the match!';
        } else {
            const whiteNeeds = this.MATCH_TARGET - this.matchScore.white;
            const blackNeeds = this.MATCH_TARGET - this.matchScore.black;
            statusEl.textContent = `White needs ${whiteNeeds}, Black needs ${blackNeeds}`;
        }
    }
    
    showMessage(msg) {
        const msgEl = document.getElementById('gameMessage');
        msgEl.textContent = msg;
    }
    
    clearMessage() {
        const msgEl = document.getElementById('gameMessage');
        msgEl.textContent = '';
    }
    
    // ==================== Modal ====================
    
    showWinModal(winner, isGammon, points, matchWon) {
        const modal = document.getElementById('winModal');
        const message = document.getElementById('winMessage');
        const subtext = document.getElementById('winSubtext');
        const matchResult = document.getElementById('matchResult');
        const playAgainBtn = document.getElementById('playAgainBtn');
        
        const emoji = winner === 'white' ? '⚪' : '⚫';
        const name = winner === 'white' ? 'White' : 'Black';
        
        if (isGammon) {
            message.textContent = `${emoji} ${name} wins with a Gammon!`;
            subtext.textContent = `${name} earns ${points} points for the gammon victory!`;
        } else {
            message.textContent = `${emoji} ${name} Wins!`;
            subtext.textContent = `${name} bears off all pieces and earns ${points} point!`;
        }
        
        if (matchWon) {
            matchResult.textContent = `🏆 ${name} wins the match ${this.matchScore[winner]} - ${this.matchScore[winner === 'white' ? 'black' : 'white']}! 🏆`;
            matchResult.style.display = 'block';
            playAgainBtn.textContent = 'New Match';
            playAgainBtn.onclick = () => this.resetMatch();
        } else {
            matchResult.textContent = `Match: White ${this.matchScore.white} - ${this.matchScore.black} Black`;
            matchResult.style.display = 'block';
            playAgainBtn.textContent = 'Play Next Game';
            playAgainBtn.onclick = () => this.startNewGame();
        }
        
        modal.classList.add('show');
    }
    
    closeModal() {
        const modal = document.getElementById('winModal');
        modal.classList.remove('show');
    }
    
    // ==================== Game Controls ====================
    
    startNewGame() {
        this.closeModal();
        this.initializeBoard();
        this.renderBoard();
        this.updateDisplay();
        this.saveState();
    }
    
    resetGame() {
        this.initializeBoard();
        this.renderBoard();
        this.updateDisplay();
        this.saveState();
    }
    
    resetMatch() {
        this.closeModal();
        this.matchScore = { white: 0, black: 0 };
        this.initializeBoard();
        this.renderBoard();
        this.updateDisplay();
        this.saveState();
    }
    
    // ==================== Event Listeners ====================
    
    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.selectedPoint = null;
                this.closeModal();
                this.renderBoard();
            }
            if (e.key === ' ' || e.key === 'r' || e.key === 'R') {
                if (!this.hasRolled && !this.gameOver) {
                    e.preventDefault();
                    this.rollDice();
                }
            }
            if (e.key === 'z' && e.ctrlKey) {
                e.preventDefault();
                this.undoMove();
            }
        });
        
        // Re-render on resize for responsive piece positioning
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.renderBoard();
            }, 150);
        });
    }
}

// Initialize game when page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new BackgammonGame();
});
