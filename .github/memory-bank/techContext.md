# Technical Context: dshohat.github.io

## Technology Stack

### Core Technologies
| Layer | Technology | Notes |
|-------|------------|-------|
| Markup | HTML5 | Semantic elements |
| Styling | CSS3 | Flexbox, Grid, Custom Properties |
| Logic | JavaScript ES6+ | Classes, async/await, fetch |
| Hosting | GitHub Pages | Static only |
| Fonts | Google Fonts CDN | Inter (EN), Heebo (HE) |

### No External Dependencies
- No npm packages
- No build process
- No CSS preprocessors
- No JavaScript frameworks

## Development Environment

### Local Server
```bash
# Windows batch file
start-server.bat

# Or directly
python -m http.server 8000
```

### Browser Requirements
- Modern browsers (Chrome, Firefox, Edge, Safari)
- ES6 support required
- CSS Grid support required

## File Conventions

### Naming
- HTML: `kebab-case.html` (e.g., `knight-chase.html`)
- JS: `script.js` or `camelCase.js`
- CSS: `style.css` or `kebab-case.css`
- Data: `*-data.json`

### Paths
All internal links use relative paths:
```html
<!-- From /Private/Games/Chess/ to Games gallery -->
<a href="../games.html">

<!-- From Games gallery to Private hub -->
<a href="../index.html">
```

## API Patterns

### Data Loading
```javascript
async function loadData() {
    const response = await fetch('data-file.json');
    const data = await response.json();
    renderContent(data);
}
```

### Local Storage (Games)
```javascript
// Save game state
localStorage.setItem('chess-game', JSON.stringify(state));

// Load game state
const saved = JSON.parse(localStorage.getItem('chess-game'));
```

### Full Undo Pattern (Backgammon)
```javascript
// Store complete game snapshots for undo across turns
this.fullHistory = []; // Array of complete state snapshots

saveSnapshot() {
    this.fullHistory.push({
        board: JSON.parse(JSON.stringify(this.board)),
        bar: { ...this.bar },
        home: { ...this.home },
        currentPlayer: this.currentPlayer,
        dice: [...this.dice],
        // ... all relevant state
    });
}

undoMove() {
    if (this.fullHistory.length > 0) {
        const snapshot = this.fullHistory.pop();
        // Restore all state from snapshot
        this.board = snapshot.board;
        this.bar = snapshot.bar;
        // ...
    }
}
```

### Selection Highlighting Pattern
When user must choose between multiple valid targets:
```javascript
// Set selection state
this.selectedPoint = 'bar'; // or a point number

// Calculate and highlight valid targets
const validPoints = this.getValidBarEntryPoints();
validPoints.forEach(point => {
    element.classList.add('valid-move');
});

// Handle click on highlighted target
handleClick(targetPoint) {
    if (this.selectedPoint !== null) {
        this.executeMove(this.selectedPoint, targetPoint);
        this.clearHighlights();
        this.selectedPoint = null;
    }
}
```

## Performance Considerations

### Optimizations Applied
- No framework overhead
- Inline critical CSS in some pages
- SVG for icons and favicon
- Lazy loading not needed (small page sizes)

### Load Order
1. HTML structure
2. CSS (blocking)
3. Fonts (async via Google CDN)
4. JavaScript (defer/end of body)
5. JSON data (fetch on DOMContentLoaded)

## Known Limitations

1. **No Server-Side**: Cannot process forms, authenticate users
2. **No Database**: All data in JSON files
3. **No Search Backend**: Client-side search only
4. **Media Files**: Must be committed to repo (size limits apply)
