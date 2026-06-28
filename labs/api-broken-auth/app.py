from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse
import html
import json
import time

PORT = 4020
FLAG = "VM{api_bola_idor_mastered}"

USERS_BY_TOKEN = {
    "student-token": {
        "id": "user-100",
        "name": "Pavan Student",
        "role": "student",
        "accounts": ["1001"],
    },
    "analyst-token": {
        "id": "user-200",
        "name": "Internal Analyst",
        "role": "analyst",
        "accounts": ["1002"],
    },
}

ACCOUNTS = {
    "1001": {
        "accountId": "1001",
        "ownerId": "user-100",
        "ownerName": "Pavan Student",
        "plan": "Student Lab",
        "apiKeyLast4": "7Q2A",
        "riskNote": "Normal learner account.",
    },
    "1002": {
        "accountId": "1002",
        "ownerId": "user-200",
        "ownerName": "Internal Analyst",
        "plan": "Admin Review",
        "apiKeyLast4": "9K4Z",
        "riskNote": "Sensitive support record exposed by broken object authorization.",
        "flag": FLAG,
    },
}

TRACES = []


def record_trace(message):
    timestamp = time.strftime("%H:%M:%S")
    TRACES.append(f"{timestamp} {message}")
    if len(TRACES) > 40:
        TRACES.pop(0)


def page(content):
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VulnMentor API BOLA Lab</title>
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
      min-height: 142px;
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
      <div class="status">Local isolated API lab : vulnerable mode</div>
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
    <h1>API Broken Authorization Lab</h1>
    <p>
      This API checks whether a token is valid, but the vulnerable endpoint forgets to verify object ownership. Your task is to find another account record and capture the flag.
    </p>
    <div class="meta">
      <div class="meta-row"><span>Category</span><strong>API Security</strong></div>
      <div class="meta-row"><span>OWASP Mapping</span><strong>API1 BOLA</strong></div>
      <div class="meta-row"><span>Student Token</span><strong>student-token</strong></div>
    </div>
  </section>
  <section>
    <h2>Try These Requests</h2>
    <a class="endpoint" href="/api/me?token=student-token">GET /api/me?token=student-token</a>
    <a class="endpoint" href="/api/accounts/1001?token=student-token">GET /api/accounts/1001?token=student-token</a>
    <a class="endpoint" href="/secure/api/accounts/1001?token=student-token">GET /secure/api/accounts/1001?token=student-token</a>
    <div class="notice">
      Start with account <code>1001</code>. Then reason about what happens if an API trusts a user-supplied object id.
    </div>
  </section>
</div>
<div class="grid">
  <section>
    <h2>Lab Interfaces</h2>
    <span class="endpoint">GET /health</span>
    <span class="endpoint">GET /traces</span>
    <span class="endpoint">GET /api/accounts/&lt;account_id&gt;?token=student-token</span>
    <span class="endpoint">GET /secure/api/accounts/&lt;account_id&gt;?token=student-token</span>
    <div class="notice bad">
      Keep testing inside this local sandbox only. Do not test object-id manipulation on websites or APIs without permission.
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

        if parsed.path == "/api/me":
            self.handle_me(query)
            return

        if parsed.path.startswith("/api/accounts/"):
            account_id = parsed.path.removeprefix("/api/accounts/")
            self.handle_account(query, account_id, secure=False)
            return

        if parsed.path.startswith("/secure/api/accounts/"):
            account_id = parsed.path.removeprefix("/secure/api/accounts/")
            self.handle_account(query, account_id, secure=True)
            return

        self.respond_json({"error": "not_found"}, status=404)

    def handle_me(self, query):
        user = user_from_query(query)
        if not user:
            record_trace(f"GET /api/me status=401 ip={self.client_address[0]}")
            self.respond_json({"error": "invalid_token"}, status=401)
            return

        record_trace(
            f"GET /api/me status=200 ip={self.client_address[0]} user={user['id']}"
        )
        self.respond_json(
            {
                "id": user["id"],
                "name": user["name"],
                "role": user["role"],
                "ownedAccounts": user["accounts"],
            }
        )

    def handle_account(self, query, account_id, secure):
        user = user_from_query(query)
        mode = "secure" if secure else "vulnerable"

        if not user:
            record_trace(
                f"GET /{mode}/accounts/{account_id} status=401 ip={self.client_address[0]}"
            )
            self.respond_json({"error": "invalid_token"}, status=401)
            return

        account = ACCOUNTS.get(account_id)
        if not account:
            record_trace(
                f"GET /{mode}/accounts/{account_id} status=404 ip={self.client_address[0]} user={user['id']}"
            )
            self.respond_json({"error": "account_not_found"}, status=404)
            return

        owns_account = account["ownerId"] == user["id"]
        if secure and not owns_account:
            record_trace(
                f"GET /secure/accounts/{account_id} status=403 ip={self.client_address[0]} user={user['id']} owner={account['ownerId']}"
            )
            self.respond_json({"error": "forbidden", "reason": "owner_mismatch"}, status=403)
            return

        if not secure and not owns_account:
            record_trace(
                f"GET /api/accounts/{account_id} status=200 ip={self.client_address[0]} user={user['id']} owner={account['ownerId']} alert=BOLA"
            )
        else:
            record_trace(
                f"GET /{mode}/accounts/{account_id} status=200 ip={self.client_address[0]} user={user['id']}"
            )

        self.respond_json(
            {
                "mode": mode,
                "authenticatedUser": user["id"],
                "account": account,
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


def user_from_query(query):
    token = query.get("token", [""])[0]
    return USERS_BY_TOKEN.get(token)


if __name__ == "__main__":
    record_trace("lab booted api=accounts mode=vulnerable secure_compare=true")
    server = HTTPServer(("0.0.0.0", PORT), LabHandler)
    print(f"VulnMentor API BOLA lab running on http://0.0.0.0:{PORT}")
    server.serve_forever()
