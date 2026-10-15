import "./lib/gemini-ponte"; // chave nova do Gemini (AQ.): precisa vir antes de tudo
import app from "./app";
import { logger } from "./lib/logger";

// Antes: sem PORT ele "desligava sozinho". Agora usa 8080 se ninguém disser outra.
const port = Number(process.env["PORT"] || 8080);

let tentativas = 0;
const HOST = process.env["HOST"]; // no programa (.exe) é só este computador
const server = HOST ? app.listen(port, HOST) : app.listen(port);
server.on("listening", () => {
  const a = server.address() as { port: number } | null;
  const p = a?.port ?? port;
  logger.info({ port: p }, "Servidor ligado");
  console.log(`\n  ✅ CodeLens ligado em  http://localhost:${p}\n  (deixe esta janela aberta; para desligar, aperte Ctrl+C)\n`);
});
// Porta ocupada? Tenta a próxima sozinho (você não precisa mexer em porta).
server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE" && tentativas < 20) {
    tentativas++;
    console.log(`  ℹ A porta ${port + tentativas - 1} está ocupada, tentando a ${port + tentativas}…`);
    setTimeout(() => (HOST ? server.listen(port + tentativas, HOST) : server.listen(port + tentativas)), 200);
    return;
  }
  console.error(err);
  process.exit(1);
});
