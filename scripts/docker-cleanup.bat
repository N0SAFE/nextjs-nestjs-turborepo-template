@echo off
REM Docker cleanup script for Windows
REM Run this regularly to prevent Docker storage bloat

echo Starting Docker cleanup...
echo.

REM Stop all containers
echo [1/6] Stopping all containers...
docker stop $(docker ps -aq) 2>nul
echo.

REM Remove unused containers
echo [2/6] Removing unused containers...
docker container prune -f
echo.

REM Remove unused images
echo [3/6] Removing unused images...
docker image prune -f
echo.

REM Remove unused networks
echo [4/6] Removing unused networks...
docker network prune -f
echo.

REM Remove unused volumes (CAUTION: This removes database data)
echo [5/6] Removing unused volumes...
set /p CONFIRM_VOLUMES="Do you want to remove unused volumes? This will delete database data! (y/N): "
if /i "%CONFIRM_VOLUMES%"=="y" (
    docker volume prune -f
) else (
    echo Skipping volume cleanup...
)
echo.

REM Remove build cache
echo [6/6] Removing build cache...
docker builder prune -f
echo.

echo Docker cleanup completed!
echo.
echo Current Docker usage:
docker system df
