# GitHub Copilot Instructions for dshohat.github.io

## Project Overview

This is a personal portfolio and project showcase website for Drory Shohat, an AI & Hardware Engineer. The site is hosted on GitHub Pages and consists of:

1. **Main Portfolio** (`/index.html`) - Professional portfolio showcasing experience and skills
2. **Private Projects** (`/Private/`) - Personal projects including games, recipes, and podcasts

## Technology Stack

- **Pure HTML5, CSS3, JavaScript (ES6+)** - No frameworks or build tools
- **Google Fonts**: Inter (English), Heebo (Hebrew)
- **GitHub Pages** for hosting
- **JSON files** for data storage (no backend)

## Code Style Guidelines

### HTML
- Use semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`)
- Include proper meta tags for viewport and charset
- Use descriptive class names following BEM-like conventions
- Always include `alt` attributes for images
- Reference favicon with: `<link rel="icon" type="image/svg+xml" href="[path]/favicon.svg">`

### CSS
- Use CSS custom properties (variables) for colors when possible
- Mobile-first responsive design with media queries
- Use Flexbox and CSS Grid for layouts
- Include smooth transitions for interactive elements
- Standard breakpoints: 480px, 768px, 1200px

### JavaScript
- Use ES6+ features (classes, arrow functions, template literals, async/await)
- Organize code into classes for major components (e.g., `ChessGame`, `KnightChaseGame`)
- Use `addEventListener` instead of inline event handlers where possible
- Store data in JSON files, load with `fetch()`

## Design System

### Colors
```css
--primary-blue: #2563eb;
--gradient-start: #667eea;
--gradient-end: #764ba2;
--text-primary: #333;
--text-secondary: #64748b;
--background-light: #f8fafc;
--background-white: #fff;
```

### Common Patterns

**Hero gradient:**
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

**Card shadow:**
```css
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
```

**Hover effect:**
```css
transition: all 0.3s ease;
transform: translateY(-5px);
box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
```

## File Organization

### Navigation Patterns
- Main site links to Private via `/Private/index.html`
- Private index links to sub-projects (Games, Podcasts, Recipes)
- All pages have consistent header with back navigation
- Use relative paths for internal links

### Favicon Paths
- Root level: `href="favicon.svg"`
- Private level: `href="favicon.svg"` (has its own)
- Games level: `href="../favicon.svg"`
- Individual games: `href="../../favicon.svg"`

### Data Files
- Games metadata: `/Private/Games/games-data.json`
- Recipes metadata: `/Private/Recepies/recipes-data.json`
- Podcasts metadata: `/Private/Podcasts/podcasts-data.json`
- Search index: `/search-index.json`

## Language Support

### Hebrew Content (RTL)
- Use `<html lang="he" dir="rtl">` for Hebrew pages
- Use Heebo font for Hebrew text
- Recipes and Podcasts sections are primarily in Hebrew

### English Content (LTR)
- Use `<html lang="en">` for English pages
- Use Inter font for English text
- Main portfolio and Games sections are in English

## Adding New Features

### New Game
1. Create folder: `/Private/Games/GameName/`
2. Required files: `game-name.html`, `script.js`, `style.css`
3. Add entry to `games-data.json`
4. Follow existing game structure (Chess, KnightChase)

### New Recipe
1. Create `.txt` file in `/Private/Recepies/`
2. Add entry to `recipes-data.json`
3. Content in Hebrew

### New Podcast Episode
1. Add `.mp3` to appropriate series folder
2. Update `podcasts-data.json` with episode data

## Common Components

### Standard Header
```html
<header class="header">
    <nav class="nav">
        <div class="nav-brand">
            <a href="[parent]/index.html" style="text-decoration: none; color: inherit;">
                <h1>Drory Shohat</h1>
            </a>
        </div>
        <ul class="nav-links">
            <li><a href="[back-link]">← Back</a></li>
        </ul>
    </nav>
</header>
```

### Project Card
```html
<a href="[link]" class="project-card">
    <span class="project-icon">[emoji]</span>
    <h3 class="project-title">[Title]</h3>
    <p class="project-description">[Description]</p>
    <div class="project-tags">
        <span class="project-tag">[Tag]</span>
    </div>
    <span class="project-status status-active">Active</span>
</a>
```

## Testing

- Use `start-server.bat` or `python -m http.server 8000` for local testing
- Test on multiple browsers (Chrome, Firefox, Edge)
- Verify responsive design at different viewport sizes
- Check all navigation links work correctly

## Important Notes

1. **No build process** - Files are served directly, no compilation needed
2. **No external dependencies** - Pure vanilla HTML/CSS/JS (except Google Fonts CDN)
3. **Static hosting** - No server-side code, all data in JSON files
4. **Privacy** - The "Private" section is just a naming convention, not access-controlled
