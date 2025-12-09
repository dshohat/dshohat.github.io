# System Patterns: dshohat.github.io

## Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Pages (Static Host)                │
├─────────────────────────────────────────────────────────────┤
│  /index.html          │  /Private/index.html                │
│  Main Portfolio       │  Private Projects Hub               │
│                       │                                      │
│                       ├─────────────────────────────────────┤
│                       │  /Private/Games/                    │
│                       │    ├── games.html (gallery)         │
│                       │    ├── Chess/chess.html             │
│                       │    ├── KnightChase/knight-chase.html│
│                       │    ├── FourInARow/four-in-a-row.html│
│                       │    └── Backgammon/backgammon.html   │
│                       ├─────────────────────────────────────┤
│                       │  /Private/Podcasts/                 │
│                       │    └── podcasts.html + audio files  │
│                       ├─────────────────────────────────────┤
│                       │  /Private/Recepies/                 │
│                       │    └── recipes.html + .txt files    │
└───────────────────────┴─────────────────────────────────────┘
```

## Key Technical Decisions

### 1. No Build Tools
- **Decision**: Pure HTML/CSS/JS without frameworks
- **Rationale**: Simplicity, no dependencies, instant deployment
- **Trade-off**: More manual work for complex features

### 2. JSON Data Storage
- **Pattern**: `*-data.json` files store metadata
- **Files**: `games-data.json`, `recipes-data.json`, `podcasts-data.json`
- **Loading**: `fetch()` on page load, render with template literals

### 3. Component-Based JS (Without Framework)
- **Pattern**: ES6 Classes for major components
- **Examples**: `ChessGame`, `KnightChaseGame`, `SearchComponent`
- **State**: Instance properties, no external state management

### 4. Relative Path Navigation
```
Root (/)           → favicon.svg
Private (/Private) → favicon.svg (own copy)
Games (/Private/Games) → ../favicon.svg
Chess (/Private/Games/Chess) → ../../favicon.svg
```

## Design Patterns

### Card Pattern
Used for: games, recipes, podcasts, projects
```html
<a href="[link]" class="[type]-card">
  <span class="[type]-icon">[emoji]</span>
  <h3 class="[type]-title">[Title]</h3>
  <p class="[type]-description">[Description]</p>
  <div class="[type]-tags">...</div>
</a>
```

### Gallery Pattern
Used for: Games, Recipes, Podcasts listing pages
- JSON data file → fetch() → render grid → click to navigate

### Game Pattern
Structure for each game:
```
GameName/
├── game-name.html    # Entry point
├── script.js         # GameClass with all logic
└── style.css         # Game-specific styles
```

### Game Class Pattern (ES6)
```javascript
class GameNameGame {
    constructor() {
        this.loadState();      // Load from localStorage
        this.renderBoard();    // Initial render
        this.updateDisplay();  // Update UI elements
        this.setupEventListeners();
    }
    
    loadState() { /* localStorage.getItem('gameName-game') */ }
    saveState() { /* localStorage.setItem('gameName-game', ...) */ }
    
    // Game logic methods...
    
    showWinModal(winner) { /* Modal announcement */ }
    resetGame() { /* New game, keep scores */ }
    resetMatch() { /* New match, reset scores */ }
}

let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new GameNameGame();
});
```

### Game localStorage Keys
| Game | Game State Key | Scores Key |
|------|----------------|------------|
| Four in a Row | `fourInARow-game` | `fourInARow-scores` |
| Backgammon | `backgammon-game` | `backgammon-matchScore` |

## Styling Conventions

### CSS Structure
```css
/* 1. Reset & Base */
* { margin: 0; padding: 0; box-sizing: border-box; }

/* 2. Header/Nav */
.header { ... }
.nav { ... }

/* 3. Hero Section */
.hero { background: linear-gradient(...); }

/* 4. Content Sections */
.section { padding: 4rem 0; }

/* 5. Cards/Components */
.card { ... }

/* 6. Footer */
.footer { ... }

/* 7. Responsive */
@media (max-width: 768px) { ... }
```

### Color Usage
| Context | Color |
|---------|-------|
| Links, Branding | `#2563eb` |
| Hero Background | `linear-gradient(135deg, #667eea, #764ba2)` |
| Success/Active | `#16a34a` |
| Warning | `#d97706` |
| Text | `#333`, `#64748b` |
