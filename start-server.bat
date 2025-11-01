@echo off
REM Start local web server for dshohat.github.io

echo Starting local web server...
echo.
echo Server will run at: http://localhost:8000
echo.
echo Pages available:
echo   - Main Site: http://localhost:8000/index.html
echo   - Private Projects: http://localhost:8000/Private/index.html
echo   - Recipes: http://localhost:8000/Private/Recepies/recipes.html
echo   - Podcasts: http://localhost:8000/Private/Podcasts/podcasts.html
echo   - Chess: http://localhost:8000/Private/Chess/chess.html
echo.
echo Press Ctrl+C to stop the server
echo.

REM Wait a moment for the message to be readable
timeout /t 2 /nobreak >nul

REM Open the main page in default browser
start http://localhost:8000/index.html

REM Start the Python HTTP server
python -m http.server 8000
