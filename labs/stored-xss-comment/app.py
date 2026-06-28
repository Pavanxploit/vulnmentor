from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse
import html
import json
import time

PORT = 4060
FLAG = "VM{stored_xss_needs_output_encoding}"
TRACES = []
COMMENTS = [
    {
        "author": "mentor",
        "body": "Welcome to the review board. Student comments are stored here.",
        "created_at": "boot",
    }
]
COLLECTED = []


def record_trace(message):
    timestamp = time.strftime("%H:%M:%S")
    TRACES.append(f"{timestamp} {message}")
    if len(TRACES) > 80:
        TRACES.pop(0)


def add_comment(author, body):
    clean_author = (author or "student").strip()[:40] or "student"
    stored_body = (body or "").strip()[:700]

    COMMENTS.append(
        {
            "author": clean_author,
            "body": stored_body,
            "created_at": time.strftime("%H:%M:%S"),
        }
    )
    record_trace(
        f"POST /comment author={clean_author} length={len(stored_body)} stored=true"
    )


def comment_cards(escape_body):
    if not COMMENTS:
        return '<div class="empty">No comments yet.</div>'

    cards = []
    for item in COMMENTS:
        author = html.escape(item["author"])
        created_at = html.escape(item["created_at"])
        body = html.escape(item["body"]) if escape_body else item["body"]
        cards.append(
            f"""
<article class="comment">
  <div class="comment-meta">
    <strong>{author}</strong>
    <span>{created_at}</span>
  </div>
  <div class="comment-body">{body}</div>
</article>"""
        )
    return "\n".join(cards)


def trace_block():
    return html.escape("\n".join(TRACES[-12:]) or "No traces yet.")


def collected_block():
    if not COLLECTED:
        return "No collected browser data yet."

    rows = []
    for item in COLLECTED[-10:]:
        rows.append(
            f"{item['created_at']} source={item['source_ip']} data={item['data']}"
        )
    return html.escape("\n".join(rows))


def page(content, status_text="Local isolated web lab : stored XSS mode"):
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VulnMentor Stored XSS Lab</title>
  <style>
    :root {{
      --ink: #111713;
      --muted: #5f6b63;
      --line: #dfe5dd;
      --panel: #ffffff;
      --wash: #f5f7f2;
      --accent: #0f6b53;
      --warn: #9c4f10;
      --danger: #9f3030;
      --code: #0e1410;
    }}
    * {{
      box-sizing: border-box;
    }}
    body {{
      margin: 0;
      background: var(--wash);
      color: var(--ink);
      font-family: Arial, Helvetica, sans-serif;
    }}
    header {{
      border-bottom: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.9);
    }}
    .bar {{
      max-width: 1120px;
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
      border: 1px solid #b9d9cd;
      border-radius: 999px;
      background: #eef8f3;
      color: var(--accent);
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 700;
    }}
    main {{
      max-width: 1120px;
      margin: 0 auto;
      padding: 32px 20px 42px;
    }}
    .hero,
    .grid {{
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 0.92fr);
      gap: 18px;
      align-items: start;
    }}
    .hero {{
      margin-bottom: 18px;
    }}
    section {{
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 2px rgba(20, 24, 21, 0.06);
    }}
    h1 {{
      margin: 0;
      font-size: clamp(32px, 5vw, 54px);
      line-height: 1;
      letter-spacing: 0;
    }}
    h2 {{
      margin: 0 0 10px;
      font-size: 18px;
    }}
    p {{
      color: var(--muted);
      line-height: 1.6;
    }}
    a {{
      color: #0b5d4c;
      font-weight: 700;
      text-decoration: none;
    }}
    label {{
      display: block;
      margin: 13px 0 7px;
      font-weight: 800;
      font-size: 14px;
    }}
    input,
    textarea {{
      width: 100%;
      border: 1px solid #cbd4cc;
      border-radius: 6px;
      background: #fff;
      color: var(--ink);
      padding: 12px;
      font: inherit;
    }}
    textarea {{
      min-height: 132px;
      resize: vertical;
    }}
    button,
    .button {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      border: 0;
      border-radius: 6px;
      background: #111713;
      color: #fff;
      padding: 0 16px;
      font-weight: 800;
      cursor: pointer;
    }}
    .actions {{
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 16px;
    }}
    .button.secondary {{
      border: 1px solid #cbd4cc;
      background: #fff;
      color: var(--ink);
    }}
    code,
    pre {{
      font-family: Consolas, Monaco, monospace;
    }}
    pre {{
      overflow: auto;
      background: var(--code);
      color: #d7ded8;
      border-radius: 6px;
      padding: 14px;
      line-height: 1.5;
      margin: 0;
      min-height: 132px;
      white-space: pre-wrap;
      word-break: break-word;
    }}
    .endpoint {{
      display: block;
      border: 1px solid #d7e3ef;
      border-radius: 6px;
      background: #f6fbff;
      padding: 10px;
      color: #224a69;
      font-size: 13px;
      font-weight: 700;
      margin-top: 8px;
      word-break: break-word;
    }}
    .notice {{
      margin-top: 14px;
      border: 1px solid #e1e2da;
      border-radius: 6px;
      padding: 12px;
      line-height: 1.5;
      color: var(--muted);
    }}
    .notice.warn {{
      border-color: #f0d1a8;
      background: #fff8ed;
      color: var(--warn);
    }}
    .notice.bad {{
      border-color: #efcaca;
      background: #fff3f3;
      color: var(--danger);
    }}
    .comment {{
      border: 1px solid #e2e7df;
      border-radius: 6px;
      padding: 14px;
      margin-top: 10px;
      background: #fcfdf9;
    }}
    .comment-meta {{
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
      color: var(--muted);
      font-size: 13px;
    }}
    .comment-body {{
      line-height: 1.6;
      word-break: break-word;
    }}
    .empty {{
      border: 1px dashed #ccd5cc;
      border-radius: 6px;
      color: var(--muted);
      padding: 14px;
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
      border-top: 1px solid #eceee8;
      padding-top: 10px;
      color: var(--muted);
      font-size: 13px;
    }}
    .meta-row strong {{
      color: var(--ink);
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
      .actions {{
        flex-direction: column;
      }}
      button,
      .button {{
        width: 100%;
      }}
    }}
  </style>
</head>
<body>
  <header>
    <div class="bar">
      <div class="brand">VulnMentor Sandbox</div>
      <div class="status">{html.escape(status_text)}</div>
    </div>
  </header>
  <main>{content}</main>
</body>
</html>"""


def home(message=""):
    safe_message = (
        f'<div class="notice">{html.escape(message)}</div>' if message else ""
    )

    return page(
        f"""
<div class="hero">
  <section>
    <h1>Stored XSS Comment Lab</h1>
    <p>
      This lab stores student comments and later shows them to a simulated reviewer. The normal board encodes comments, but the admin review page intentionally renders stored content as HTML.
    </p>
    <div class="meta">
      <div class="meta-row"><span>Category</span><strong>Web Security</strong></div>
      <div class="meta-row"><span>OWASP Mapping</span><strong>A03 Injection</strong></div>
      <div class="meta-row"><span>Target</span><strong>Admin review rendering</strong></div>
    </div>
    <div class="notice warn">
      Practice only on this localhost lab. The objective is to prove stored script execution in this sandbox and understand the secure fix.
    </div>
  </section>
  <section>
    <h2>Submit Comment</h2>
    <form method="post" action="/comment">
      <label for="author">Author</label>
      <input id="author" name="author" value="student" maxlength="40" />
      <label for="body">Comment</label>
      <textarea id="body" name="body" placeholder="Write a comment for the reviewer"></textarea>
      <div class="actions">
        <button type="submit">Store Comment</button>
        <a class="button secondary" href="/admin/review">Admin Review</a>
        <a class="button secondary" href="/secure/review">Secure Review</a>
      </div>
    </form>
    {safe_message}
  </section>
</div>
<div class="grid">
  <section>
    <h2>Encoded Public Board</h2>
    <p>The public board treats every comment as text.</p>
    {comment_cards(escape_body=True)}
  </section>
  <section>
    <h2>Lab Interfaces</h2>
    <span class="endpoint">GET /health</span>
    <span class="endpoint">GET /traces</span>
    <span class="endpoint">POST /comment</span>
    <span class="endpoint">GET /admin/review</span>
    <span class="endpoint">GET /secure/review</span>
    <span class="endpoint">GET /collect?data=...</span>
    <span class="endpoint">GET /loot</span>
    <div class="notice bad">
      The vulnerable page is intentionally unsafe and must stay local. Do not deploy this lab to a public server.
    </div>
  </section>
</div>
"""
    )


def admin_review():
    record_trace("GET /admin/review status=200 sink=raw-html cookie=readable")
    return page(
        f"""
<div class="hero">
  <section>
    <h1>Admin Review</h1>
    <p>
      The reviewer page sets a local training cookie and renders stored comments without output encoding. If a stored comment can run browser code here, the lab objective is reachable.
    </p>
    <div class="actions">
      <a class="button" href="/">Back To Board</a>
      <a class="button secondary" href="/loot">View Collector</a>
    </div>
  </section>
  <section>
    <h2>Reviewer Notes</h2>
    <div class="notice warn">
      Vulnerable sink: stored comment bodies are inserted as HTML in this review view.
    </div>
    <pre>{trace_block()}</pre>
  </section>
</div>
<section>
  <h2>Stored Comments Rendered For Review</h2>
  {comment_cards(escape_body=False)}
</section>
""",
        status_text="Vulnerable admin review : raw stored HTML",
    )


def secure_review():
    record_trace("GET /secure/review status=200 sink=encoded cookie=httponly")
    return page(
        f"""
<div class="hero">
  <section>
    <h1>Secure Review</h1>
    <p>
      This version renders the same stored comments as text and marks the training cookie as HttpOnly. Compare it with the admin review page.
    </p>
    <div class="actions">
      <a class="button" href="/">Back To Board</a>
      <a class="button secondary" href="/admin/review">Compare Vulnerable View</a>
    </div>
  </section>
  <section>
    <h2>Secure Controls</h2>
    <div class="notice">
      Output encoding, HttpOnly cookies, and a restrictive content security policy reduce the impact of stored content injection.
    </div>
    <pre>{trace_block()}</pre>
  </section>
</div>
<section>
  <h2>Stored Comments Rendered Safely</h2>
  {comment_cards(escape_body=True)}
</section>
""",
        status_text="Secure review : encoded output",
    )


def loot_page():
    solved = any(FLAG in item["data"] for item in COLLECTED)
    status = (
        f"Flag captured: {FLAG}"
        if solved
        else "No flag captured yet. Trigger the vulnerable review flow first."
    )
    record_trace(f"GET /loot status=200 solved={str(solved).lower()}")
    return page(
        f"""
<div class="hero">
  <section>
    <h1>Collector</h1>
    <p>
      The collector records proof from this local browser lab. When the reviewer cookie reaches this page, the flag appears here.
    </p>
    <div class="notice {'warn' if solved else ''}">{html.escape(status)}</div>
    <div class="actions">
      <a class="button" href="/">Back To Board</a>
      <a class="button secondary" href="/admin/review">Open Admin Review</a>
    </div>
  </section>
  <section>
    <h2>Captured Data</h2>
    <pre>{collected_block()}</pre>
  </section>
</div>
<section>
  <h2>Recent Traces</h2>
  <pre>{trace_block()}</pre>
</section>
""",
        status_text="Local collector",
    )


class LabHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_common_headers("text/plain; charset=utf-8")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)

        if parsed.path == "/health":
            self.respond_text("ok")
            return

        if parsed.path == "/traces":
            self.respond_text("\n".join(TRACES))
            return

        if parsed.path == "/":
            self.respond_html(home())
            return

        if parsed.path == "/admin/review":
            self.respond_html(
                admin_review(),
                extra_headers=[
                    (
                        "Set-Cookie",
                        f"lab_flag={FLAG}; SameSite=Lax; Path=/",
                    )
                ],
            )
            return

        if parsed.path == "/secure/review":
            self.respond_html(
                secure_review(),
                extra_headers=[
                    (
                        "Set-Cookie",
                        f"lab_flag={FLAG}; HttpOnly; SameSite=Lax; Path=/",
                    ),
                    (
                        "Content-Security-Policy",
                        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'",
                    ),
                ],
            )
            return

        if parsed.path == "/collect":
            self.handle_collect(query)
            return

        if parsed.path == "/loot":
            self.respond_html(loot_page())
            return

        self.respond_json({"error": "not_found"}, status=404)

    def do_POST(self):
        parsed = urlparse(self.path)

        if parsed.path != "/comment":
            self.respond_json({"error": "not_found"}, status=404)
            return

        length = int(self.headers.get("Content-Length", "0") or "0")
        body = self.rfile.read(length).decode("utf-8", errors="replace")
        form = parse_qs(body)

        add_comment(form.get("author", ["student"])[0], form.get("body", [""])[0])
        self.respond_html(
            home("Comment stored. Open Admin Review to test the stored rendering path.")
        )

    def handle_collect(self, query):
        data = query.get("data", [""])[0][:1000]
        source_ip = self.client_address[0]

        COLLECTED.append(
            {
                "created_at": time.strftime("%H:%M:%S"),
                "source_ip": source_ip,
                "data": data,
            }
        )
        solved = FLAG in data
        record_trace(
            f"GET /collect status=200 source={source_ip} solved={str(solved).lower()}"
        )
        self.respond_json({"stored": True, "flagCaptured": solved})

    def respond_html(self, body, extra_headers=None):
        encoded = body.encode("utf-8")
        self.send_response(200)
        self.send_common_headers("text/html; charset=utf-8")
        for key, value in extra_headers or []:
            self.send_header(key, value)
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

    def respond_json(self, payload, status=200):
        encoded = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_common_headers("application/json; charset=utf-8")
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
    record_trace("lab booted web=stored-xss mode=vulnerable secure_compare=true")
    server = HTTPServer(("0.0.0.0", PORT), LabHandler)
    print(f"VulnMentor Stored XSS lab running on http://0.0.0.0:{PORT}")
    server.serve_forever()
