@echo off
title Famamennou Frontend (port 3000)
cd /d "%~dp0"
echo Starting frontend on http://localhost:3000 ...
set PORT=3000
npm start
pause
