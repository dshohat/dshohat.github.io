# Drory Shohat - Personal Website

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://dshohat.github.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A personal portfolio and project showcase website for **Drory Shohat**, an AI & Hardware Engineer at Intel. This site features a professional portfolio alongside a private section containing personal projects, games, recipes, and family podcasts.

## 🌐 Live Site

**Main Site:** [https://dshohat.github.io](https://dshohat.github.io)

---

## 📁 Project Structure

```
dshohat.github.io/
├── index.html              # Main portfolio page
├── styles.css              # Main site styles
├── script.js               # Main site JavaScript
├── search-index.json       # Global search index
├── start-server.bat        # Local development server launcher
├── favicon.svg             # Site favicon
├── Me*.jpg/png/webp        # Profile images
│
├── css/
│   └── search.css          # Search component styles
│
├── js/
│   └── search.js           # Global search functionality
│
├── misc/                   # Miscellaneous assets
│
└── Private/                # Private projects section
    ├── index.html          # Private projects hub
    ├── favicon.svg         # Private section favicon
    │
    ├── Games/              # Interactive games
    │   ├── games.html      # Games gallery page
    │   ├── games-data.json # Games metadata
    │   │
    │   ├── Chess/          # Chess game
    │   │   ├── chess.html
    │   │   ├── script.js
    │   │   └── style.css
    │   │
    │   ├── KnightChase/    # Knight Chase game
    │   │   ├── knight-chase.html
    │   │   ├── script.js
    │   │   └── style.css
    │   │
    │   ├── FourInARow/     # Four in a Row (Connect 4)
    │   │   ├── four-in-a-row.html
    │   │   ├── script.js
    │   │   └── style.css
    │   │
    │   └── Backgammon/     # Backgammon game
    │       ├── backgammon.html
    │       ├── script.js
    │       └── style.css
    │
    ├── Podcasts/           # Family podcast series
    │   ├── podcasts.html
    │   ├── podcasts-data.json
    │   └── Shlomo/         # Audio files
    │
    └── Recepies/           # Family recipes (Hebrew)
        ├── recipes.html
        ├── recipes-data.json
        └── *.txt           # Recipe files
```

---

## 🎯 Features

### Main Portfolio (`/index.html`)
- **Hero Section**: Professional introduction as AI & Hardware Engineer
- **About Me**: Background, experience highlights, and social links
- **Experience**: Professional history at Intel and previous roles
- **Skills**: Technical expertise visualization
- **Contact**: Communication channels

### Private Projects (`/Private/`)

#### 🎮 My Games (`/Private/Games/`)
Interactive browser-based games with modern UI:

| Game | Description | Features |
|------|-------------|----------|
| **Chess with a Friend** | Full chess implementation for two players | Move validation, castling, en passant, import/export, undo |
| **Knight Chase** | Strategic knight-vs-knight on shrinking board | Blocking mechanics, multiple win conditions, statistics |
| **Four in a Row** | Classic Connect Four game | 7×6 grid, win detection, score tracking, persistence |
| **Backgammon** | Classic dice-based race game | Full rules, gammon scoring (2 pts), best of 5 matches, persistence |

#### 🎙️ My Podcasts (`/Private/Podcasts/`)
Family podcast series in Hebrew featuring:
- **"שלמה שוחט: דברים פרטיים לגמרי"** (Shlomo Shohat: Completely Private Things)
- Intimate conversations with 92-year-old family patriarch
- Audio player with episode navigation

#### 🍳 My Recipes (`/Private/Recepies/`)
Collection of family recipes in Hebrew:
- Perfect Rice (אורז מושלם)
- Yom Kippur Chicken (עוף של יום כיפור)
- Festive Nile Perch (דג נסיכה חגיגי)
- Perfect Baked Potatoes (תפוחי אדמה אפויים)

### 🔍 Search System
- Global site-wide search functionality
- Supports Hebrew and English content
- JSON-based search index

---

## 🛠️ Technologies

| Category | Technologies |
|----------|-------------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **Fonts** | Google Fonts (Inter, Heebo) |
| **Design** | Responsive, Mobile-first, CSS Grid/Flexbox |
| **Hosting** | GitHub Pages |
| **Icons** | SVG, Unicode Emoji |

---

## 🚀 Local Development

### Quick Start
```bash
# Clone the repository
git clone https://github.com/dshohat/dshohat.github.io.git
cd dshohat.github.io

# Start local server (Windows)
start-server.bat

# Or use Python directly
python -m http.server 8000
```

### Access Points
| Page | URL |
|------|-----|
| Main Site | http://localhost:8000/index.html |
| Private Projects | http://localhost:8000/Private/index.html |
| Games | http://localhost:8000/Private/Games/games.html |
| Recipes | http://localhost:8000/Private/Recepies/recipes.html |
| Podcasts | http://localhost:8000/Private/Podcasts/podcasts.html |

---

## 🎨 Design System

### Color Palette
| Purpose | Color |
|---------|-------|
| Primary Blue | `#2563eb` |
| Gradient Start | `#667eea` |
| Gradient End | `#764ba2` |
| Text Primary | `#333` |
| Background | `#fff` / `#f8fafc` |

### Typography
- **Primary Font**: Inter (English content)
- **Hebrew Font**: Heebo (Hebrew content)

### Responsive Breakpoints
- Mobile: `< 480px`
- Tablet: `< 768px`
- Desktop: `> 768px`

---

## 📝 Adding New Content

### Adding a New Game
1. Create folder in `Private/Games/YourGame/`
2. Add `your-game.html`, `script.js`, `style.css`
3. Update `Private/Games/games-data.json` with game metadata
4. Update `search-index.json` if searchable

### Adding a New Recipe
1. Create `.txt` file in `Private/Recepies/`
2. Add entry to `recipes-data.json`
3. Update `search-index.json`

### Adding a Podcast Episode
1. Add `.mp3` file to appropriate folder in `Private/Podcasts/`
2. Update `podcasts-data.json` with episode metadata

---

## 🔗 Links

- **Website**: [dshohat.github.io](https://dshohat.github.io)
- **GitHub**: [github.com/dshohat](https://github.com/dshohat)
- **LinkedIn**: [linkedin.com/in/drorys](https://linkedin.com/in/drorys)
- **YouTube**: [youtube.com/@drory72](https://youtube.com/@drory72)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Drory Shohat**  
AI & Hardware Engineer at Intel Israel  
*Building the future of AI in hardware with innovative solutions*

---

*Last updated: December 2025*
