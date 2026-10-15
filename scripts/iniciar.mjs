// Liga o CodeLens com um comando só:
//   1) instala as peças na primeira vez (npm install)
//   2) monta a tela se ela ainda não existe ou se você mudou algo em src/
//   3) liga o servidor e abre o navegador sozinho
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import http from "http";
import net from "net";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(ROOT);
const IS_WIN = process.platform === "win32";
let PORT = Number(process.env.PORT || 8080);
let URL_APP = `http://localhost:${PORT}`;

const say = (m) => console.log(`\n  ${m}`);
const fail = (m) => { console.error(`\n  ❌ ${m}\n`); process.exit(1); };

const [maj, min] = process.versions.node.split(".").map(Number);
if (maj < 20 || (maj === 20 && min < 11)) {
  fail(`Seu Node é a versão ${process.versions.node}. Precisa da 20 ou mais nova (de preferência a 22 "LTS").\n     Baixe em https://nodejs.org , instale e abra de novo.`);
}

function run(cmd, args) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: "inherit", shell: IS_WIN });
    p.on("close", (code) => resolve(code ?? 1));
  });
}

function newestMtime(dir) {
  let t = 0;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f); else t = Math.max(t, fs.statSync(f).mtimeMs);
    }
  };
  for (const d of [dir].flat()) if (fs.existsSync(d)) walk(d);
  return t;
}

function waitUp(ms = 60000) {
  const start = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      http.get(`${URL_APP}/api/healthz`, (r) => { r.resume(); resolve(r.statusCode === 200); })
        .on("error", () => (Date.now() - start > ms ? resolve(false) : setTimeout(tick, 700)));
    };
    tick();
  });
}

function openBrowser(url) {
  const c = IS_WIN ? ["cmd", ["/c", "start", "", url]]
    : process.platform === "darwin" ? ["open", [url]]
    : process.env.PREFIX?.includes("com.termux") ? ["termux-open-url", [url]]
    : ["xdg-open", [url]];
  try { spawn(c[0], c[1], { stdio: "ignore", detached: true }).unref(); } catch {}
}

// 1) Peças
const lockMark = path.join(ROOT, "node_modules", ".package-lock.json");
const needInstall = !fs.existsSync(path.join(ROOT, "node_modules", "vite")) ||
  !fs.existsSync(lockMark) || fs.statSync(path.join(ROOT, "package.json")).mtimeMs > fs.statSync(lockMark).mtimeMs;
if (needInstall) {
  say("📦 Instalando as peças (na primeira vez demora alguns minutos)…");
  const code = await run("npm", ["install", "--no-audit", "--no-fund"]);
  if (code !== 0) fail("A instalação falhou. Veja a mensagem vermelha acima (sem internet? antivírus bloqueando?).");
}

// 2) Tela
const distIndex = path.join(ROOT, "dist", "index.html");
const needBuild = !fs.existsSync(distIndex) ||
  newestMtime(["src", "public", "lib/api-client-react", "index.html"]) > fs.statSync(distIndex).mtimeMs;
if (needBuild) {
  say("🧱 Montando a tela…");
  const code = await run("npm", ["run", "build"]);
  if (code !== 0) fail("A montagem da tela falhou. Copie a mensagem vermelha acima e mande para a IA.");
}

// 3) Porta: escolhe sozinho uma porta livre (você não precisa entender de porta).
//    Se o programa JÁ estiver aberto (ficou ligado de ontem), só abre o navegador nele —
//    abrir dois ao mesmo tempo estragaria o banco.
function portaLivre(p) {
  return new Promise((r) => { const s = net.createServer(); s.once("error", () => r(false)); s.once("listening", () => s.close(() => r(true))); s.listen(p, "0.0.0.0"); });
}
function jaEstaAberto(p) {
  return new Promise((r) => {
    const q = http.get(`http://localhost:${p}/api/healthz`, (res) => { res.resume(); r(res.statusCode === 200 || res.statusCode === 401); });
    q.on("error", () => r(false)); q.setTimeout(1500, () => { q.destroy(); r(false); });
  });
}
if (await jaEstaAberto(PORT)) {
  say(`✅ o CodeLens já está aberto em ${URL_APP}. Abrindo o navegador nele.`);
  if (!process.env.NO_BROWSER) openBrowser(URL_APP);
  process.exit(0);
}
if (!(await portaLivre(PORT))) {
  const antes = PORT;
  const tentar = [...Array(20).keys()].map((i) => antes + 1 + i).concat([3000, 3001, 4000, 7000, 7777, 8000, 8090, 8888, 9000]);
  let achou = 0;
  for (const p of tentar) if (await portaLivre(p)) { achou = p; break; }
  if (!achou) achou = await new Promise((r) => { const s = net.createServer(); s.listen(0, "0.0.0.0", () => { const p = s.address().port; s.close(() => r(p)); }); });
  PORT = achou; URL_APP = `http://localhost:${PORT}`;
  say(`ℹ A porta ${antes} está ocupada por outro programa. Vou usar a ${PORT}.`);
}

// 4) Servidor
say(`🚀 Ligando o servidor em ${URL_APP} …`);
const server = spawn("npm", ["start"], { stdio: "inherit", shell: IS_WIN, env: { ...process.env, PORT: String(PORT), NODE_ENV: "production" } });
server.on("close", (code) => process.exit(code ?? 0));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { server.kill(sig); });

if (await waitUp()) {
  say(`🌐 Abrindo ${URL_APP} no navegador. Se não abrir sozinho, digite esse endereço.`);
  if (!process.env.NO_BROWSER) openBrowser(URL_APP);
} else {
  say("⚠ O servidor está demorando para responder. Veja se apareceu alguma mensagem vermelha acima.");
}
