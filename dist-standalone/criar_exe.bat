@echo off
title Criar .exe — Servidor Local
color 0A
echo.
echo  ========================================
echo   Criando executavel .exe com PyInstaller
echo  ========================================
echo.

:: Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ERRO: Python nao encontrado!
    echo Instale em: https://python.org  (marque "Add to PATH")
    pause
    exit /b
)

echo Instalando PyInstaller...
pip install pyinstaller --quiet

echo.
echo Gerando .exe (aguarde ~30 segundos)...
echo.

pyinstaller --onefile --windowed --name "MeuApp" ^
    --add-data "app;app" ^
    servidor_local.py

if errorlevel 1 (
    color 0C
    echo.
    echo ERRO ao gerar o .exe. Veja a mensagem acima.
) else (
    color 0A
    echo.
    echo SUCESSO! O arquivo MeuApp.exe esta em: dist\MeuApp.exe
    echo.
    echo Para distribuir, copie MeuApp.exe + a pasta "app" juntos.
)

echo.
pause
