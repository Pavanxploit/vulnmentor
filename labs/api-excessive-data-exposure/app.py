from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse
import html
import json
import time

PORT = 4050
FLAG = "VM{return_only_required_fields}"
TRACES = []

TOKENS = {
    "student-token": "user-100",
}

USER_RECORDS = {
    "user-100": {
        "id": "user-100",
        "displayName": "Pavan Student",
        "email": "student@example.test",
        "role": "student",
        "department": "Cyber Security",
        "avatar": "/avatars/student.png",
        "joinedAt": "2026-01-10",
        "internalRiskScore": 74,
        "passwordResetToken": "reset_demo_do_not_expose_8f31",
        "mfaBackupCodes": ["142991", "583002", "901744"],
        "supportNotes": "Learner account. Hide internal notes from public clients.",
        "billingProfileId": "bill_demo_44af",
        "featureFlags": ["beta-admin-preview", "lab-fast-path"],
        "flag": FLAG,
    }
}

PUBLIC_FIELDS = [
    "id",
    "displayName",
    "email",
    "role",
    "department",
    "avatar",
    "joinedAt",
]

SENSITIVE_FIELDS = [
    "internalRiskScore",
    "passwordResetToken",
    "mfaBackupCodes",
    "supportNotes",
    "billingProfileId",
    "featureFlags",
    "flag",
]


def record_trace(message):
    timestamp = time.strftime("%H:%M:%S")
    TRACES.append(f"{timestamp} {message}")
    if len(TRACES) > 50:
        TRACES.pop(0)


def public_profile(record):
    return {field: record[field] for field in PUBLIC_FIELDS}


def page(content):
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VulnMentor Excessive Data Exposure Lab</title>
  <style>
    :root {{
      --ink: #121614;
      --muted: #66716b;
      --line: #dfe3db;
      --panel: #ffffff;
      --wash: #f5f6f1;
      --accent: #0f6b53;
      --danger: #a03434;
      --code: #101411;
    }}
    body {{
      margin: 0;
      background: var(--wash);
      color: var(--ink);
      font-family: Arial, Helvetica, sans-serif;
    }}
    header {{
      border-bottom: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.88);
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
    code, pre {{
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
    }}
    .bad {{
      border-color: #efcaca;
      background: #fff3f3;
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
    }}
  </style>
</head>
<body>
  <header>
    <div class="bar">
      <div class="brand">VulnMentor Sandbox</div>
      <div class="status">Local isolated API lab : excessive data mode</div>
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
    <h1>API Excessive Data Exposure Lab</h1>
    <p>
      This profile API returns the complete database object to the client. A UI might hide sensitive values, but attackers can inspect the raw JSON response.
    </p>
    <div class="meta">
      <div class="meta-row"><span>Category</span><strong>API Security</strong></div>
      <div class="meta-row"><span>OWASP Mapping</span><strong>API3 Broken Object Property Authorization</strong></div>
      <div class="meta-row"><span>Token</span><strong>student-token</strong></div>
    </div>
  </section>
  <section>
    <h2>Try These Requests</h2>
    <a class="endpoint" href="/api/profile?token=student-token">GET /api/profile?token=student-token</a>
    <a class="endpoint" href="/secure/api/profile?token=student-token">GET /secure/api/profile?token=student-token</a>
    <div class="notice">
      Compare the field list returned by the vulnerable endpoint with the secure endpoint.
    </div>
  </section>
</div>
<div class="grid">
  <section>
    <h2>Lab Interfaces</h2>
    <span class="endpoint">GET /health</span>
    <span class="endpoint">GET /traces</span>
    <span class="endpoint">GET /api/profile?token=student-token</span>
    <span class="endpoint">GET /secure/api/profile?token=student-token</span>
    <div class="notice bad">
      This is a local learning lab. Do not inspect or scrape real user data from systems you do not own.
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

        if parsed.path == "/api/profile":
            self.handle_profile(query, secure=False)
            return

        if parsed.path == "/secure/api/profile":
            self.handle_profile(query, secure=True)
            return

        self.respond_json({"error": "not_found"}, status=404)

    def handle_profile(self, query, secure):
        token = query.get("token", [""])[0]
        user_id = TOKENS.get(token)
        mode = "secure" if secure else "vulnerable"

        if not user_id:
            record_trace(f"GET /{mode}/profile status=401 ip={self.client_address[0]}")
            self.respond_json({"error": "invalid_token"}, status=401)
            return

        record = USER_RECORDS[user_id]

        if secure:
            payload = public_profile(record)
            record_trace(
                f"GET /secure/profile status=200 user={user_id} fields={len(payload)} sensitive=0"
            )
        else:
            payload = dict(record)
            record_trace(
                f"GET /api/profile status=200 user={user_id} fields={len(payload)} sensitive={','.join(SENSITIVE_FIELDS)}"
            )

        self.respond_json({"mode": mode, "profile": payload})

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
    record_trace("lab booted api=profile mode=vulnerable secure_compare=true")
    server = HTTPServer(("0.0.0.0", PORT), LabHandler)
    print(f"VulnMentor Excessive Data Exposure lab running on http://0.0.0.0:{PORT}")
    server.serve_forever()
