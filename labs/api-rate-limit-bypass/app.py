from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse
import html
import json
import time

PORT = 4040
FLAG = "VM{rate_limits_need_stable_keys}"
OTP_CODE = "481927"
MAX_ATTEMPTS = 3
VULNERABLE_ATTEMPTS = {}
SECURE_ATTEMPTS = {}
TRACES = []


def record_trace(message):
    timestamp = time.strftime("%H:%M:%S")
    TRACES.append(f"{timestamp} {message}")
    if len(TRACES) > 50:
        TRACES.pop(0)


def page(content):
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VulnMentor Rate Limit Lab</title>
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
      border: 1px solid rgba(52, 211, 153, 0.35);
      border-radius: 999px;
      background: rgba(52, 211, 153, 0.1);
      color: var(--accent);
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 700;
    }}
    main {{
      max-width: 1120px;
      margin: 0 auto;
      padding: 32px 20px 40px;
    }}
    .hero,
    .grid {{
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
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
      box-shadow: 0 20px 60px rgba(2, 6, 23, 0.28);
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
      color: #67e8f9;
      font-weight: 700;
      text-decoration: none;
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
      margin: 0;
      min-height: 132px;
      white-space: pre-wrap;
      word-break: break-word;
    }}
    .endpoint {{
      display: block;
      border: 1px solid rgba(103, 232, 249, 0.28);
      border-radius: 6px;
      background: rgba(8, 47, 73, 0.55);
      padding: 10px;
      color: #a5f3fc;
      font-size: 13px;
      font-weight: 700;
      margin-top: 8px;
      word-break: break-word;
    }}
    .notice {{
      margin-top: 14px;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 12px;
      line-height: 1.5;
    }}
    .bad {{
      border-color: rgba(248, 113, 113, 0.35);
      background: rgba(248, 113, 113, 0.12);
      color: var(--danger);
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
      <div class="status">Local isolated API lab : vulnerable rate-limit mode</div>
    </div>
  </header>
  <main>{content}</main>
</body>
</html>"""


def home():
    traces = html.escape("\n".join(TRACES[-10:]) or "No traces yet.")
    return page(
        f"""
<div class="hero">
  <section>
    <h1>API Rate Limit Bypass Lab</h1>
    <p>
      This password-reset API limits OTP attempts, but the vulnerable endpoint keys the limit to a spoofable client value. Your task is to understand why the bypass works and compare it with the secure endpoint.
    </p>
    <div class="meta">
      <div class="meta-row"><span>Category</span><strong>API Security</strong></div>
      <div class="meta-row"><span>OWASP Mapping</span><strong>API4 Unrestricted Resource Consumption</strong></div>
      <div class="meta-row"><span>Max Attempts</span><strong>{MAX_ATTEMPTS} per key</strong></div>
    </div>
  </section>
  <section>
    <h2>Try These Requests</h2>
    <a class="endpoint" href="/api/otp/start">GET /api/otp/start</a>
    <a class="endpoint" href="/api/otp/verify?code=000000">GET /api/otp/verify?code=000000</a>
    <a class="endpoint" href="/secure/api/otp/verify?code=000000">GET /secure/api/otp/verify?code=000000</a>
    <div class="notice">
      Use command-line requests to set <code>X-Forwarded-For</code> and observe how the vulnerable endpoint treats a spoofed client key.
    </div>
  </section>
</div>
<div class="grid">
  <section>
    <h2>Lab Interfaces</h2>
    <span class="endpoint">GET /health</span>
    <span class="endpoint">GET /traces</span>
    <span class="endpoint">GET /api/otp/start</span>
    <span class="endpoint">GET /api/otp/verify?code=&lt;otp&gt;</span>
    <span class="endpoint">GET /secure/api/otp/verify?code=&lt;otp&gt;</span>
    <div class="notice bad">
      This is a local learning lab. Do not brute force real OTP, login, reset, or MFA systems.
    </div>
  </section>
  <section>
    <h2>Recent Traces</h2>
    <pre>{traces}</pre>
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

        if parsed.path == "/api/otp/start":
            record_trace(f"GET /api/otp/start status=200 ip={self.client_address[0]}")
            self.respond_json(
                {
                    "flow": "password-reset",
                    "account": "student@example.test",
                    "message": "OTP challenge created for local training.",
                    "candidateCodes": ["000000", "111111", "222222", OTP_CODE],
                }
            )
            return

        if parsed.path == "/api/otp/verify":
            self.handle_verify(query, secure=False)
            return

        if parsed.path == "/secure/api/otp/verify":
            self.handle_verify(query, secure=True)
            return

        self.respond_json({"error": "not_found"}, status=404)

    def handle_verify(self, query, secure):
        code = query.get("code", [""])[0]
        forwarded_for = self.headers.get("X-Forwarded-For", "").strip()
        request_ip = self.client_address[0]
        mode = "secure" if secure else "vulnerable"
        account_key = "student@example.test"

        if secure:
            limit_key = account_key
            attempts = SECURE_ATTEMPTS
        else:
            limit_key = forwarded_for or request_ip
            attempts = VULNERABLE_ATTEMPTS

        current_attempts = attempts.get(limit_key, 0)
        if current_attempts >= MAX_ATTEMPTS:
            record_trace(
                f"GET /{mode}/otp/verify status=429 key={limit_key} ip={request_ip} xff={forwarded_for or '-'}"
            )
            self.respond_json(
                {
                    "error": "rate_limited",
                    "mode": mode,
                    "limitKey": limit_key,
                    "remaining": 0,
                },
                status=429,
            )
            return

        attempts[limit_key] = current_attempts + 1
        remaining = max(0, MAX_ATTEMPTS - attempts[limit_key])

        if code == OTP_CODE:
            record_trace(
                f"GET /{mode}/otp/verify status=200 key={limit_key} ip={request_ip} xff={forwarded_for or '-'} result=otp_valid"
            )
            self.respond_json(
                {
                    "mode": mode,
                    "message": "OTP accepted.",
                    "limitKey": limit_key,
                    "remaining": remaining,
                    "flag": FLAG,
                }
            )
            return

        record_trace(
            f"GET /{mode}/otp/verify status=401 key={limit_key} ip={request_ip} xff={forwarded_for or '-'} remaining={remaining}"
        )
        self.respond_json(
            {
                "error": "invalid_otp",
                "mode": mode,
                "limitKey": limit_key,
                "remaining": remaining,
            },
            status=401,
        )

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
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Forwarded-For")

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    record_trace("lab booted api=otp mode=vulnerable secure_compare=true")
    server = HTTPServer(("0.0.0.0", PORT), LabHandler)
    print(f"VulnMentor Rate Limit lab running on http://0.0.0.0:{PORT}")
    server.serve_forever()
