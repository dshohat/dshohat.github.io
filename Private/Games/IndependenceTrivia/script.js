/* ============================================================
   Independence Trivia — Game Logic
   ============================================================ */

/* ===== Geographic projection (Mercator-approximation) ===== */
const MAP_CFG = { latMin: 29.4, latMax: 33.4, lonMin: 34.25, lonMax: 35.95, svgW: 220, svgH: 470 };

function geoProject(lat, lon) {
    const x = (lon - MAP_CFG.lonMin) / (MAP_CFG.lonMax - MAP_CFG.lonMin) * MAP_CFG.svgW;
    const y = (MAP_CFG.latMax - lat) / (MAP_CFG.latMax - MAP_CFG.latMin) * MAP_CFG.svgH;
    return { x: +x.toFixed(1), y: +y.toFixed(1) };
}

function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* City geographic coordinates [lat, lon] */
const GEO_CITIES = {
    'מטולה':       [33.28, 35.57],
    'קריית שמונה': [33.21, 35.57],
    'צפת':         [32.96, 35.50],
    'עכו':         [32.92, 35.07],
    'חיפה':        [32.82, 35.00],
    'נצרת':        [32.70, 35.30],
    'טבריה':       [32.79, 35.53],
    'נתניה':       [32.33, 34.86],
    'תל אביב':     [32.08, 34.78],
    'ירושלים':     [31.77, 35.22],
    'אשדוד':       [31.80, 34.65],
    'אשקלון':      [31.67, 34.57],
    'באר שבע':     [31.25, 34.79],
    'מצפה רמון':   [30.61, 34.80],
    'אילת':        [29.56, 34.95],
    'פתח תקווה':   [32.09, 34.88]
};

/* Israel border outline [lat, lon] traced clockwise from Rosh HaNikra */
const ISRAEL_OUTLINE = [
    [33.10, 35.10], [32.82, 34.98], [32.65, 34.92], [32.33, 34.85],
    [32.08, 34.76], [31.97, 34.74], [31.80, 34.64], [31.67, 34.56],
    [31.50, 34.48], [31.22, 34.36], [31.03, 34.39], [30.75, 34.52],
    [30.50, 34.62], [30.25, 34.75], [29.95, 34.87], [29.56, 34.95],
    [29.50, 34.98], [29.80, 35.00], [30.50, 35.22], [31.00, 35.47],
    [31.50, 35.54], [32.00, 35.54], [32.35, 35.60], [32.70, 35.62],
    [33.05, 35.62], [33.28, 35.57], [33.30, 35.42], [33.30, 35.20],
    [33.22, 35.10]
];

function buildSilentMapSVG() {
    const pathD = ISRAEL_OUTLINE.map((pt, i) => {
        const { x, y } = geoProject(pt[0], pt[1]);
        return (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
    }).join(' ') + ' Z';
    return `<svg id="israelMapSVG" viewBox="0 0 ${MAP_CFG.svgW} ${MAP_CFG.svgH}"
        xmlns="http://www.w3.org/2000/svg" class="israel-map-svg">
        <path class="israel-outline-path" d="${pathD}"/>
        <line id="bonusDistLine" class="distance-line" x1="0" y1="0" x2="0" y2="0" visibility="hidden"/>
        <circle id="bonusCorrectPin" class="correct-pin" r="8" cx="-30" cy="-30" visibility="hidden"/>
        <circle id="bonusPlayerPin" class="player-pin" r="7" cx="-30" cy="-30" visibility="hidden"/>
    </svg>`;
}

// ----- Confetti -----
class Confetti {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.running = false;
        this.colors = ['#0038B8', '#ffffff', '#FFD700', '#4d7ed4'];
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    burst(count = 120) {
        const cx = this.canvas.width / 2;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: cx + (Math.random() - 0.5) * 200,
                y: 80 + Math.random() * 50,
                vx: (Math.random() - 0.5) * 8,
                vy: Math.random() * -6 - 4,
                gravity: 0.18,
                size: Math.random() * 6 + 4,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                rot: Math.random() * Math.PI,
                vrot: (Math.random() - 0.5) * 0.2,
                life: 200 + Math.random() * 100
            });
        }
        if (!this.running) this.start();
    }
    start() {
        this.running = true;
        const tick = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.particles = this.particles.filter(p => p.life > 0);
            this.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.rot += p.vrot;
                p.life--;
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.rot);
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                this.ctx.restore();
            });
            if (this.particles.length > 0) {
                requestAnimationFrame(tick);
            } else {
                this.running = false;
            }
        };
        tick();
    }
    stop() {
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// ----- Main Game -----
class IndependenceTriviaGame {
    constructor() {
        this.allQuestions = [];
        this.queue = [];
        this.players = [];
        this.currentPlayerIdx = 0;
        this.currentQ = null;
        this.currentQNum = 0;
        this.totalQ = 10;
        this.difficulty = 'קל';
        this.timer = null;
        this.timeLeft = 0;
        this.timeMax = 15;
        this.answered = false;
        this.totalCorrect = 0;
        this.confetti = null;
        this.noTimer = false;

        // Bonus map phase state
        this.bonusCity = null;
        this.bonusPlayerIdx = 0;
        this.bonusTimeLeft = 0;
        this.bonusTimeMax = 10;
        this.bonusTimer = null;
        this.bonusTimeout = false;
        this.bonusAnswered = false;
        this.bonusHits = 0;

        this.elements = {
            setupScreen:  document.getElementById('setupScreen'),
            gameScreen:   document.getElementById('gameScreen'),
            endScreen:    document.getElementById('endScreen'),
            startBtn:     document.getElementById('startBtn'),
            playerMinus:  document.getElementById('playerMinus'),
            playerPlus:   document.getElementById('playerPlus'),
            playerCountDisplay: document.getElementById('playerCountDisplay'),
            playerNames:  document.getElementById('playerNames'),
            questionProgress: document.getElementById('questionProgress'),
            currentCategory: document.getElementById('currentCategory'),
            currentDifficulty: document.getElementById('currentDifficulty'),
            currentPlayerDisplay: document.getElementById('currentPlayerDisplay'),
            timerBar:     document.getElementById('timerBar'),
            timerText:    document.getElementById('timerText'),
            questionText: document.getElementById('questionText'),
            answersGrid:  document.getElementById('answersGrid'),
            funFactBox:   document.getElementById('funFactBox'),
            funFactText:  document.getElementById('funFactText'),
            nextBtn:      document.getElementById('nextBtn'),
            scoresList:   document.getElementById('scoresList'),
            bonusOverlay:     document.getElementById('bonusOverlay'),
            bonusCityLabel:   document.getElementById('bonusCityLabel'),
            bonusTimerBar:    document.getElementById('bonusTimerBar'),
            bonusTimerText:   document.getElementById('bonusTimerText'),
            bonusMapContainer:document.getElementById('bonusMapContainer'),
            bonusResult:      document.getElementById('bonusResult'),
            bonusNextBtn:     document.getElementById('bonusNextBtn'),
            quitBtn:      document.getElementById('quitBtn'),
            endTitle:     document.getElementById('endTitle'),
            finalScores:  document.getElementById('finalScores'),
            endStatCorrect: document.getElementById('endStatCorrect'),
            endStatCities: document.getElementById('endStatCities'),
            leaderboardList: document.getElementById('leaderboardList'),
            leaderboardPreview: document.getElementById('leaderboardPreview'),
            playAgainBtn: document.getElementById('playAgainBtn'),
            confettiCanvas: document.getElementById('confettiCanvas')
        };

        this.playerCount = 1;
        this.init();
    }

    async init() {
        this.confetti = new Confetti(this.elements.confettiCanvas);

        // Inject silent map SVG (once)
        this.elements.bonusMapContainer.innerHTML = buildSilentMapSVG();
        const svg = document.getElementById('israelMapSVG');
        const onMapInteract = (e) => {
            if (this.bonusAnswered || this.bonusTimeout) return;
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            this.handleBonusClick(touch);
        };
        svg.addEventListener('click', onMapInteract);
        svg.addEventListener('touchstart', onMapInteract, { passive: false });
        this.renderPlayerNames();
        this.renderLeaderboardPreview();
        this.bindEvents();

        try {
            const res = await fetch('questions.json');
            const data = await res.json();
            this.allQuestions = data.questions;
        } catch (e) {
            console.error('Failed to load questions:', e);
            alert('שגיאה בטעינת השאלות. נסו לרענן את הדף.');
        }
    }

    bindEvents() {
        this.elements.playerMinus.addEventListener('click', () => this.changePlayerCount(-1));
        this.elements.playerPlus.addEventListener('click', () => this.changePlayerCount(1));
        this.elements.startBtn.addEventListener('click', () => this.startGame());
        this.elements.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.elements.bonusNextBtn.addEventListener('click', () => this.endBonusPhase());
        this.elements.quitBtn.addEventListener('click', () => {
            if (confirm('לסיים את המשחק?')) this.endGame();
        });
        this.elements.playAgainBtn.addEventListener('click', () => this.resetToSetup());
        document.querySelectorAll('input[name="questionDifficulty"]').forEach(r => {
            r.addEventListener('change', () => this.renderLeaderboardPreview());
        });

        // Keyboard 1-4 + Enter
        document.addEventListener('keydown', (e) => {
            if (this.elements.gameScreen.classList.contains('active')) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= 4 && !this.answered) {
                    this.handleAnswer(num - 1);
                } else if (e.key === 'Enter' && this.answered) {
                    this.nextQuestion();
                }
            } else if (this.elements.setupScreen.classList.contains('active') && e.key === 'Enter') {
                this.startGame();
            }
        });
    }

    changePlayerCount(delta) {
        const next = Math.max(1, Math.min(10, this.playerCount + delta));
        if (next === this.playerCount) return;
        this.playerCount = next;
        this.elements.playerCountDisplay.textContent = next;
        this.renderPlayerNames();
    }

    renderPlayerNames() {
        const existing = Array.from(this.elements.playerNames.querySelectorAll('input')).map(i => i.value);
        let html = '';
        for (let i = 0; i < this.playerCount; i++) {
            const v = existing[i] || `שחקן ${i + 1}`;
            html += `<input type="text" data-player="${i}" value="${v}" maxlength="20">`;
        }
        this.elements.playerNames.innerHTML = html;
    }

    renderLeaderboardPreview() {
        const diff = document.querySelector('input[name="questionDifficulty"]:checked').value;
        const lb = this.loadLeaderboard(diff);
        if (lb.length === 0) {
            this.elements.leaderboardPreview.classList.remove('visible');
            return;
        }
        this.elements.leaderboardPreview.classList.add('visible');
        this.elements.leaderboardPreview.innerHTML = `
            <h3>🏆 שיאי רמת קושי &ldquo;${diff}&rdquo;</h3>
            <ol>${lb.map(e => `
                <li><span class="lb-name">${this.escape(e.name)}</span><span class="lb-score">${e.score} נק'</span></li>
            `).join('')}</ol>`;
    }

    escape(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    startGame() {
        if (this.allQuestions.length === 0) {
            alert('השאלות עדיין נטענות, נסו שוב בעוד רגע.');
            return;
        }

        this.difficulty = document.querySelector('input[name="questionDifficulty"]:checked').value;
        this.totalQ = parseInt(document.querySelector('input[name="questionCount"]:checked').value);
        const timerSettingVal = document.querySelector('input[name="timerSetting"]:checked').value;
        const timerMap = { 'ארוך': 20, 'רגיל': 12, 'קצר': 8, 'ללא': 0 };
        this.timeMax = timerMap[timerSettingVal];
        this.noTimer = (timerSettingVal === 'ללא');

        this.players = [];
        this.elements.playerNames.querySelectorAll('input').forEach((inp, i) => {
            this.players.push({
                name: inp.value.trim() || `שחקן ${i + 1}`,
                score: 0,
                streak: 0,
                bestStreak: 0,
                correct: 0
            });
        });

        // Filter questions by difficulty
        let pool;
        if (this.difficulty === 'מעורב') {
            pool = [...this.allQuestions];
        } else {
            pool = this.allQuestions.filter(q => q.difficulty === this.difficulty);
        }
        // Shuffle and take totalQ
        this.queue = this.shuffle(pool).slice(0, this.totalQ);
        this.totalQ = this.queue.length; // in case pool was smaller

        this.currentQNum = 0;
        this.currentPlayerIdx = 0;
        this.totalCorrect = 0;
        this.bonusHits = 0;

        this.switchScreen('gameScreen');
        this.renderScores();
        this.nextQuestion();
    }

    shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    nextQuestion() {
        clearInterval(this.timer);
        this.elements.funFactBox.hidden = true;
        this.elements.nextBtn.hidden = true;

        if (this.currentQNum >= this.totalQ) {
            this.endGame();
            return;
        }

        this.currentQ = this.queue[this.currentQNum];
        this.currentQNum++;
        this.answered = false;

        // Shuffle answer order while tracking correct index
        const opts = this.currentQ.options.map((text, idx) => ({ text, isCorrect: idx === this.currentQ.correctIndex }));
        const shuffled = this.shuffle(opts);
        this.currentQ._shuffled = shuffled;
        this.currentQ._correctShuffledIdx = shuffled.findIndex(o => o.isCorrect);

        // Render
        this.elements.questionProgress.textContent = `שאלה ${this.currentQNum} / ${this.totalQ}`;
        this.elements.currentCategory.textContent = this.currentQ.category;
        const diffClass = { 'קל': 'easy', 'בינוני': 'medium', 'קשה': 'hard' }[this.currentQ.difficulty];
        this.elements.currentDifficulty.textContent = this.currentQ.difficulty;
        this.elements.currentDifficulty.className = `difficulty-tag ${diffClass}`;

        const player = this.players[this.currentPlayerIdx];
        this.elements.currentPlayerDisplay.innerHTML = `תור: <strong>${this.escape(player.name)}</strong>`;

        this.elements.questionText.textContent = this.currentQ.question;
        this.elements.answersGrid.innerHTML = shuffled.map((o, i) => `
            <button class="answer-btn" data-idx="${i}">
                <span class="answer-num">${i + 1}</span>
                <span>${this.escape(o.text)}</span>
            </button>
        `).join('');
        this.elements.answersGrid.querySelectorAll('.answer-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleAnswer(parseInt(btn.dataset.idx)));
        });

        this.startTimer();
        this.renderScores();
    }

    startTimer() {
        this.elements.timerBar.style.width = '100%';
        this.elements.timerBar.classList.remove('low');

        if (this.noTimer) {
            this.timeLeft = Infinity;
            this.elements.timerText.textContent = '∞';
            return;
        }

        this.timeLeft = this.timeMax;
        this.elements.timerText.textContent = this.timeLeft;

        const startTime = Date.now();
        this.timer = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            this.timeLeft = Math.max(0, this.timeMax - elapsed);
            const pct = (this.timeLeft / this.timeMax) * 100;
            this.elements.timerBar.style.width = pct + '%';
            this.elements.timerText.textContent = Math.ceil(this.timeLeft);
            if (this.timeLeft < this.timeMax * 0.3) {
                this.elements.timerBar.classList.add('low');
            }
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.handleAnswer(-1); // timeout
            }
        }, 100);
    }

    handleAnswer(chosenIdx) {
        if (this.answered) return;
        this.answered = true;
        clearInterval(this.timer);

        const correctIdx = this.currentQ._correctShuffledIdx;
        const isCorrect = chosenIdx === correctIdx;
        const player = this.players[this.currentPlayerIdx];

        // Visual feedback
        const btns = this.elements.answersGrid.querySelectorAll('.answer-btn');
        btns.forEach((b, i) => {
            b.disabled = true;
            if (i === correctIdx) b.classList.add('correct');
            if (i === chosenIdx && !isCorrect) b.classList.add('wrong');
        });

        // Scoring
        if (isCorrect) {
            const diffMult = { 'קל': 1, 'בינוני': 2, 'קשה': 3 }[this.currentQ.difficulty];
            const timeBonus = this.noTimer ? 0 : Math.ceil(this.timeLeft);
            const points = 10 * diffMult + timeBonus;
            player.score += points;
            player.correct++;
            player.streak++;
            if (player.streak > player.bestStreak) player.bestStreak = player.streak;
            this.totalCorrect++;

            // Confetti for hard correct
            if (this.currentQ.difficulty === 'קשה') this.confetti.burst(40);
        } else {
            player.streak = 0;
        }

        // Fun fact
        if (this.currentQ.funFact) {
            this.elements.funFactText.textContent = this.currentQ.funFact;
            this.elements.funFactBox.hidden = false;
        }

        // City bonus phase (only on correct answer with a known city)
        if (isCorrect && this.currentQ.cityHint && GEO_CITIES[this.currentQ.cityHint]) {
            this.bonusPlayerIdx = this.currentPlayerIdx;
            this.renderScores();
            this.currentPlayerIdx = (this.currentPlayerIdx + 1) % this.players.length;
            setTimeout(() => this.startBonusPhase(this.currentQ.cityHint), 700);
        } else {
            this.elements.nextBtn.hidden = false;
            this.elements.nextBtn.textContent = (this.currentQNum >= this.totalQ) ? 'סיום משחק 🏁' : 'השאלה הבאה ←';
            this.renderScores();
            this.currentPlayerIdx = (this.currentPlayerIdx + 1) % this.players.length;
        }
    }

    startBonusPhase(cityName) {
        this.bonusCity = cityName;
        this.bonusAnswered = false;
        this.bonusTimeout = false;

        this.elements.bonusCityLabel.textContent = cityName;
        this.elements.bonusResult.hidden = true;
        this.elements.bonusNextBtn.hidden = true;

        // Reset SVG markers
        ['bonusPlayerPin', 'bonusCorrectPin', 'bonusDistLine'].forEach(id => {
            document.getElementById(id).setAttribute('visibility', 'hidden');
        });

        this.elements.bonusOverlay.hidden = false;

        // Start bonus timer
        this.bonusTimeLeft = this.bonusTimeMax;
        this.elements.bonusTimerBar.style.width = '100%';
        this.elements.bonusTimerBar.classList.remove('low');
        this.elements.bonusTimerText.textContent = this.bonusTimeMax;

        const start = Date.now();
        this.bonusTimer = setInterval(() => {
            const elapsed = (Date.now() - start) / 1000;
            this.bonusTimeLeft = Math.max(0, this.bonusTimeMax - elapsed);
            const pct = (this.bonusTimeLeft / this.bonusTimeMax) * 100;
            this.elements.bonusTimerBar.style.width = pct + '%';
            this.elements.bonusTimerText.textContent = Math.ceil(this.bonusTimeLeft);
            if (pct < 30) this.elements.bonusTimerBar.classList.add('low');
            if (this.bonusTimeLeft <= 0) {
                clearInterval(this.bonusTimer);
                this.bonusTimeout = true;
                this._showBonusTimeout();
            }
        }, 100);
    }

    handleBonusClick(event) {
        if (this.bonusAnswered || this.bonusTimeout) return;
        this.bonusAnswered = true;
        clearInterval(this.bonusTimer);

        // Convert screen coords → SVG coords using getBoundingClientRect
        // (getScreenCTM returns null on Android when SVG was hidden at render time)
        const svg = document.getElementById('israelMapSVG');
        const rect = svg.getBoundingClientRect();
        const svgX = ((event.clientX - rect.left) / rect.width)  * MAP_CFG.svgW;
        const svgY = ((event.clientY - rect.top)  / rect.height) * MAP_CFG.svgH;

        // SVG coords → lat/lon
        const clickLon = MAP_CFG.lonMin + (svgX / MAP_CFG.svgW) * (MAP_CFG.lonMax - MAP_CFG.lonMin);
        const clickLat = MAP_CFG.latMax - (svgY / MAP_CFG.svgH) * (MAP_CFG.latMax - MAP_CFG.latMin);

        const [actualLat, actualLon] = GEO_CITIES[this.bonusCity];
        const dist = haversineKm(clickLat, clickLon, actualLat, actualLon);

        // Place player pin
        const playerPin = document.getElementById('bonusPlayerPin');
        playerPin.setAttribute('cx', svgX.toFixed(1));
        playerPin.setAttribute('cy', svgY.toFixed(1));
        playerPin.setAttribute('visibility', 'visible');

        // Place correct pin
        const { x: cx, y: cy } = geoProject(actualLat, actualLon);
        const correctPin = document.getElementById('bonusCorrectPin');
        correctPin.setAttribute('cx', cx);
        correctPin.setAttribute('cy', cy);
        correctPin.setAttribute('visibility', 'visible');

        // Distance line
        const line = document.getElementById('bonusDistLine');
        line.setAttribute('x1', svgX.toFixed(1)); line.setAttribute('y1', svgY.toFixed(1));
        line.setAttribute('x2', cx);              line.setAttribute('y2', cy);
        line.setAttribute('visibility', 'visible');

        // Score: proximity base × time factor
        const timeFactor = this.bonusTimeLeft / this.bonusTimeMax;
        let base = 0, cls = 'miss', emoji = '';
        if (dist <= 15)       { base = 25; cls = 'great'; emoji = '🎯'; }
        else if (dist <= 40)  { base = 20; cls = 'great'; emoji = '🌟'; }
        else if (dist <= 80)  { base = 12; cls = 'ok';    emoji = '👍'; }
        else if (dist <= 150) { base = 6;  cls = 'ok';    emoji = '😅'; }
        else                  { base = 0;  cls = 'miss';  emoji = '😔'; }

        const bonus = Math.max(base > 0 ? 1 : 0, Math.round(base * timeFactor));
        if (base > 0) this.bonusHits++;
        if (bonus > 0) {
            this.players[this.bonusPlayerIdx].score += bonus;
            this.renderScores();
        }

        const distText = `${Math.round(dist)} ק"מ מרחק`;
        this.elements.bonusResult.textContent = `${emoji} ${distText} — ${bonus > 0 ? '+' + bonus + ' נקודות' : 'ללא נקודות'}`;
        this.elements.bonusResult.className = `bonus-result ${cls}`;
        this.elements.bonusResult.hidden = false;
        this.elements.bonusNextBtn.hidden = false;
        this.elements.bonusNextBtn.textContent = (this.currentQNum >= this.totalQ) ? 'סיום משחק 🏁' : 'המשך ←';
        // Scroll overlay so the button is visible
        this.elements.bonusNextBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    _showBonusTimeout() {
        const [actualLat, actualLon] = GEO_CITIES[this.bonusCity];
        const { x: cx, y: cy } = geoProject(actualLat, actualLon);
        const correctPin = document.getElementById('bonusCorrectPin');
        correctPin.setAttribute('cx', cx);
        correctPin.setAttribute('cy', cy);
        correctPin.setAttribute('visibility', 'visible');

        this.elements.bonusResult.textContent = 'הזמן נגמר! ⏰ — ללא נקודות';
        this.elements.bonusResult.className = 'bonus-result timeout';
        this.elements.bonusResult.hidden = false;
        this.elements.bonusNextBtn.hidden = false;
        this.elements.bonusNextBtn.textContent = (this.currentQNum >= this.totalQ) ? 'סיום משחק 🏁' : 'המשך ←';
        this.elements.bonusNextBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    endBonusPhase() {
        clearInterval(this.bonusTimer);
        this.elements.bonusOverlay.hidden = true;
        if (this.currentQNum >= this.totalQ) {
            this.endGame();
        } else {
            this.nextQuestion();
        }
    }

    renderScores() {
        this.elements.scoresList.innerHTML = this.players.map((p, i) => `
            <li class="score-row ${i === this.currentPlayerIdx ? 'active' : ''}">
                <span class="player-name">${this.escape(p.name)}</span>
                <span>
                    ${p.streak >= 3 ? `<span class="player-streak">🔥${p.streak}</span>` : ''}
                    <span class="player-score">${p.score}</span>
                </span>
            </li>
        `).join('');
    }

    endGame() {
        clearInterval(this.timer);
        clearInterval(this.bonusTimer);
        this.elements.bonusOverlay.hidden = true;
        this.switchScreen('endScreen');

        // Sort players by score desc
        const ranked = [...this.players].sort((a, b) => b.score - a.score);
        const winner = ranked[0];

        if (this.players.length === 1) {
            const p = this.players[0];
            const accuracy = Math.round((p.correct / this.totalQ) * 100);
            this.elements.endTitle.textContent = accuracy >= 80 ? '🌟 מצוין!' : accuracy >= 50 ? '👍 כל הכבוד!' : '💪 נסה שוב!';
        } else {
            this.elements.endTitle.textContent = `🏆 ${this.escape(winner.name)} ניצח/ה!`;
        }

        this.elements.finalScores.innerHTML = ranked.map((p, i) => `
            <div class="final-score-row ${i === 0 && this.players.length > 1 ? 'winner' : ''}">
                <span><span class="rank">#${i + 1}</span>${this.escape(p.name)}</span>
                <span><strong>${p.score}</strong> נק' (${p.correct}/${this.totalQ})</span>
            </div>
        `).join('');

        this.elements.endStatCorrect.textContent = this.totalCorrect;
        this.elements.endStatCities.textContent = this.bonusHits > 0 ? this.bonusHits : '—';

        // Save & display leaderboard
        ranked.forEach(p => {
            this.saveToLeaderboard(this.difficulty, p.name, p.score);
        });
        this.renderEndLeaderboard();

        // Confetti!
        this.confetti.burst(150);
        setTimeout(() => this.confetti.burst(80), 600);
    }

    renderEndLeaderboard() {
        const lb = this.loadLeaderboard(this.difficulty);
        const heading = this.elements.leaderboardList.closest('.leaderboard-section')?.querySelector('h3');
        if (heading) heading.textContent = `🏆 שיאי רמת קושי “${this.difficulty}”`;
        if (lb.length === 0) {
            this.elements.leaderboardList.innerHTML = '<li>עדיין אין שיאים</li>';
            return;
        }
        this.elements.leaderboardList.innerHTML = lb.map((e, i) => {
            const date = new Date(e.date).toLocaleDateString('he-IL');
            return `<li>
                <span class="lb-rank">#${i + 1}</span>
                <span class="lb-name">${this.escape(e.name)}</span>
                <span class="lb-meta">${date}</span>
                <span class="lb-score">${e.score}</span>
            </li>`;
        }).join('');
    }

    leaderboardKey(diff) { return `independence-trivia-lb-${diff}`; }

    loadLeaderboard(diff) {
        try {
            const raw = localStorage.getItem(this.leaderboardKey(diff));
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    saveToLeaderboard(diff, name, score) {
        if (score <= 0) return;
        const lb = this.loadLeaderboard(diff);
        lb.push({ name, score, date: Date.now() });
        lb.sort((a, b) => b.score - a.score);
        const top5 = lb.slice(0, 5);
        try {
            localStorage.setItem(this.leaderboardKey(diff), JSON.stringify(top5));
        } catch (e) {
            console.warn('Could not save leaderboard:', e);
        }
    }

    resetToSetup() {
        this.confetti.stop();
        clearInterval(this.bonusTimer);
        this.elements.bonusOverlay.hidden = true;
        this.switchScreen('setupScreen');
        this.renderLeaderboardPreview();
    }

    switchScreen(name) {
        ['setupScreen', 'gameScreen', 'endScreen'].forEach(s => {
            this.elements[s].classList.toggle('active', s === name);
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
    window.game = new IndependenceTriviaGame();
});
