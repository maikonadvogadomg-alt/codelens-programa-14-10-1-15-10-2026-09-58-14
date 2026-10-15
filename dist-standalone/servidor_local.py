#!/usr/bin/env python3
"""
Servidor local universal — funciona com qualquer projeto web.
Coloque este arquivo ao lado da pasta "app" (ou "dist-apk") e execute.
"""
import http.server
import socketserver
import threading
import webbrowser
import os
import sys
import time

PORT = 18633

# Localizar pasta do app
if getattr(sys, "frozen", False):
    BASE = os.path.dirname(sys.executable)
else:
    BASE = os.path.dirname(os.path.abspath(__file__))

# Procura pela pasta app, dist-apk ou dist-standalone
APP_DIR = None
for candidate in ["app", "dist-apk", "dist-standalone", "dist"]:
    p = os.path.join(BASE, candidate)
    if os.path.isdir(p) and os.path.exists(os.path.join(p, "index.html")):
        APP_DIR = p
        break

if not APP_DIR:
    print("ERRO: Nao encontrou a pasta 'app' com index.html.")
    print("Coloque a pasta 'app' ao lado deste arquivo.")
    input("Pressione Enter para sair...")
    sys.exit(1)

os.chdir(APP_DIR)

class SpaHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.translate_path(self.path.split("?")[0])
        if not os.path.exists(path) or os.path.isdir(path):
            self.path = "/index.html"
        return super().do_GET()

    def log_message(self, fmt, *args):
        pass  # Sem logs no console

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

def start():
    with socketserver.TCPServer(("127.0.0.1", PORT), SpaHandler) as httpd:
        httpd.serve_forever()

t = threading.Thread(target=start, daemon=True)
t.start()

url = f"http://localhost:{PORT}"
print(f"Abrindo {url} ...")
time.sleep(0.5)
webbrowser.open(url)

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("Encerrando...")
