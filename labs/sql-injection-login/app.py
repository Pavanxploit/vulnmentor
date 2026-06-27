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
    body {{
      margin: 0;
      background: #f7f7f4;
      color: #151716;
      font-family: Arial, Helvetica, sans-serif;
    }}
    main {{
      max-width: 760px;
      margin: 0 auto;
      padding: 32px 16px;
    }}
    section {{
      background: white;
      border: 1px solid #dedfd7;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 2px rgba(20, 24, 21, 0.06);
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
      height: 42px;
      border: 1px solid #cdd1c9;
      border-radius: 6px;
      padding: 0 12px;
      font: inherit;
    }}
    button {{
      margin-top: 16px;
      height: 42px;
      border: 0;
      border-radius: 6px;
      background: #151716;
      color: white;
      padding: 0 16px;
      font-weight: 700;
      cursor: pointer;
    }}
    code, pre {{
      font-family: Consolas, Monaco, monospace;
    }}
    pre {{
      overflow: auto;
      background: #111412;
      color: #d7ded8;
      border-radius: 6px;
      padding: 14px;
      line-height: 1.5;
    }}
    .ok {{
      border-color: #b7e2cd;
      background: #effaf4;
      color: #0f6b53;
    }}
    .bad {{
      border-color: #efcaca;
      background: #fff3f3;
      color: #a03434;
    }}
    .notice {{
      margin-top: 16px;
      border: 1px solid #e1e2da;
      border-radius: 6px;
      padding: 12px;
    }}
  </style>
</head>
<body>
  <main>
    <h1>SQL Injection Login Lab</h1>
    {content}
  </main>
</body>
</html>"""


def login_form(message=""):
    return page(
        f"""
<section>
  <p>This intentionally vulnerable login is isolated for learning.</p>
  <form method="post" action="/login">
    <label for="username">Username</label>
    <input id="username" name="username" autocomplete="off" />
    <label for="password">Password</label>
    <input id="password" name="password" type="password" />
    <button type="submit">Sign in</button>
  </form>
  {message}
</section>
<section style="margin-top: 16px;">
  <h2>Recent Traces</h2>
  <pre>{html.escape(chr(10).join(TRACES[-8:]) or "No traces yet.")}</pre>
</section>
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
            record_trace(f"SQL error username={username!r} error={error}")
            self.respond_html(
                login_form(
                    f"<div class='notice bad'>Database error: {html.escape(str(error))}</div>"
                )
            )
            return

        if row:
            record_trace(f"LOGIN success username={username!r} role={row[2]}")
            self.respond_html(
                login_form(
                    f"<div class='notice ok'>Authenticated as {html.escape(row[1])}. Flag: <code>{FLAG}</code></div>"
                )
            )
        else:
            record_trace(f"LOGIN failed username={username!r}")
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
