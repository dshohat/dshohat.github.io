/* ============================================================
   Independence Trivia — Game Logic
   ============================================================ */

// ----- Israel cities map (stylized SVG outline + city dots) -----
const ISRAEL_CITIES = [
    { name: 'מטולה',       cx: 232, cy: 35,  labelDx: 8,  labelDy: 4 },
    { name: 'קריית שמונה', cx: 222, cy: 70,  labelDx: 8,  labelDy: 4 },
    { name: 'צפת',         cx: 235, cy: 110, labelDx: 8,  labelDy: 4 },
    { name: 'עכו',         cx: 165, cy: 130, labelDx: -28, labelDy: 4 },
    { name: 'חיפה',        cx: 158, cy: 160, labelDx: -28, labelDy: 4 },
    { name: 'נצרת',        cx: 220, cy: 175, labelDx: 8,  labelDy: 4 },
    { name: 'טבריה',       cx: 268, cy: 155, labelDx: 8,  labelDy: 4 },
    { name: 'נתניה',       cx: 130, cy: 220, labelDx: -30, labelDy: 4 },
    { name: 'תל אביב',     cx: 118, cy: 270, labelDx: -42, labelDy: 4 },
    { name: 'ירושלים',     cx: 200, cy: 305, labelDx: 8,  labelDy: 4 },
    { name: 'אשדוד',       cx: 110, cy: 320, labelDx: -34, labelDy: 4 },
    { name: 'אשקלון',      cx: 100, cy: 360, labelDx: -38, labelDy: 4 },
    { name: 'באר שבע',     cx: 165, cy: 410, labelDx: -42, labelDy: 4 },
    { name: 'מצפה רמון',   cx: 175, cy: 540, labelDx: -55, labelDy: 4 },
    { name: 'אילת',        cx: 195, cy: 720, labelDx: 8,  labelDy: 4 },
    // bonus locations referenced by some questions
    { name: 'פתח תקווה',   cx: 150, cy: 268, labelDx: 8,  labelDy: 4 }
];

// Stylized Israel outline path (rough but recognizable)
const ISRAEL_PATH = `M 220 20
    L 240 30 L 260 50 L 290 80 L 290 120 L 260 145 L 270 170
    L 250 200 L 220 215 L 200 235 L 175 240 L 150 235 L 120 240
    L 95 260 L 80 295 L 90 330 L 85 370 L 90 405 L 110 425
    L 130 445 L 145 475 L 155 510 L 165 545 L 170 580 L 175 615
    L 180 650 L 185 680 L 190 705 L 195 725 L 200 740 L 205 730
    L 210 700 L 215 660 L 220 615 L 230 565 L 240 510 L 250 455
    L 255 410 L 250 370 L 245 330 L 250 290 L 245 255 L 230 230
    L 235 200 L 250 175 L 270 150 L 280 120 L 270 90 L 250 60
    L 235 35 Z`;

function buildIsraelMapSVG() {
    const dots = ISRAEL_CITIES.map(c => `
        <g class="city-group" data-city="${c.name}">
            <circle class="city-dot" cx="${c.cx}" cy="${c.cy}" r="4.5"/>
            <text class="city-label" x="${c.cx + c.labelDx}" y="${c.cy + c.labelDy}">${c.name}</text>
        </g>
    `).join('');

    return `
    <svg viewBox="0 0 360 760" xmlns="http://www.w3.org/2000/svg" aria-label="מפת ישראל">
        <path class="israel-outline" d="${ISRAEL_PATH}"/>
        ${dots}
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
        this.litCities = new Set();
        this.totalCorrect = 0;
        this.confetti = null;

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
            mapContainer: document.getElementById('mapContainer'),
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
        this.elements.mapContainer.innerHTML = buildIsraelMapSVG();
        this.confetti = new Confetti(this.elements.confettiCanvas);
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
        this.elements.quitBtn.addEventListener('click', () => {
            if (confirm('לסיים את המשחק?')) this.endGame();
        });
        this.elements.playAgainBtn.addEventListener('click', () => this.resetToSetup());
        document.querySelectorAll('input[name="difficulty"]').forEach(r => {
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
        const next = Math.max(1, Math.min(4, this.playerCount + delta));
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
        const diff = document.querySelector('input[name="difficulty"]:checked').value;
        const lb = this.loadLeaderboard(diff);
        if (lb.length === 0) {
            this.elements.leaderboardPreview.classList.remove('visible');
            return;
        }
        this.elements.leaderboardPreview.classList.add('visible');
        this.elements.leaderboardPreview.innerHTML = `
            <h3>🏆 שיאי ${diff} — טופ 5</h3>
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

        this.difficulty = document.querySelector('input[name="difficulty"]:checked').value;
        this.totalQ = parseInt(document.querySelector('input[name="questionCount"]:checked').value);

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

        // Time per question
        const timeMap = { 'קל': 15, 'בינוני': 12, 'קשה': 8, 'מעורב': 12 };
        this.timeMax = timeMap[this.difficulty];

        this.currentQNum = 0;
        this.currentPlayerIdx = 0;
        this.litCities = new Set();
        this.totalCorrect = 0;

        this.switchScreen('gameScreen');
        this.renderScores();
        this.resetMap();
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
        this.timeLeft = this.timeMax;
        this.elements.timerBar.style.width = '100%';
        this.elements.timerBar.classList.remove('low');
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
            const timeBonus = Math.ceil(this.timeLeft);
            const points = 10 * diffMult + timeBonus;
            player.score += points;
            player.correct++;
            player.streak++;
            if (player.streak > player.bestStreak) player.bestStreak = player.streak;
            this.totalCorrect++;

            // Light city
            if (this.currentQ.cityHint) this.litCity(this.currentQ.cityHint);

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
        this.elements.nextBtn.hidden = false;
        this.elements.nextBtn.textContent = (this.currentQNum >= this.totalQ) ? 'סיום משחק 🏁' : 'השאלה הבאה ←';

        this.renderScores();

        // Rotate to next player
        this.currentPlayerIdx = (this.currentPlayerIdx + 1) % this.players.length;
    }

    litCity(cityName) {
        if (this.litCities.has(cityName)) return;
        this.litCities.add(cityName);
        const grp = this.elements.mapContainer.querySelector(`.city-group[data-city="${cityName}"]`);
        if (grp) {
            grp.querySelector('.city-dot').classList.add('lit');
            grp.querySelector('.city-label').classList.add('lit');
        }
    }

    resetMap() {
        this.elements.mapContainer.querySelectorAll('.city-dot.lit').forEach(d => d.classList.remove('lit'));
        this.elements.mapContainer.querySelectorAll('.city-label.lit').forEach(l => l.classList.remove('lit'));
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
        this.elements.endStatCities.textContent = this.litCities.size;

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
