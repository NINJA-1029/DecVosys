@echo off
echo ========================================================
echo   Starting Decentralized Voting System (Single Window)
echo ========================================================
echo.
echo Please wait while the Blockchain, Backend, and Frontend boot up...
echo All logs will appear in this single terminal window.
echo.

:: We use npx concurrently to run all three distinct environments inside ONE single window.
npx concurrently --kill-others --names "CHAIN,API,UI" --prefix-colors "yellow,blue,green" "cd smart-contracts && npx hardhat node" "cd backend && node server.js" "cd frontend && npm run dev"

pause
