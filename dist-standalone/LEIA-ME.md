# Servidor Local — Como Usar

## O que é isso?
Um servidor Python que abre qualquer projeto web como se fosse um app.
Igual ao que a Replit fez, mas para você usar em qualquer projeto.

---

## OPÇÃO 1: Rodar diretamente (sem instalar)

1. Copie `servidor_local.py` para a pasta do seu projeto
2. Renomeie a pasta com os arquivos para `app`
   (pode ser `dist-apk`, `dist-standalone`, ou `dist`)
3. Clique duas vezes em `servidor_local.py`
4. O navegador vai abrir automaticamente

---

## OPÇÃO 2: Gerar .exe (sem precisar de Python para rodar)

1. Coloque `servidor_local.py` e `criar_exe.bat` na mesma pasta
2. Coloque a pasta `app` com seu projeto ao lado
3. Clique duas vezes em `criar_exe.bat`
4. O .exe estará em `dist\MeuApp.exe`

---

## Como usar com o CodeLens

1. Copie `vite.config.apk.ts` para a pasta do CodeLens
2. No `package.json`, adicione:
   ```json
   "build:apk": "vite build --config vite.config.apk.ts"
   ```
3. Rode: `npm run build:apk`
4. A pasta `dist-apk` é gerada — renomeie para `app`
5. Use o `servidor_local.py` ou gere o `.exe`

---

## Estrutura de pastas
```
servidor_local.py
criar_exe.bat
app/
  index.html
  assets/
    app.js
    app.css
```
