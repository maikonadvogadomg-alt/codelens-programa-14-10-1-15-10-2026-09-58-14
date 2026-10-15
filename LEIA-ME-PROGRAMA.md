# CodeLens como programa do Windows (.exe)

Abre numa janela própria. Sem .bat, sem janela preta, sem navegador e sem instalar o Node.

## Como gerar (uma vez)
1. Mande esta pasta para um repositório no GitHub (Mini SK → 🐙 GitHub).
2. No GitHub: aba **Actions** → **Programa .exe para Windows** → **Run workflow**.
3. Espere uns 10 a 15 minutos. Antes de entregar, o GitHub liga o programa e confere se ele responde.
   - Verde ✔: abra a execução → **Artifacts** → baixe **CodeLens-Windows**.
   - Vermelho ✖: abra o passo vermelho e mande um print.

## No computador
Dentro do zip baixado vêm dois arquivos (use um só):
- **CodeLens-Instalar.exe**: instala e cria o ícone na área de trabalho. É o recomendado.
- **CodeLens-sem-instalar.exe**: abre direto, sem instalar (demora um pouco mais para abrir).

Se o Windows avisar "protegeu o computador": **Mais informações → Executar assim mesmo**.

## Seus dados
Ficam em **Documentos\CodeLens** (pasta *dados*). Para backup, copie essa pasta.
Chaves de IA: pode pôr um arquivo **.env** nessa mesma pasta (veja o .env.exemplo), ou usar as configurações do próprio app.
Se der erro, o motivo fica em **Documentos\CodeLens\registro.txt**. Mande esse arquivo.
