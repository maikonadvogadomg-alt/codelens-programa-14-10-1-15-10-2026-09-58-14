/* =========================================================================
   Programa do Windows (Electron) — abre o app numa janela própria.
   Sem .bat, sem janela preta, sem navegador e sem instalar o Node:
   o Electron já traz o Node dentro dele e liga o servidor aqui mesmo.
   Seus dados ficam em  Documentos\CodeLens  (copie essa pasta para fazer backup).
   ========================================================================= */
const { app, BrowserWindow, shell, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');
const { pathToFileURL } = require('url');

const NOME = 'CodeLens';
const PASTA = 'CodeLens';
const TESTE = '/'; // endereço que responde quando o servidor está pronto
const SO_TESTAR = process.env.TESTE_SAIR === '1'; // usado pelo GitHub para conferir antes de entregar

// ── só um aberto por vez (dois ao mesmo tempo estragariam o banco) ─────────
if (!SO_TESTAR && !app.requestSingleInstanceLock()) { app.quit(); return; }

// ── pasta dos dados + registro (para mandar print/arquivo se der erro) ──────
const CASA = process.env.DADOS_EM || path.join(app.getPath('documents'), PASTA);
fs.mkdirSync(CASA, { recursive: true });
const REGISTRO = path.join(CASA, 'registro.txt');
try { if (fs.existsSync(REGISTRO) && fs.statSync(REGISTRO).size > 2e6) fs.renameSync(REGISTRO, REGISTRO + '.antigo'); } catch {}
const escrever = (tipo, args) => { try { fs.appendFileSync(REGISTRO, new Date().toLocaleString('pt-BR') + ' [' + tipo + '] ' + args.map((a) => (a instanceof Error ? a.stack : typeof a === 'string' ? a : JSON.stringify(a))).join(' ') + '\n'); } catch {} };
for (const t of ['log', 'info', 'warn', 'error']) { const orig = console[t].bind(console); console[t] = (...a) => { escrever(t, a); orig(...a); }; }
process.on('uncaughtException', (e) => console.error('ERRO:', e));
process.on('unhandledRejection', (e) => console.error('ERRO (promessa):', e));

// o servidor procura .env e a pasta "dados" a partir daqui
process.chdir(CASA);
process.env.DATA_DIR = path.join(CASA, 'dados');
process.env.NODE_ENV = 'production';
process.env.HOST = '127.0.0.1'; // só este computador (e o Windows não pergunta do firewall)

function portaLivre() {
  return new Promise((ok, falha) => { const s = net.createServer(); s.once('error', falha); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); });
}
function esperar(url, ms) {
  const fim = Date.now() + ms;
  return new Promise((ok) => {
    const tentar = () => {
      const q = http.get(url, (r) => { r.resume(); ok(r.statusCode < 500); });
      q.on('error', () => (Date.now() > fim ? ok(false) : setTimeout(tentar, 400)));
      q.setTimeout(3000, () => q.destroy());
    };
    tentar();
  });
}
const pagina = (titulo, texto) => 'data:text/html;charset=utf-8,' + encodeURIComponent(
  '<!doctype html><meta charset="utf-8"><body style="font:18px/1.6 system-ui,sans-serif;background:#f4f2ea;color:#1f2230;display:grid;place-items:center;height:100vh;margin:0;text-align:center;padding:20px">' +
  '<div><h1 style="font-size:26px">' + titulo + '</h1><p>' + texto + '</p></div></body>');

let janela = null;
async function ligar() {
  const porta = await portaLivre();
  process.env.PORT = String(porta);
  const base = 'http://127.0.0.1:' + porta;
  console.log('Ligando ' + NOME + ' em ' + base + ' · dados em ' + CASA);
  await import(pathToFileURL(path.join(__dirname, '..', 'dist-server', 'index.mjs')).href);
  const pronto = await esperar(base + TESTE, 90000);
  return { base, pronto };
}

app.whenReady().then(async () => {
  if (SO_TESTAR) {
    try { const { base, pronto } = await ligar(); console.log(pronto ? 'TESTE OK ' + base : 'TESTE FALHOU'); app.exit(pronto ? 0 : 1); }
    catch (e) { console.error(e); app.exit(1); }
    return;
  }
  // microfone (ditado por voz) e área de transferência liberados
  session.defaultSession.setPermissionRequestHandler((_wc, perm, cb) => cb(['media', 'clipboard-read', 'clipboard-sanitized-write', 'notifications', 'fullscreen'].includes(perm)));
  janela = new BrowserWindow({ width: 1280, height: 860, title: NOME, autoHideMenuBar: true, show: true, webPreferences: { contextIsolation: true, spellcheck: true } });
  janela.loadURL(pagina('⏳ Ligando o ' + NOME + '…', 'Na primeira vez pode levar até um minuto.'));
  try {
    const { base, pronto } = await ligar();
    if (!pronto) throw new Error('O servidor não respondeu a tempo.');
    // links de fora abrem no navegador; janelas do próprio app (imprimir, prévia) abrem aqui
    janela.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith(base) || url === 'about:blank' || url.startsWith('blob:')) return { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true } };
      shell.openExternal(url); return { action: 'deny' };
    });
    janela.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(base)) { e.preventDefault(); shell.openExternal(url); } });
    await janela.loadURL(base + '/');
  } catch (e) {
    console.error(e);
    janela.loadURL(pagina('❌ O ' + NOME + ' não ligou', 'O motivo foi guardado no arquivo<br><b>' + REGISTRO.replace(/</g, '&lt;') + '</b><br>Mande esse arquivo (ou um print dele) para a IA.'));
  }
});
app.on('second-instance', () => { if (janela) { if (janela.isMinimized()) janela.restore(); janela.focus(); } });
app.on('window-all-closed', () => app.quit());
