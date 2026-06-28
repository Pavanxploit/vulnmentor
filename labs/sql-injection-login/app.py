from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs
import html
import sqlite3
import time

PORT = 4010
FLAG = "VM{sql_auth_bypass}"


def create_database():
    connection = sqlite3.connect(":memory:")
    connection.execute(
        "CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT)"
    )
    connection.executemany(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        [
            ("admin", "correct-horse-battery", "admin"),
            ("student", "learn-secure-code", "student"),
        ],
    )
    connection.commit()
    return connection


DB = create_database()
TRACES = []


def record_trace(message):
    timestamp = time.strftime("%H:%M:%S")
    TRACES.append(f"{timestamp} {message}")
    if len(TRACES) > 25:
        TRACES.pop(0)


def page(content):
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VulnMentor SQLi Lab</title>
  <style>
    :root {{
      --ink: #f8fafc;
      --muted: #a8b3c7;
      --line: rgba(255, 255, 255, 0.12);
      --panel: rgba(15, 23, 42, 0.92);
      --wash: #020617;
      --accent: #34d399;
      --danger: #fca5a5;
      --code: #020617;
    }}
    body {{
      margin: 0;
      background:
        radial-gradient(circle at top left, rgba(20, 184, 166, 0.16), transparent 34rem),
        linear-gradient(135deg, #020617 0%, #08111f 52%, #020617 100%);
      color: var(--ink);
      font-family: Arial, Helvetica, sans-serif;
    }}
    header {{
      border-bottom: 1px solid var(--line);
      background: rgba(2, 6, 23, 0.88);
      backdrop-filter: blur(16px);
    }}
    .bar {{
      max-width: 1080px;
      margin: 0 auto;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }}
    .brand {{
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.02em;
    }}
    .status {{
      border: 1px solid rgba(52, 211, 153, 0.35);
      border-radius: 999px;
      background: rgba(52, 211, 153, 0.1);
      color: var(--accent);
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 700;
    }}
    main {{
      max-width: 1080px;
      margin: 0 auto;
      padding: 32px 20px 40px;
    }}
    .hero {{
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 18px;
      align-items: stretch;
      margin-bottom: 18px;
    }}
    .title {{
      margin: 0;
      font-size: clamp(32px, 5vw, 54px);
      line-height: 1;
      letter-spacing: 0;
    }}
    .lead {{
      max-width: 720px;
      color: var(--muted);
      line-height: 1.6;
      font-size: 16px;
    }}
    section {{
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 20px 60px rgba(2, 6, 23, 0.28);
    }}
    .grid {{
      display: grid;
      grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
      gap: 18px;
      align-items: start;
    }}
    .meta {{
      display: grid;
      gap: 10px;
      margin-top: 16px;
    }}
    .meta-row {{
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-top: 1px solid var(--line);
      padding-top: 10px;
      color: var(--muted);
      font-size: 13px;
    }}
    .meta-row strong {{
      color: var(--ink);
    }}
    label {{
      display: block;
      margin: 14px 0 6px;
      font-size: 14px;
      font-weight: 700;
    }}
    input {{
      box-sizing: border-box;
      width: 100%;
      height: 44px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 6px;
      padding: 0 12px;
      font: inherit;
      background: #020617;
      color: var(--ink);
      outline: none;
    }}
    input:focus {{
      border-color: rgba(103, 232, 249, 0.72);
    }}
    button {{
      margin-top: 16px;
      height: 44px;
      border: 0;
      border-radius: 6px;
      background: #34d399;
      color: #020617;
      padding: 0 18px;
      font-weight: 700;
      cursor: pointer;
    }}
    code, pre {{
      font-family: Consolas, Monaco, monospace;
    }}
    pre {{
      overflow: auto;
      background: var(--code);
      color: #d7fbe8;
      border-radius: 6px;
      border: 1px solid var(--line);
      padding: 14px;
      line-height: 1.5;
      min-height: 148px;
      margin: 0;
    }}
    .ok {{
      border-color: rgba(52, 211, 153, 0.32);
      background: rgba(52, 211, 153, 0.1);
      color: #bbf7d0;
    }}
    .bad {{
      border-color: rgba(248, 113, 113, 0.35);
      background: rgba(248, 113, 113, 0.12);
      color: #fecaca;
    }}
    .notice {{
      margin-top: 16px;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 12px;
      line-height: 1.5;
    }}
    .stack {{
      display: grid;
      gap: 18px;
    }}
    .panel-title {{
      margin: 0 0 8px;
      font-size: 18px;
    }}
    .small {{
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
    }}
    .endpoint {{
      display: inline-flex;
      border: 1px solid rgba(103, 232, 249, 0.28);
      border-radius: 6px;
      background: rgba(8, 47, 73, 0.55);
      padding: 4px 8px;
      color: #a5f3fc;
      font-size: 12px;
      font-weight: 700;
      margin-right: 6px;
      margin-top: 6px;
    }}
    @media (max-width: 860px) {{
      .hero,
      .grid {{
        grid-template-columns: 1fr;
      }}
      .bar {{
        align-items: flex-start;
        flex-direction: column;
      }}
    }}
  </style>
</head>
<body>
  <header>
    <div class="bar">
      <div class="brand">VulnMentor Sandbox</div>
      <div class="status">Local isolated lab : vulnerable mode</div>
    </div>
  </header>
  <main>
    {content}
  </main>
</body>
</html>"""


def login_form(message=""):
    return page(
        f"""
<div class="hero">
  <section>
    <h1 class="title">SQL Injection Login Lab</h1>
    <p class="lead">
      This target is intentionally vulnerable and isolated for learning. The goal is to bypass the login flow, capture the flag, and then submit it in the VulnMentor portal.
    </p>
    <div class="meta">
      <div class="meta-row"><span>Category</span><strong>Web Security</strong></div>
      <div class="meta-row"><span>Difficulty</span><strong>Easy</strong></div>
      <div class="meta-row"><span>Objective</span><strong>Authentication bypass</strong></div>
    </div>
  </section>
  <section>
    <h2 class="panel-title">Lab Interfaces</h2>
    <p class="small">The browser target and trace feed are exposed only from this local Docker lab.</p>
    <div>
      <span class="endpoint">GET /health</span>
      <span class="endpoint">GET /traces</span>
      <span class="endpoint">POST /login</span>
    </div>
    <div class="notice">
      Use this sandbox only for the college project lab environment. Do not test payloads against websites that you do not own or have permission to assess.
    </div>
  </section>
</div>
<div class="grid">
  <section>
    <h2 class="panel-title">Login Target</h2>
    <p class="small">Submit test credentials and observe how the server responds.</p>
    <form method="post" action="/login">
      <label for="username">Username</label>
      <input id="username" name="username" autocomplete="off" />
      <label for="password">Password</label>
      <input id="password" name="password" type="password" />
      <button type="submit">Sign in</button>
    </form>
    {message}
  </section>
  <section>
    <h2 class="panel-title">Recent Traces</h2>
    <pre>{html.escape(chr(10).join(TRACES[-10:]) or "No traces yet.")}</pre>
  </section>
</div>
"""
    )


class LabHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_common_headers("text/plain; charset=utf-8")
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self.respond_text("ok")
            return

        if self.path == "/traces":
            self.respond_text("\n".join(TRACES))
            return

        self.respond_html(login_form())

    def do_POST(self):
        if self.path != "/login":
            self.send_error(404)
            return

        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length).decode("utf-8")
        form = parse_qs(body)
        username = form.get("username", [""])[0]
        password = form.get("password", [""])[0]

        query = (
            "SELECT id, username, role FROM users WHERE username = '"
            + username
            + "' AND password = '"
            + password
            + "'"
        )

        try:
            row = DB.execute(query).fetchone()
        except sqlite3.Error as error:
            record_trace(
                f"POST /login status=500 ip={self.client_address[0]} username={username!r} sql_error={error}"
            )
            self.respond_html(
                login_form(
                    f"<div class='notice bad'>Database error: {html.escape(str(error))}</div>"
                )
            )
            return

        if row:
            record_trace(
                f"POST /login status=200 ip={self.client_address[0]} username={username!r} role={row[2]}"
            )
            self.respond_html(
                login_form(
                    f"<div class='notice ok'>Authenticated as {html.escape(row[1])}. Flag: <code>{FLAG}</code></div>"
                )
            )
        else:
            record_trace(
                f"POST /login status=401 ip={self.client_address[0]} username={username!r}"
            )
            self.respond_html(login_form("<div class='notice bad'>Invalid login.</div>"))

    def respond_html(self, body):
        encoded = body.encode("utf-8")
        self.send_response(200)
        self.send_common_headers("text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def respond_text(self, body):
        encoded = body.encode("utf-8")
        self.send_response(200)
        self.send_common_headers("text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def send_common_headers(self, content_type):
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    record_trace("lab booted database=sqlite mode=vulnerable")
    server = HTTPServer(("0.0.0.0", PORT), LabHandler)
    print(f"VulnMentor SQLi lab running on http://0.0.0.0:{PORT}")
    server.serve_forever()
