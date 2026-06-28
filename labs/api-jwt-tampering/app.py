from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse
import base64
import hashlib
import hmac
import html
import json
import time

PORT = 4030
FLAG = "VM{jwt_claims_need_verification}"
JWT_SECRET = b"vulnmentor-demo-secret"
TRACES = []


def record_trace(message):
    timestamp = time.strftime("%H:%M:%S")
    TRACES.append(f"{timestamp} {message}")
    if len(TRACES) > 40:
        TRACES.pop(0)


def b64url_encode(raw):
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def b64url_decode(value):
    padded = value + ("=" * (-len(value) % 4))
    return base64.urlsafe_b64decode(padded.encode("utf-8"))


def sign(message):
    digest = hmac.new(JWT_SECRET, message.encode("utf-8"), hashlib.sha256).digest()
    return b64url_encode(digest)


def create_token(payload, alg="HS256", signed=True):
    header = {"typ": "JWT", "alg": alg}
    header_part = b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_part = b64url_encode(
        json.dumps(payload, separators=(",", ":")).encode("utf-8")
    )
    message = f"{header_part}.{payload_part}"
    signature = sign(message) if signed else ""
    return f"{message}.{signature}"


def decode_token_without_verification(token):
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("token must have three parts")

    header = json.loads(b64url_decode(parts[0]))
    payload = json.loads(b64url_decode(parts[1]))
    return header, payload


def verify_hs256_token(token):
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("token must have three parts")

    header = json.loads(b64url_decode(parts[0]))
    payload = json.loads(b64url_decode(parts[1]))

    if header.get("alg") != "HS256":
        raise ValueError("unexpected jwt algorithm")

    message = f"{parts[0]}.{parts[1]}"
    expected = sign(message)
    if not hmac.compare_digest(expected, parts[2]):
        raise ValueError("invalid signature")

    return header, payload


STUDENT_TOKEN = create_token(
    {"sub": "student-101", "name": "Pavan Student", "role": "student"}
)


def page(content):
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VulnMentor JWT Tampering Lab</title>
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
      <div class="status">Local isolated API lab : vulnerable JWT mode</div>
    </div>
  </header>
  <main>{content}</main>
</body>
</html>"""


def home():
    traces = html.escape("\n".join(TRACES[-10:]) or "No traces yet.")
    token = html.escape(STUDENT_TOKEN)
    return page(
        f"""
<div class="hero">
  <section>
    <h1>JWT Tampering Lab</h1>
    <p>
      This API accepts a JWT-like token. The vulnerable endpoint decodes claims and trusts the role without verifying the signature. Your task is to understand why claim tampering works and capture the flag.
    </p>
    <div class="meta">
      <div class="meta-row"><span>Category</span><strong>API Security</strong></div>
      <div class="meta-row"><span>OWASP Mapping</span><strong>API2 Broken Authentication</strong></div>
      <div class="meta-row"><span>Normal Role</span><strong>student</strong></div>
    </div>
  </section>
  <section>
    <h2>Student Token</h2>
    <pre>{token}</pre>
    <a class="endpoint" href="/api/debug/decode?token={token}">GET /api/debug/decode?token=...</a>
    <a class="endpoint" href="/api/admin/report?token={token}">GET /api/admin/report?token=...</a>
    <a class="endpoint" href="/secure/api/admin/report?token={token}">GET /secure/api/admin/report?token=...</a>
  </section>
</div>
<div class="grid">
  <section>
    <h2>Lab Interfaces</h2>
    <span class="endpoint">GET /health</span>
    <span class="endpoint">GET /traces</span>
    <span class="endpoint">GET /api/token/student</span>
    <span class="endpoint">GET /api/debug/decode?token=&lt;jwt&gt;</span>
    <span class="endpoint">GET /api/admin/report?token=&lt;jwt&gt;</span>
    <span class="endpoint">GET /secure/api/admin/report?token=&lt;jwt&gt;</span>
    <div class="notice bad">
      This is a local learning lab. Do not test token tampering against third-party APIs or accounts.
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

        if parsed.path == "/api/token/student":
            record_trace(f"GET /api/token/student status=200 ip={self.client_address[0]}")
            self.respond_json({"token": STUDENT_TOKEN, "role": "student"})
            return

        if parsed.path == "/api/debug/decode":
            self.handle_decode(query)
            return

        if parsed.path == "/api/admin/report":
            self.handle_admin_report(query, secure=False)
            return

        if parsed.path == "/secure/api/admin/report":
            self.handle_admin_report(query, secure=True)
            return

        self.respond_json({"error": "not_found"}, status=404)

    def handle_decode(self, query):
        token = query.get("token", [""])[0]
        try:
            header, payload = decode_token_without_verification(token)
        except Exception as error:
            record_trace(
                f"GET /api/debug/decode status=400 ip={self.client_address[0]} error={error}"
            )
            self.respond_json({"error": "invalid_token", "detail": str(error)}, status=400)
            return

        record_trace(
            f"GET /api/debug/decode status=200 ip={self.client_address[0]} role={payload.get('role', 'missing')}"
        )
        self.respond_json({"header": header, "payload": payload})

    def handle_admin_report(self, query, secure):
        token = query.get("token", [""])[0]
        mode = "secure" if secure else "vulnerable"

        try:
            if secure:
                header, payload = verify_hs256_token(token)
            else:
                header, payload = decode_token_without_verification(token)
        except Exception as error:
            record_trace(
                f"GET /{mode}/admin/report status=401 ip={self.client_address[0]} error={error}"
            )
            self.respond_json({"error": "invalid_token", "detail": str(error)}, status=401)
            return

        role = payload.get("role", "missing")
        subject = payload.get("sub", "unknown")

        if role != "admin":
            record_trace(
                f"GET /{mode}/admin/report status=403 ip={self.client_address[0]} sub={subject} role={role}"
            )
            self.respond_json({"error": "forbidden", "requiredRole": "admin"}, status=403)
            return

        record_trace(
            f"GET /{mode}/admin/report status=200 ip={self.client_address[0]} sub={subject} role={role} alg={header.get('alg', 'missing')}"
        )
        self.respond_json(
            {
                "mode": mode,
                "subject": subject,
                "role": role,
                "report": "Quarterly admin-only incident summary",
                "flag": FLAG,
            }
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
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    record_trace("lab booted api=jwt mode=vulnerable secure_compare=true")
    server = HTTPServer(("0.0.0.0", PORT), LabHandler)
    print(f"VulnMentor JWT lab running on http://0.0.0.0:{PORT}")
    server.serve_forever()
