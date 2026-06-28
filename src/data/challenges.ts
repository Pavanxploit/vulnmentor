export type ChallengeStatus = "available" | "planned";

export type Hint = {
  title: string;
  body: string;
};

export type CodePair = {
  vulnerable: string;
  secure: string;
};

export type LabEndpoint = {
  baseUrl: string;
  healthUrl: string;
  tracesUrl: string;
};

export type Challenge = {
  id: string;
  title: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: ChallengeStatus;
  time: string;
  points: number;
  verifierId: string;
  summary: string;
  skills: string[];
  workflow: string[];
  hints: Hint[];
  logs: string[];
  rootCause: string;
  mitigation: string[];
  impact: string;
  code: CodePair;
  console?: string[];
  lab?: LabEndpoint;
};

export const challenges: Challenge[] = [
  {
    id: "web-sqli-login",
    title: "Login Bypass With SQL Injection",
    category: "Web Security",
    difficulty: "Easy",
    status: "available",
    time: "25 min",
    points: 100,
    verifierId: "web-sqli-login",
    lab: {
      baseUrl: "http://127.0.0.1:4010",
      healthUrl: "http://127.0.0.1:4010/health",
      tracesUrl: "http://127.0.0.1:4010/traces",
    },
    summary:
      "A login form trusts raw user input and builds a SQL query without parameter binding.",
    skills: ["OWASP A03 Injection", "Authentication", "Secure SQL"],
    workflow: ["Attack", "Root Cause", "Detection", "Defense"],
    hints: [
      {
        title: "Hint 1",
        body: "Focus on how the username and password values are combined with the database query.",
      },
      {
        title: "Hint 2",
        body: "If input is placed directly inside quoted SQL strings, a crafted value can change the query logic.",
      },
      {
        title: "Hint 3",
        body: "Try proving that the WHERE clause can be made true without knowing the original password.",
      },
    ],
    logs: [
      "10:21:43 POST /login username=student password=******** status=401",
      "10:24:18 POST /login username=admin'-- password=demo status=401",
      "10:26:02 POST /login username=admin' OR '1'='1 password=test status=200",
      "10:26:03 SESSION role=admin source=lab-web-01 status=created",
    ],
    rootCause:
      "The application concatenates untrusted input into a SQL statement. The database receives user text as executable query logic instead of treating it as data.",
    mitigation: [
      "Use prepared statements with placeholders for every user-controlled value.",
      "Validate input length and expected format before database access.",
      "Return generic login errors and monitor abnormal authentication patterns.",
      "Add tests that submit SQL metacharacters to authentication endpoints.",
    ],
    impact:
      "An attacker can bypass authentication, access protected data, and perform actions as another user.",
    console: [
      "$ curl -i http://127.0.0.1:4010/login",
      "HTTP/1.1 200 OK | form fields: username, password",
      "$ submit payload through the login form",
      "Monitor result in attack traces...",
    ],
    code: {
      vulnerable: `const query =
  "SELECT * FROM users WHERE username='" +
  username +
  "' AND password='" +
  password +
  "'";

const user = await db.get(query);`,
      secure: `const user = await db.get(
  "SELECT * FROM users WHERE username = ? AND password_hash = ?",
  [username, passwordHash]
);`,
    },
  },
  {
    id: "web-xss-comment",
    title: "Stored XSS In Comments",
    category: "Web Security",
    difficulty: "Medium",
    status: "available",
    time: "35 min",
    points: 140,
    verifierId: "web-xss-comment",
    lab: {
      baseUrl: "http://127.0.0.1:4060",
      healthUrl: "http://127.0.0.1:4060/health",
      tracesUrl: "http://127.0.0.1:4060/traces",
    },
    summary:
      "A comment board stores student input and a reviewer page renders that stored content without output encoding.",
    skills: ["OWASP A03 Injection", "Output Encoding", "Browser Security"],
    workflow: ["Store Comment", "Trigger Review", "Collect Proof", "Compare Fix"],
    hints: [
      {
        title: "Hint 1",
        body: "Start by submitting a harmless comment and compare how the public board and admin review page display it.",
      },
      {
        title: "Hint 2",
        body: "The vulnerable sink is the reviewer view. Stored content is inserted as HTML there instead of being treated as text.",
      },
      {
        title: "Hint 3",
        body: "The objective is to prove browser execution in the local admin review flow and send the readable lab cookie to the collector endpoint.",
      },
    ],
    logs: [
      "15:18:09 POST /comment author=student length=128 stored=true",
      "15:18:24 GET /admin/review status=200 sink=raw-html cookie=readable",
      "15:18:25 GET /collect status=200 source=127.0.0.1 solved=true",
      "15:19:12 GET /secure/review status=200 sink=encoded cookie=httponly",
    ],
    rootCause:
      "The application stores untrusted comments and later renders them as HTML in the admin review page. Because output encoding is missing at the sink, the browser can interpret stored user input as active content.",
    mitigation: [
      "Encode user-controlled content before rendering it into HTML pages.",
      "Avoid raw HTML rendering APIs unless the content is trusted and sanitized with an allowlist.",
      "Use HttpOnly and SameSite cookies so browser scripts cannot read sensitive session values.",
      "Add a restrictive Content Security Policy to reduce script execution impact.",
      "Test every stored-content display path, not only the original form submission page.",
    ],
    impact:
      "An attacker can store malicious browser content that executes later when a reviewer or admin opens the page, potentially stealing session data or performing actions as that user.",
    console: [
      "$ open http://127.0.0.1:4060",
      "$ submit a stored browser-execution proof through the comment form",
      "$ open /admin/review to trigger the vulnerable rendering path",
      "$ check /loot and /traces for the captured local flag",
    ],
    code: {
      vulnerable: `comments.map((comment) => (
  <div
    key={comment.id}
    dangerouslySetInnerHTML={{ __html: comment.body }}
  />
));`,
      secure: `comments.map((comment) => (
  <p key={comment.id}>{comment.body}</p>
));

response.setHeader(
  "Set-Cookie",
  "session=...; HttpOnly; SameSite=Lax; Secure"
);`,
    },
  },
  {
    id: "api-broken-auth",
    title: "Broken API Authorization",
    category: "API Security",
    difficulty: "Medium",
    status: "available",
    time: "35 min",
    points: 160,
    verifierId: "api-broken-auth",
    lab: {
      baseUrl: "http://127.0.0.1:4020",
      healthUrl: "http://127.0.0.1:4020/health",
      tracesUrl: "http://127.0.0.1:4020/traces",
    },
    summary:
      "An API validates the token but forgets to verify that the requested account object belongs to the authenticated user.",
    skills: ["OWASP API1 BOLA", "Access Control", "API Testing"],
    workflow: ["Recon API", "Change Object ID", "Capture Flag", "Compare Fix"],
    hints: [
      {
        title: "Hint 1",
        body: "Start with the normal student token and inspect which account id belongs to that student.",
      },
      {
        title: "Hint 2",
        body: "The token proves who you are. The vulnerable endpoint still has to check whether the requested object belongs to you.",
      },
      {
        title: "Hint 3",
        body: "Compare the vulnerable account endpoint with the secure endpoint after changing the numeric account id.",
      },
    ],
    logs: [
      "11:04:08 GET /api/me token=student-token status=200 user=user-100",
      "11:05:12 GET /api/accounts/1001 status=200 user=user-100 owner=user-100",
      "11:06:44 GET /api/accounts/1002 status=200 user=user-100 owner=user-200 alert=BOLA",
      "11:07:01 GET /secure/api/accounts/1002 status=403 user=user-100 owner=user-200",
    ],
    rootCause:
      "The API authenticates the token but does not authorize access to the requested object. A valid student token can request another account id because the handler returns records by id without checking ownerId against the authenticated user.",
    mitigation: [
      "Check object ownership or permission before returning every object-level resource.",
      "Derive accessible objects from the authenticated user context instead of trusting request parameters.",
      "Return 403 for existing objects that the user is not allowed to access.",
      "Add authorization tests that attempt cross-user object access for every sensitive endpoint.",
      "Log owner mismatches as possible BOLA or IDOR attempts.",
    ],
    impact:
      "An attacker with a normal account can read another user's records, API key metadata, internal notes, or flags by changing object identifiers.",
    console: [
      '$ curl "http://127.0.0.1:4020/api/me?token=student-token"',
      '$ curl "http://127.0.0.1:4020/api/accounts/1001?token=student-token"',
      "$ change the account id and compare /secure/api/accounts/{id}",
      "Monitor BOLA owner mismatches in attack traces...",
    ],
    code: {
      vulnerable: `const user = getUserFromToken(token);
const account = accounts[accountId];

if (!user || !account) {
  return response.status(404).json({ error: "not_found" });
}

return response.json(account);`,
      secure: `const user = getUserFromToken(token);
const account = accounts[accountId];

if (!user || !account) {
  return response.status(404).json({ error: "not_found" });
}

if (account.ownerId !== user.id) {
  return response.status(403).json({ error: "forbidden" });
}

return response.json(account);`,
    },
  },
  {
    id: "api-jwt-tampering",
    title: "JWT Role Tampering",
    category: "API Security",
    difficulty: "Medium",
    status: "available",
    time: "35 min",
    points: 170,
    verifierId: "api-jwt-tampering",
    lab: {
      baseUrl: "http://127.0.0.1:4030",
      healthUrl: "http://127.0.0.1:4030/health",
      tracesUrl: "http://127.0.0.1:4030/traces",
    },
    summary:
      "An API decodes JWT claims and trusts the role field without enforcing signature and algorithm verification.",
    skills: ["OWASP API2 Broken Authentication", "JWT", "Access Control"],
    workflow: ["Inspect Token", "Tamper Claims", "Compare Verification", "Capture Flag"],
    hints: [
      {
        title: "Hint 1",
        body: "Start by decoding the student token and observing which claim controls authorization.",
      },
      {
        title: "Hint 2",
        body: "The vulnerable endpoint reads token claims. Ask whether it proves that those claims were signed by the server.",
      },
      {
        title: "Hint 3",
        body: "Compare the vulnerable admin endpoint with the secure endpoint after changing the role claim.",
      },
    ],
    logs: [
      "12:11:22 GET /api/token/student status=200 role=student",
      "12:12:04 GET /api/debug/decode status=200 role=student",
      "12:14:18 GET /api/admin/report status=200 role=admin alg=none",
      "12:14:31 GET /secure/api/admin/report status=401 error=unexpected_jwt_algorithm",
    ],
    rootCause:
      "The vulnerable endpoint decodes token header and payload data, then trusts the role claim without validating the signature or enforcing the expected JWT algorithm. A token is only trustworthy after the server verifies that it was signed by a trusted issuer.",
    mitigation: [
      "Verify JWT signatures before trusting any claim.",
      "Enforce a strict allowlist of algorithms such as HS256 or RS256 instead of trusting the token header.",
      "Reject unsigned tokens and tokens with unexpected algorithms.",
      "Keep authorization decisions on the server side and validate role changes against server-owned data.",
      "Add tests for tampered payloads, empty signatures, and algorithm-confusion cases.",
    ],
    impact:
      "An attacker can change claims such as role or user id and access admin-only API responses if the backend trusts unverified JWT contents.",
    console: [
      '$ curl "http://127.0.0.1:4030/api/token/student"',
      '$ curl "http://127.0.0.1:4030/api/debug/decode?token=<token>"',
      "$ compare vulnerable and secure admin report endpoints",
      "Monitor JWT verification failures in attack traces...",
    ],
    code: {
      vulnerable: `const payload = decodeJwtWithoutVerification(token);

if (payload.role !== "admin") {
  return response.status(403).json({ error: "forbidden" });
}

return response.json(adminReport);`,
      secure: `const payload = verifyJwt(token, {
  algorithms: ["HS256"],
  secret: process.env.JWT_SECRET,
});

if (payload.role !== "admin") {
  return response.status(403).json({ error: "forbidden" });
}

return response.json(adminReport);`,
    },
  },
  {
    id: "api-rate-limit-bypass",
    title: "OTP Rate Limit Bypass",
    category: "API Security",
    difficulty: "Medium",
    status: "available",
    time: "35 min",
    points: 180,
    verifierId: "api-rate-limit-bypass",
    lab: {
      baseUrl: "http://127.0.0.1:4040",
      healthUrl: "http://127.0.0.1:4040/health",
      tracesUrl: "http://127.0.0.1:4040/traces",
    },
    summary:
      "A password-reset API rate-limits OTP attempts using a spoofable client key instead of a stable account or session key.",
    skills: [
      "OWASP API4 Resource Consumption",
      "Rate Limiting",
      "Authentication Abuse",
    ],
    workflow: ["Start OTP Flow", "Trigger Limit", "Bypass Key", "Compare Fix"],
    hints: [
      {
        title: "Hint 1",
        body: "Start by sending incorrect OTP attempts and observe what value the API uses as the rate-limit key.",
      },
      {
        title: "Hint 2",
        body: "If a limit is tied to a value the client can influence, the client may be able to reset the counter.",
      },
      {
        title: "Hint 3",
        body: "Compare the vulnerable endpoint with the secure endpoint. The secure endpoint ignores spoofed network metadata and limits by account.",
      },
    ],
    logs: [
      "13:05:10 GET /api/otp/start status=200 account=student@example.test",
      "13:06:02 GET /api/otp/verify status=401 key=127.0.0.1 remaining=2",
      "13:06:45 GET /api/otp/verify status=401 key=10.10.10.10 remaining=2",
      "13:07:22 GET /secure/api/otp/verify status=429 key=student@example.test",
    ],
    rootCause:
      "The vulnerable endpoint trusts client-controlled network metadata as the rate-limit key. An attacker can change that key between requests, causing the API to create fresh counters instead of enforcing a stable limit for the protected account or reset flow.",
    mitigation: [
      "Rate-limit sensitive actions by stable server-side keys such as account id, session id, reset flow id, or verified user id.",
      "Do not trust X-Forwarded-For or similar headers unless they are set by a trusted reverse proxy.",
      "Apply rate limits at multiple layers: account, IP, device, endpoint, and global service level.",
      "Return generic OTP errors and log high-volume failed attempts.",
      "Add tests that spoof headers and confirm the limit still applies to the same protected account.",
    ],
    impact:
      "An attacker can keep guessing OTP or reset codes beyond the intended limit, increasing the chance of account takeover or resource exhaustion.",
    console: [
      '$ curl "http://127.0.0.1:4040/api/otp/start"',
      '$ curl "http://127.0.0.1:4040/api/otp/verify?code=000000"',
      "$ repeat with changed X-Forwarded-For and compare the secure endpoint",
      "Monitor spoofed rate-limit keys in attack traces...",
    ],
    code: {
      vulnerable: `const limitKey =
  request.headers["x-forwarded-for"] ?? request.ip;

if (tooManyAttempts(limitKey)) {
  return response.status(429).json({ error: "rate_limited" });
}

return verifyOtp(code);`,
      secure: `const flow = getResetFlow(request.session.flowId);
const limitKey = flow.accountId;

if (tooManyAttempts(limitKey)) {
  return response.status(429).json({ error: "rate_limited" });
}

return verifyOtp(code);`,
    },
  },
  {
    id: "api-excessive-data-exposure",
    title: "Excessive Data Exposure",
    category: "API Security",
    difficulty: "Easy",
    status: "available",
    time: "25 min",
    points: 130,
    verifierId: "api-excessive-data-exposure",
    lab: {
      baseUrl: "http://127.0.0.1:4050",
      healthUrl: "http://127.0.0.1:4050/health",
      tracesUrl: "http://127.0.0.1:4050/traces",
    },
    summary:
      "A profile API returns the full database record, exposing internal and sensitive fields that the client does not need.",
    skills: [
      "OWASP API3 BOPLA",
      "Data Minimization",
      "Response Filtering",
    ],
    workflow: ["Request Profile", "Inspect JSON", "Compare Secure Response", "Capture Flag"],
    hints: [
      {
        title: "Hint 1",
        body: "Do not only look at what the browser page displays. Inspect the raw JSON returned by the API.",
      },
      {
        title: "Hint 2",
        body: "Ask which fields the client actually needs to render the profile screen.",
      },
      {
        title: "Hint 3",
        body: "Compare the vulnerable profile endpoint with the secure endpoint and look for fields removed from the response.",
      },
    ],
    logs: [
      "14:02:10 GET /api/profile status=200 user=user-100 fields=14 sensitive=passwordResetToken,mfaBackupCodes,flag",
      "14:03:22 GET /secure/api/profile status=200 user=user-100 fields=7 sensitive=0",
      "14:04:15 DATA_EXPOSURE profile contained server-only properties",
    ],
    rootCause:
      "The API serializes and returns the entire user record from storage. Authorization may be valid, but object properties still need authorization and filtering. The server should only return the fields required for the client workflow.",
    mitigation: [
      "Use response DTOs or serializers that explicitly allowlist safe fields.",
      "Never return raw database objects directly from API handlers.",
      "Classify fields as public, internal, secret, or regulated before designing responses.",
      "Write tests that assert sensitive fields never appear in client-facing JSON.",
      "Log and review endpoints that return unusually large or sensitive response bodies.",
    ],
    impact:
      "Sensitive data such as reset tokens, backup codes, internal risk scores, feature flags, billing references, or flags can leak to normal authenticated users.",
    console: [
      '$ curl "http://127.0.0.1:4050/api/profile?token=student-token"',
      '$ curl "http://127.0.0.1:4050/secure/api/profile?token=student-token"',
      "$ compare the field lists and identify server-only data",
      "Monitor sensitive field exposure in attack traces...",
    ],
    code: {
      vulnerable: `const user = await db.users.findById(userId);

// Returns every stored property, including server-only fields.
return response.json({ profile: user });`,
      secure: `const user = await db.users.findById(userId);

return response.json({
  profile: {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    department: user.department,
    avatar: user.avatar,
    joinedAt: user.joinedAt,
  },
});`,
    },
  },
];

export const activeChallenge = challenges.find(
  (challenge) => challenge.status === "available",
)!;
