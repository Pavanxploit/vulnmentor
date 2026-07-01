export type ChallengeStatus = "available" | "planned";

export type Hint = {
  title: string;
  body: string;
};

export type CodePair = {
  vulnerable: string;
  secure: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type ChallengeTeaching = {
  lessonSlug: string;
  beginnerIntro: {
    what: string;
    why: string;
    where: string;
    normalFeature: string;
    developerMistake: string;
  };
  mentalModel: string[];
  prerequisites: string[];
  methodology: string[];
  evidenceChecklist: string[];
  commonMistakes: string[];
  reportTemplate: string;
  quiz: QuizQuestion[];
  postLabDebrief: {
    whatHappened: string;
    whyItWorked: string;
    realWorldImpact: string;
    howToFix: string;
    reportNote: string;
    nextLesson: string;
  };
};

export type LabEndpoint = {
  baseUrl: string;
  healthUrl: string;
  tracesUrl: string;
  serviceName: string;
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
  teaching: ChallengeTeaching;
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
      serviceName: "sql-injection-login",
    },
    summary:
      "A login form trusts raw user input and builds a SQL query without parameter binding.",
    teaching: {
      lessonSlug: "sql-injection",
      beginnerIntro: {
        what:
          "SQL injection happens when user input becomes part of a database command instead of staying as plain data.",
        why:
          "Login, search, filter, and admin screens often depend on database queries. If the query can be changed by input, the application may trust the wrong result.",
        where:
          "It commonly appears in login forms, search boxes, URL parameters, report filters, and old code that builds SQL strings manually.",
        normalFeature:
          "A normal login takes a username and password, sends them to the server, and the server checks whether one matching user record exists.",
        developerMistake:
          "The developer joins username and password directly into the SQL text, so input can change the WHERE clause.",
      },
      mentalModel: [
        "User types login data",
        "Backend joins that data into a SQL string",
        "Database reads the final string as command logic",
        "Changed condition returns a user",
        "Application creates a logged-in session",
      ],
      prerequisites: [
        "Know what a login form does.",
        "Know that a database query asks for rows from a table.",
        "Know the difference between data and code.",
      ],
      methodology: [
        "Observe normal behavior with an incorrect username and password.",
        "Identify the inputs controlled by the user: username and password.",
        "Change one input at a time and watch the response and traces.",
        "Compare the vulnerable login with the secure query pattern.",
        "Collect evidence from the successful local response and trace log.",
        "Submit the flag only after you can explain why the query changed.",
        "Write the root cause and prepared-statement fix in your notes.",
      ],
      evidenceChecklist: [
        "Request tested: POST /login.",
        "Parameter changed: username or password.",
        "Response difference: failed login became successful login.",
        "Trace proof: login status changed and role/session was created.",
        "Impact statement: authentication can be bypassed in the vulnerable lab.",
        "Secure comparison: parameterized query keeps SQL structure fixed.",
        "Fix recommendation: prepared statements plus safe login monitoring.",
      ],
      commonMistakes: [
        "Trying random payloads before checking normal login behavior.",
        "Thinking input validation alone is enough to replace prepared statements.",
        "Ignoring the secure comparison endpoint or code sample.",
      ],
      reportTemplate:
        "The login endpoint builds a SQL query by concatenating user-controlled input. In the VulnMentor local lab, changing the login input changed the query logic and produced a successful login. The fix is to use prepared statements with placeholders for all user values and monitor abnormal authentication attempts.",
      quiz: [
        {
          question: "What is the main mistake in this lab?",
          options: [
            "The server builds SQL using raw user input.",
            "The username field is too short.",
            "The page has a dark theme.",
            "The login button is visible.",
          ],
          answer: "The server builds SQL using raw user input.",
          explanation:
            "The danger is not the form itself. The danger is treating user text as executable SQL logic.",
        },
        {
          question: "Which fix is the best first defense?",
          options: [
            "Prepared statements with placeholders.",
            "A longer password field.",
            "Hiding the login page.",
            "Changing button color.",
          ],
          answer: "Prepared statements with placeholders.",
          explanation:
            "Prepared statements keep the SQL command structure separate from user-supplied values.",
        },
        {
          question: "True or false: A SQL injection test should be done only in the VulnMentor local lab or a system you are authorized to test.",
          options: ["True", "False"],
          answer: "True",
          explanation:
            "VulnMentor teaching is limited to safe local Docker labs and authorized environments.",
        },
      ],
      postLabDebrief: {
        whatHappened:
          "The login accepted input that changed the database condition and treated the result as a valid user.",
        whyItWorked:
          "The backend mixed user-controlled text with SQL command text.",
        realWorldImpact:
          "A similar bug could allow account takeover, data access, or admin impersonation.",
        howToFix:
          "Use prepared statements, hash passwords correctly, return generic login errors, and monitor abnormal login attempts.",
        reportNote:
          "Report it as authentication bypass through SQL injection with request, response, trace evidence, root cause, impact, and prepared-statement remediation.",
        nextLesson: "stored-xss",
      },
    },
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
      serviceName: "stored-xss-comment",
    },
    summary:
      "A comment board stores student input and a reviewer page renders that stored content without output encoding.",
    teaching: {
      lessonSlug: "stored-xss",
      beginnerIntro: {
        what:
          "Stored XSS happens when an application saves user input and later renders it in a browser as active HTML or script.",
        why:
          "The dangerous part is timing: the attacker stores content once, then another user or reviewer may trigger it later.",
        where:
          "It can appear in comments, profiles, support tickets, product reviews, chat messages, and admin review queues.",
        normalFeature:
          "A normal comment feature stores text and later displays that text exactly as text.",
        developerMistake:
          "The developer renders stored comment content as raw HTML instead of encoding it for the page context.",
      },
      mentalModel: [
        "Student submits comment text",
        "Backend stores the comment",
        "Reviewer page loads stored content",
        "Page inserts content as raw HTML",
        "Browser executes the active content",
      ],
      prerequisites: [
        "Know that browsers interpret HTML.",
        "Know that stored data may be displayed on a different page later.",
        "Know the difference between rendering text and rendering HTML.",
      ],
      methodology: [
        "Submit a harmless comment and inspect how it appears.",
        "Identify where stored content is displayed again.",
        "Change one input at a time and compare normal display with reviewer display.",
        "Compare vulnerable raw rendering with secure encoded rendering.",
        "Collect evidence from the local collector, response, or traces.",
        "Submit the flag after proving the local stored execution path.",
        "Write root cause and output-encoding fix in your notes.",
      ],
      evidenceChecklist: [
        "Request tested: POST /comment.",
        "Parameter changed: comment body.",
        "Response difference: reviewer page interpreted stored content.",
        "Trace proof: local collector or review trace shows execution.",
        "Impact statement: stored browser execution can affect later viewers.",
        "Secure comparison: safe page renders stored content as text.",
        "Fix recommendation: context-aware output encoding and cookie protections.",
      ],
      commonMistakes: [
        "Testing only the submission page and missing the reviewer sink.",
        "Confusing input filtering with output encoding.",
        "Forgetting that stored bugs may trigger for another user later.",
      ],
      reportTemplate:
        "The comment workflow stores user-controlled content and renders it as raw HTML in the reviewer view. In the VulnMentor local lab, the stored content executed when the review page loaded. The fix is to render untrusted content as text, avoid raw HTML sinks, and protect cookies with HttpOnly and SameSite.",
      quiz: [
        {
          question: "What makes stored XSS different from a one-time reflected issue?",
          options: [
            "The payload is saved and triggered later.",
            "It only happens in APIs.",
            "It does not involve a browser.",
            "It is fixed by changing the database name.",
          ],
          answer: "The payload is saved and triggered later.",
          explanation:
            "Stored XSS persists in application data and can affect a later viewer.",
        },
        {
          question: "Which rendering pattern is safer for untrusted comments?",
          options: [
            "Render as text with automatic escaping.",
            "Render with raw HTML insertion.",
            "Trust all comments from logged-in users.",
            "Hide the comment form.",
          ],
          answer: "Render as text with automatic escaping.",
          explanation:
            "Escaped text prevents the browser from interpreting user content as page markup.",
        },
        {
          question: "True or false: You should test this only inside the local VulnMentor XSS lab.",
          options: ["True", "False"],
          answer: "True",
          explanation:
            "The teaching flow is designed for the local Docker lab, not unauthorized websites.",
        },
      ],
      postLabDebrief: {
        whatHappened:
          "Stored comment content reached a reviewer page that interpreted it as HTML.",
        whyItWorked:
          "The sink used raw rendering instead of context-aware output encoding.",
        realWorldImpact:
          "A similar bug could run actions as a reviewer, expose readable data, or abuse trusted browser sessions.",
        howToFix:
          "Encode output, avoid raw HTML sinks, sanitize only with strict allowlists when HTML is required, and use secure cookie attributes.",
        reportNote:
          "Report it as stored XSS with source, storage location, vulnerable sink, local proof, impact, and output-encoding remediation.",
        nextLesson: "api-bola",
      },
    },
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
      serviceName: "api-broken-auth",
    },
    summary:
      "An API validates the token but forgets to verify that the requested account object belongs to the authenticated user.",
    teaching: {
      lessonSlug: "api-bola",
      beginnerIntro: {
        what:
          "Broken object-level authorization means the API knows who you are but forgets to check whether you can access the object you requested.",
        why:
          "APIs often expose object ids in URLs. If the server trusts the id without an ownership check, one normal user may read another user's data.",
        where:
          "It commonly appears in account records, invoices, orders, documents, profile ids, ticket ids, and mobile API endpoints.",
        normalFeature:
          "A normal account API returns only the account object that belongs to the authenticated user.",
        developerMistake:
          "The developer validates the token, fetches the object by id, and returns it without comparing ownerId or permission.",
      },
      mentalModel: [
        "User sends token",
        "API authenticates the token",
        "User changes object id",
        "API fetches object by id",
        "Ownership check is missing",
        "Another user's object is returned",
      ],
      prerequisites: [
        "Know the difference between authentication and authorization.",
        "Know that URL path ids and query ids are user-controlled.",
        "Know how to compare vulnerable and secure API responses.",
      ],
      methodology: [
        "Observe normal /api/me behavior to learn the current user.",
        "Request the object that belongs to that user.",
        "Change only the object id in the local lab request.",
        "Compare vulnerable endpoint behavior with the secure endpoint.",
        "Collect trace evidence showing user and object owner mismatch.",
        "Submit the flag after explaining the missing ownership check.",
        "Write root cause and object-level authorization fix.",
      ],
      evidenceChecklist: [
        "Request tested: GET /api/accounts/{id}.",
        "Parameter changed: account id.",
        "Response difference: another user's account returned by vulnerable endpoint.",
        "Trace proof: authenticated user and object owner do not match.",
        "Impact statement: normal users can access other users' records.",
        "Secure comparison: secure endpoint returns 403 for the same object.",
        "Fix recommendation: enforce ownership or permission on every object read.",
      ],
      commonMistakes: [
        "Assuming a valid token means access to every id.",
        "Testing only your own object and stopping there.",
        "Relying on hidden frontend buttons instead of server authorization.",
      ],
      reportTemplate:
        "The account API authenticates the token but does not authorize access to the requested object id. In the VulnMentor local lab, changing the account id returned an object owned by another user. The fix is to verify object ownership or permission on the server before returning any object-level resource.",
      quiz: [
        {
          question: "What does authentication prove?",
          options: [
            "Who the user is.",
            "Every object the user can access.",
            "That all ids are safe.",
            "That frontend buttons are secure.",
          ],
          answer: "Who the user is.",
          explanation:
            "Authentication identifies the user. Authorization decides what that user can access.",
        },
        {
          question: "Which line pattern is risky?",
          options: [
            "Fetch object by id and return it without owner check.",
            "Return 403 when owner does not match.",
            "Read user id from verified token.",
            "Log an owner mismatch.",
          ],
          answer: "Fetch object by id and return it without owner check.",
          explanation:
            "The missing object-level permission check is the core BOLA mistake.",
        },
        {
          question: "Which secure response should another user's object return?",
          options: ["403 Forbidden", "200 OK with full object", "500 Error", "302 Redirect"],
          answer: "403 Forbidden",
          explanation:
            "The server should deny access when the authenticated user lacks permission.",
        },
      ],
      postLabDebrief: {
        whatHappened:
          "A normal token could request an object id that belonged to another user.",
        whyItWorked:
          "The handler authenticated the token but skipped object ownership authorization.",
        realWorldImpact:
          "A similar bug could expose invoices, private records, support tickets, or internal account details.",
        howToFix:
          "Always derive accessible objects from the authenticated user context and return 403 when ownership or permission fails.",
        reportNote:
          "Report it as BOLA or IDOR with original object, changed object id, vulnerable response, secure 403 comparison, and owner-mismatch trace.",
        nextLesson: "jwt-tampering",
      },
    },
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
      serviceName: "api-jwt-tampering",
    },
    summary:
      "An API decodes JWT claims and trusts the role field without enforcing signature and algorithm verification.",
    teaching: {
      lessonSlug: "jwt-tampering",
      beginnerIntro: {
        what:
          "JWT tampering happens when a server reads token claims and trusts them without proving the token was signed by a trusted server.",
        why:
          "JWTs often carry user id and role claims. If those claims are trusted after decoding only, a user may turn themselves into an admin inside the vulnerable flow.",
        where:
          "It appears in APIs that use JWT for login sessions, mobile apps, admin dashboards, and microservice authorization.",
        normalFeature:
          "A normal JWT flow verifies the signature, issuer, expiry, audience, and algorithm before trusting any claim.",
        developerMistake:
          "The developer decodes the JWT payload and trusts the role claim without verifying the signature and algorithm.",
      },
      mentalModel: [
        "User sends JWT",
        "API decodes header and payload",
        "Role claim says student or admin",
        "Signature verification is skipped",
        "API trusts attacker-controlled claims",
        "Admin-only response is returned",
      ],
      prerequisites: [
        "Know that JWT payloads are encoded, not encrypted.",
        "Know that signing proves integrity when verified.",
        "Know the difference between decoding and verifying.",
      ],
      methodology: [
        "Fetch the student token from the local lab.",
        "Decode it to identify the role-related claim.",
        "Compare debug decoding with secure verification behavior.",
        "Change one claim at a time only inside the local lab.",
        "Collect evidence from vulnerable and secure admin endpoints.",
        "Submit the flag after explaining why verification matters.",
        "Write root cause and strict JWT verification fix.",
      ],
      evidenceChecklist: [
        "Request tested: admin report endpoint with JWT.",
        "Parameter changed: token claim or algorithm behavior.",
        "Response difference: vulnerable endpoint trusted changed claim.",
        "Trace proof: secure endpoint rejected unexpected token.",
        "Impact statement: role or identity claims can be abused.",
        "Secure comparison: verification blocks invalid signature or algorithm.",
        "Fix recommendation: verify signature, algorithm, issuer, audience, and expiry.",
      ],
      commonMistakes: [
        "Thinking base64url decoding means the token is trusted.",
        "Trusting role claims before signature verification.",
        "Allowing the token header to choose any algorithm.",
      ],
      reportTemplate:
        "The API decodes JWT claims and uses the role value for authorization without verifying the token signature and expected algorithm. In the VulnMentor local lab, the vulnerable endpoint trusted claims that the secure endpoint rejected. The fix is strict JWT verification before using any claim for authorization.",
      quiz: [
        {
          question: "What is the difference between decoding and verifying a JWT?",
          options: [
            "Decoding reads claims; verifying proves the claims were signed by a trusted secret or key.",
            "They are exactly the same.",
            "Verifying only changes the token color.",
            "Decoding encrypts the token.",
          ],
          answer: "Decoding reads claims; verifying proves the claims were signed by a trusted secret or key.",
          explanation:
            "JWT claims are readable, but they are trustworthy only after signature and policy checks pass.",
        },
        {
          question: "Which claim is usually dangerous to trust without verification?",
          options: ["role", "theme", "screenSize", "buttonLabel"],
          answer: "role",
          explanation:
            "Role often controls authorization. Trusting it without verification can expose privileged actions.",
        },
        {
          question: "Which fix is better?",
          options: [
            "Verify signature and enforce an algorithm allowlist before authorization.",
            "Decode the token and trust the role.",
            "Hide the token in the browser UI.",
            "Accept unsigned tokens for speed.",
          ],
          answer: "Verify signature and enforce an algorithm allowlist before authorization.",
          explanation:
            "The server must verify token integrity and expected JWT settings before trusting claims.",
        },
      ],
      postLabDebrief: {
        whatHappened:
          "The vulnerable API trusted role data from a decoded token.",
        whyItWorked:
          "The endpoint skipped signature verification and algorithm enforcement.",
        realWorldImpact:
          "A similar bug could allow privilege escalation, admin access, or cross-user API access.",
        howToFix:
          "Verify JWT signature and enforce issuer, audience, expiry, and algorithm checks before authorization.",
        reportNote:
          "Report it as broken authentication or JWT verification failure with vulnerable response, secure rejection, and trace evidence.",
        nextLesson: "rate-limit-bypass",
      },
    },
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
      serviceName: "api-rate-limit-bypass",
    },
    summary:
      "A password-reset API rate-limits OTP attempts using a spoofable client key instead of a stable account or session key.",
    teaching: {
      lessonSlug: "rate-limit-bypass",
      beginnerIntro: {
        what:
          "A rate-limit bypass happens when repeated sensitive actions do not hit the same server-side counter.",
        why:
          "OTP and password-reset flows need strong limits. If the limit key can be changed by the client, an attacker can keep trying.",
        where:
          "It appears in OTP verification, login attempts, password reset, coupon redemption, invite codes, and expensive API operations.",
        normalFeature:
          "A normal OTP flow allows only a small number of attempts for the protected account or reset session.",
        developerMistake:
          "The developer keys the limit from spoofable request metadata instead of the account, reset flow, or session being protected.",
      },
      mentalModel: [
        "User starts OTP flow",
        "API counts failed attempts",
        "Counter key comes from client-controlled metadata",
        "Client changes that metadata",
        "API creates a fresh counter",
        "Limit is bypassed in the vulnerable lab",
      ],
      prerequisites: [
        "Know why OTP attempts need limits.",
        "Know that request headers can be client-controlled unless a trusted proxy sets them.",
        "Know that stable server-side keys are safer for sensitive actions.",
      ],
      methodology: [
        "Start the local OTP flow and observe the normal response.",
        "Send incorrect OTP attempts until the limit behavior is visible.",
        "Identify which value appears as the rate-limit key in traces.",
        "Change one client-controlled value and compare vulnerable vs secure behavior.",
        "Collect evidence showing vulnerable counter reset and secure counter stability.",
        "Submit the flag after explaining the weak key choice.",
        "Write root cause and layered rate-limit fix.",
      ],
      evidenceChecklist: [
        "Request tested: OTP verify endpoint.",
        "Parameter changed: client-controlled key or header in the local lab.",
        "Response difference: vulnerable counter resets while secure counter blocks.",
        "Trace proof: rate-limit key changes for vulnerable attempts.",
        "Impact statement: OTP guessing can continue beyond intended limit.",
        "Secure comparison: secure endpoint keys attempts to account/reset flow.",
        "Fix recommendation: stable account, session, flow, IP, and global counters.",
      ],
      commonMistakes: [
        "Rate-limiting only by IP for account recovery.",
        "Trusting X-Forwarded-For without a trusted reverse proxy boundary.",
        "Returning detailed OTP errors that help tune attempts.",
      ],
      reportTemplate:
        "The OTP verification endpoint uses a spoofable client-controlled value as the rate-limit key. In the VulnMentor local lab, changing that value caused attempts to use a fresh counter, while the secure endpoint continued limiting by account/reset flow. The fix is to rate-limit sensitive actions by stable server-side keys with layered controls.",
      quiz: [
        {
          question: "What makes a rate-limit key weak?",
          options: [
            "The client can change it between requests.",
            "It is stored on the server.",
            "It uses the account id.",
            "It blocks too many attempts.",
          ],
          answer: "The client can change it between requests.",
          explanation:
            "A client-controlled key lets repeated attempts appear unrelated to the server.",
        },
        {
          question: "Which key is safer for OTP attempts?",
          options: [
            "The protected account or reset flow id.",
            "Any header the client sends.",
            "The color of the page.",
            "A random value sent by the browser each time.",
          ],
          answer: "The protected account or reset flow id.",
          explanation:
            "Sensitive flows should be limited by stable server-side identity or flow context.",
        },
        {
          question: "True or false: Spoofable headers should be trusted only when they come through a trusted proxy boundary.",
          options: ["True", "False"],
          answer: "True",
          explanation:
            "Applications should not blindly trust network metadata supplied directly by clients.",
        },
      ],
      postLabDebrief: {
        whatHappened:
          "The vulnerable endpoint counted attempts under a key the client could change.",
        whyItWorked:
          "Changing the key caused the API to create a new counter instead of enforcing the same limit.",
        realWorldImpact:
          "A similar bug could enable OTP guessing, account takeover attempts, or resource exhaustion.",
        howToFix:
          "Rate-limit by account, reset flow, session, trusted IP, endpoint, and global service counters.",
        reportNote:
          "Report it as weak rate limiting with attempted requests, key-change evidence, vulnerable response difference, and secure endpoint comparison.",
        nextLesson: "excessive-data-exposure",
      },
    },
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
      serviceName: "api-excessive-data-exposure",
    },
    summary:
      "A profile API returns the full database record, exposing internal and sensitive fields that the client does not need.",
    teaching: {
      lessonSlug: "excessive-data-exposure",
      beginnerIntro: {
        what:
          "Excessive data exposure happens when an API returns more fields than the client needs, including internal or sensitive properties.",
        why:
          "The page may hide sensitive fields, but anyone can inspect the raw API response. Data protection must happen on the server.",
        where:
          "It appears in profile APIs, user objects, mobile responses, admin metadata, invoices, orders, and debug endpoints.",
        normalFeature:
          "A normal profile API returns only safe fields needed to render the profile screen.",
        developerMistake:
          "The developer returns the full database object instead of building an allowlisted response object.",
      },
      mentalModel: [
        "User requests profile",
        "API loads full database record",
        "Handler serializes the entire object",
        "Raw JSON includes server-only fields",
        "Frontend ignores some fields",
        "Sensitive data still reaches the client",
      ],
      prerequisites: [
        "Know how to inspect raw JSON responses.",
        "Know that frontend hiding does not remove data from the network response.",
        "Know what allowlisted response fields mean.",
      ],
      methodology: [
        "Request the vulnerable profile endpoint and read the raw JSON.",
        "List fields needed by the profile screen.",
        "Identify fields that are internal, secret, or unnecessary.",
        "Compare vulnerable and secure profile responses.",
        "Collect evidence showing sensitive fields in the vulnerable response only.",
        "Submit the flag after identifying the leaked server-only field.",
        "Write root cause and response DTO fix.",
      ],
      evidenceChecklist: [
        "Request tested: profile API endpoint.",
        "Parameter changed: none required; inspect the raw response.",
        "Response difference: vulnerable response includes extra sensitive fields.",
        "Trace proof: sensitive field count or names appear in traces.",
        "Impact statement: normal user receives server-only data.",
        "Secure comparison: secure response returns only allowlisted fields.",
        "Fix recommendation: DTO or serializer allowlist with tests for sensitive fields.",
      ],
      commonMistakes: [
        "Inspecting only the rendered page and not the network response.",
        "Returning raw ORM or database objects directly.",
        "Assuming valid authorization means every property is safe to disclose.",
      ],
      reportTemplate:
        "The profile API returns the full user record instead of a minimized response object. In the VulnMentor local lab, the raw JSON included server-only sensitive fields that the secure endpoint removed. The fix is to use explicit DTOs or serializers that allowlist only client-required fields.",
      quiz: [
        {
          question: "Where should sensitive fields be removed?",
          options: [
            "On the server before the response is sent.",
            "Only in CSS.",
            "Only by hiding HTML elements.",
            "Only in the browser console.",
          ],
          answer: "On the server before the response is sent.",
          explanation:
            "If sensitive data reaches the client, it can be inspected even if the UI hides it.",
        },
        {
          question: "Which implementation is safer?",
          options: [
            "Build a response DTO with allowlisted fields.",
            "Return the full database user object.",
            "Let the frontend delete fields.",
            "Rename sensitive fields only.",
          ],
          answer: "Build a response DTO with allowlisted fields.",
          explanation:
            "Allowlisted DTOs make the server intentionally choose what leaves the API.",
        },
        {
          question: "True or false: A user can be allowed to view their profile but still not be allowed to receive every stored property.",
          options: ["True", "False"],
          answer: "True",
          explanation:
            "Authorization to an object does not automatically authorize every property in that object.",
        },
      ],
      postLabDebrief: {
        whatHappened:
          "The vulnerable endpoint returned raw profile data with unnecessary server-only fields.",
        whyItWorked:
          "The handler serialized the database record directly instead of using a safe response shape.",
        realWorldImpact:
          "A similar bug could expose reset tokens, backup codes, internal scores, billing references, or feature flags.",
        howToFix:
          "Use allowlisted DTOs, classify fields, test that secrets never appear, and review unusually large responses.",
        reportNote:
          "Report it as excessive data exposure with raw response evidence, sensitive field names, secure response comparison, and DTO remediation.",
        nextLesson: "secure-coding-reporting",
      },
    },
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
