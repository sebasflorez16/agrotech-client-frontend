#!/usr/bin/env python3
"""
dev_server.py — Servidor local de desarrollo para AgroTech Frontend
===================================================================
Equivalente a `netlify dev` sin necesitar Node.js / netlify-cli.

• Puerto 8080 (igual que netlify dev)
• Sirve archivos estáticos desde este directorio
• Proxea a localhost:8000 (Django):
    /api/*         → /api/*
    /billing/*     → /billing/*
    /staff/api/*   → /staff/api/*
    /health/       → /health/
• Rutas especiales → templates HTML:
    /dashboard     → templates/dashboard.html
    /billing       → templates/billing.html
    /login         → templates/authentication/login.html
    /register      → templates/authentication/register.html
    /staff         → templates/staff-dashboard.html

Uso:
    python dev_server.py          # puerto 8080
    python dev_server.py 3000     # puerto personalizado
"""

import http.server
import urllib.request
import urllib.error
import os
import sys
import mimetypes

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
BACKEND = "http://localhost:8000"
FRONTEND_DIR = os.path.dirname(os.path.abspath(__file__))

ROUTE_MAP = {
    "/dashboard": "templates/dashboard.html",
    "/billing":   "templates/billing.html",
    "/login":     "templates/authentication/login.html",
    "/register":  "templates/authentication/register.html",
    "/staff":     "templates/staff-dashboard.html",
}

PROXY_PREFIXES = (
    "/api/",
    "/billing/",
    "/staff/api/",
    "/health/",
)


class AgroTechDevHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # Suprimir logs de favicon para no ensuciar la salida
        if "favicon" not in (args[0] if args else ""):
            print(f"  {self.address_string()} [{self.log_date_time_string()}] {fmt % args}")

    def _should_proxy(self, path):
        for prefix in PROXY_PREFIXES:
            if path.startswith(prefix):
                return True
        return False

    def _proxy_to_backend(self):
        url = BACKEND + self.path
        req_headers = {k: v for k, v in self.headers.items()
                       if k.lower() not in ("host", "connection")}
        req_headers["Host"] = "localhost"

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length else None

        try:
            req = urllib.request.Request(url, data=body, headers=req_headers,
                                         method=self.command)
            with urllib.request.urlopen(req, timeout=30) as resp:
                self.send_response(resp.status)
                for k, v in resp.headers.items():
                    if k.lower() not in ("transfer-encoding", "connection"):
                        self.send_header(k, v)
                self.end_headers()
                self.wfile.write(resp.read())
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            for k, v in e.headers.items():
                if k.lower() not in ("transfer-encoding", "connection"):
                    self.send_header(k, v)
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as exc:
            self.send_response(502)
            self.end_headers()
            self.wfile.write(f"502 Bad Gateway: {exc}".encode())

    def _serve_file(self, rel_path):
        abs_path = os.path.join(FRONTEND_DIR, rel_path.lstrip("/"))
        if not os.path.exists(abs_path):
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"404 Not found")
            return
        mime, _ = mimetypes.guess_type(abs_path)
        self.send_response(200)
        self.send_header("Content-Type", mime or "application/octet-stream")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        with open(abs_path, "rb") as f:
            self.wfile.write(f.read())

    def do_GET(self):
        path = self.path.split("?")[0].rstrip("/") or "/"

        # 1. Proxy al backend
        if self._should_proxy(self.path):
            return self._proxy_to_backend()

        # 2. Rutas con template HTML propio
        if path in ROUTE_MAP:
            return self._serve_file(ROUTE_MAP[path])

        # 3. Archivo estático
        candidate = path if path != "/" else "/index.html"
        abs_path = os.path.join(FRONTEND_DIR, candidate.lstrip("/"))
        if os.path.isfile(abs_path):
            return self._serve_file(candidate)

        # 4. Fallback: index.html (SPA)
        return self._serve_file("/index.html")

    def do_POST(self):
        if self._should_proxy(self.path):
            return self._proxy_to_backend()
        self.send_response(404)
        self.end_headers()

    def do_PUT(self):
        if self._should_proxy(self.path):
            return self._proxy_to_backend()
        self.send_response(404)
        self.end_headers()

    def do_DELETE(self):
        if self._should_proxy(self.path):
            return self._proxy_to_backend()
        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        if self._should_proxy(self.path):
            return self._proxy_to_backend()
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()


if __name__ == "__main__":
    os.chdir(FRONTEND_DIR)
    server = http.server.HTTPServer(("0.0.0.0", PORT), AgroTechDevHandler)
    print(f"""
╔══════════════════════════════════════════════════════════╗
║        AgroTech Digital — Dev Server                     ║
╠══════════════════════════════════════════════════════════╣
║  Frontend  →  http://localhost:{PORT:<27} ║
║  Backend   →  {BACKEND:<42} ║
╠══════════════════════════════════════════════════════════╣
║  Rutas importantes:                                      ║
║    /login      → templates/authentication/login.html     ║
║    /dashboard  → templates/dashboard.html                ║
║    /billing    → templates/billing.html                  ║
║    /staff      → templates/staff-dashboard.html          ║
║    /api/*      → proxy → localhost:8000                  ║
║    /staff/api/* → proxy → localhost:8000                 ║
╚══════════════════════════════════════════════════════════╝
Ctrl+C para detener
""")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido.")
