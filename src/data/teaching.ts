export type TeachingModule = {
  challengeId: string;
  concept: string;
  instructorGoal: string;
  studentOutcome: string;
  lesson: string[];
  guidedPractice: string[];
  observe: string[];
  checkYourself: string[];
  commonMistakes: string[];
  defenseTakeaway: string;
};

export const teachingModules: TeachingModule[] = [
  {
    challengeId: "web-sqli-login",
    concept: "SQL Injection in login forms",
    instructorGoal:
      "Teach why raw user input must never become executable SQL logic.",
    studentOutcome:
      "A student can identify string-built SQL, test the local login safely, read traces, and explain prepared statements.",
    lesson: [
      "Authentication code should compare data, not let the user reshape the database query.",
      "A vulnerable login joins username and password text directly into a SQL string.",
      "If the input changes the meaning of the WHERE clause, the database may return a user without the real password.",
      "The secure version keeps SQL structure fixed and sends user values separately as parameters.",
    ],
    guidedPractice: [
      "Open the SQL lab and first try a normal wrong username/password to understand the baseline response.",
      "Try special SQL characters in the username field and watch how the response or trace changes.",
      "Your local-only objective is to prove the login condition can be changed without knowing the real password.",
      "After the lab reveals proof, submit the captured flag in VulnMentor and read the secure-code comparison.",
    ],
    observe: [
      "Does the trace show a login failure, database error, or successful role?",
      "Does the vulnerable code build SQL using string concatenation?",
      "Does the secure code use placeholders or parameter binding?",
    ],
    checkYourself: [
      "Can you explain the difference between data and executable query logic?",
      "Can you name the exact line pattern that caused the issue?",
      "Can you describe why prepared statements fix this class of bug?",
    ],
    commonMistakes: [
      "Trying random payloads before understanding the normal login behavior.",
      "Thinking input validation alone replaces prepared statements.",
      "Forgetting to compare the vulnerable query with the secure query.",
    ],
    defenseTakeaway:
      "Use prepared statements for every user-controlled SQL value, then monitor abnormal login patterns.",
  },
  {
    challengeId: "web-xss-comment",
    concept: "Stored XSS and unsafe rendering",
    instructorGoal:
      "Teach how stored content becomes dangerous when a later page renders it as HTML.",
    studentOutcome:
      "A student can compare encoded and raw rendering paths, trigger proof in the local reviewer view, and explain output encoding.",
    lesson: [
      "Stored XSS has two moments: input is saved first, then a different page renders it later.",
      "The vulnerable page treats stored comment text as HTML instead of plain text.",
      "The browser executes active content only when the page gives it an executable context.",
      "The secure page renders the same comment as text and protects sensitive cookies with HttpOnly.",
    ],
    guidedPractice: [
      "Submit a harmless comment and compare the public board with the review page.",
      "Find which view behaves like a raw HTML sink and which view encodes output safely.",
      "Use the local collector flow only inside this lab to prove browser execution.",
      "Submit the captured proof flag, then compare the cookie and rendering defenses.",
    ],
    observe: [
      "Does the public page display your input as text?",
      "Does the review page interpret stored content differently?",
      "Do traces show a collector request after the review page opens?",
    ],
    checkYourself: [
      "Can you explain source, storage, sink, and execution context?",
      "Can you say why escaping on output is more reliable than trusting input?",
      "Can you explain why HttpOnly reduces cookie theft impact?",
    ],
    commonMistakes: [
      "Testing only the form page and missing the later admin/reviewer sink.",
      "Assuming sanitization and output encoding are the same thing.",
      "Forgetting that stored bugs may trigger for a different user later.",
    ],
    defenseTakeaway:
      "Encode untrusted output for the exact rendering context, avoid raw HTML sinks, and protect cookies with HttpOnly and SameSite.",
  },
  {
    challengeId: "api-broken-auth",
    concept: "Broken object-level authorization",
    instructorGoal:
      "Teach that authentication proves identity, but authorization must prove access to each requested object.",
    studentOutcome:
      "A student can change an object identifier in a local API request, detect owner mismatch, and explain object-level checks.",
    lesson: [
      "A token answers who the user is; it does not automatically approve every object id in the URL.",
      "BOLA or IDOR appears when the API returns an object by id without checking ownership or permission.",
      "The vulnerable endpoint trusts the requested account id too much.",
      "The secure endpoint compares the requested object owner with the authenticated user.",
    ],
    guidedPractice: [
      "Start with the /api/me response to learn the student identity and allowed object.",
      "Request the normal object first so you know what a valid response looks like.",
      "Change only the object id inside the local lab and compare vulnerable vs secure endpoints.",
      "Use the trace evidence to explain the owner mismatch before submitting the flag.",
    ],
    observe: [
      "Which user does the token represent?",
      "Which object belongs to that user?",
      "Does the API return another user's object or block it with 403?",
    ],
    checkYourself: [
      "Can you separate authentication from authorization?",
      "Can you describe why hidden frontend buttons do not protect an API?",
      "Can you design a test for cross-user object access?",
    ],
    commonMistakes: [
      "Assuming a valid token means access to all ids.",
      "Testing only your own object and stopping too early.",
      "Relying on frontend route guards instead of server-side authorization.",
    ],
    defenseTakeaway:
      "For every object-level endpoint, derive access from the authenticated user context and return 403 when ownership or permission fails.",
  },
  {
    challengeId: "api-jwt-tampering",
    concept: "JWT claim trust and signature verification",
    instructorGoal:
      "Teach that JWT claims are only trustworthy after the server verifies signature, issuer, expiry, and algorithm.",
    studentOutcome:
      "A student can inspect a local token, identify authorization claims, compare decoded vs verified behavior, and explain algorithm allowlisting.",
    lesson: [
      "JWT payloads are encoded, not encrypted, so anyone can read their claims.",
      "A decoded claim is not proof. The server must verify that trusted code signed the token.",
      "The vulnerable endpoint trusts the role claim after decoding it.",
      "The secure endpoint rejects unexpected algorithms and invalid signatures before reading authorization claims.",
    ],
    guidedPractice: [
      "Fetch the student token from the local lab and decode it to identify role-related claims.",
      "Compare the debug decode endpoint with the secure admin endpoint.",
      "In the local lab only, observe what happens when token claims no longer match a trusted signature.",
      "Use traces to explain why the vulnerable path accepts what the secure path rejects.",
    ],
    observe: [
      "Which claim controls access?",
      "Does the vulnerable endpoint verify before trusting the claim?",
      "Does the secure endpoint reject unsigned or unexpected tokens?",
    ],
    checkYourself: [
      "Can you explain encoded vs encrypted vs signed?",
      "Can you explain why the algorithm header must not be blindly trusted?",
      "Can you list the checks a production JWT verifier should enforce?",
    ],
    commonMistakes: [
      "Thinking base64url decoding is the same as verification.",
      "Trusting role or user id claims before signature validation.",
      "Accepting algorithm choices from untrusted token headers.",
    ],
    defenseTakeaway:
      "Verify JWT signature, algorithm, issuer, audience, expiry, and server-side authorization before trusting claims.",
  },
  {
    challengeId: "api-rate-limit-bypass",
    concept: "Rate limits tied to spoofable keys",
    instructorGoal:
      "Teach why sensitive actions must be rate-limited by stable server-side identity, not client-controlled metadata.",
    studentOutcome:
      "A student can observe failed OTP counters, identify the rate-limit key, compare spoofed and stable keys, and explain layered limits.",
    lesson: [
      "Rate limiting only works if repeated attempts hit the same counter.",
      "A weak design uses a client-controlled value as the key, so the client can appear new again.",
      "The vulnerable endpoint keys attempts from spoofable network metadata.",
      "The secure endpoint keys attempts to the reset flow or account that is being protected.",
    ],
    guidedPractice: [
      "Start the local OTP flow and send a few incorrect attempts to see the limit.",
      "Identify which value the vulnerable endpoint uses as the attempt key.",
      "Compare behavior when that key changes against the secure endpoint's stable account key.",
      "Capture the flag only after you can explain why the secure limit still holds.",
    ],
    observe: [
      "Which key appears in the trace for failed attempts?",
      "Does changing client-controlled metadata reset the vulnerable counter?",
      "Does the secure endpoint keep counting against the protected account?",
    ],
    checkYourself: [
      "Can you name stable keys for password reset limits?",
      "Can you explain why headers need trusted proxy handling?",
      "Can you design account, IP, and global service limits together?",
    ],
    commonMistakes: [
      "Only rate-limiting by IP for account recovery flows.",
      "Trusting X-Forwarded-For without a trusted reverse proxy boundary.",
      "Returning detailed OTP errors that help attackers tune attempts.",
    ],
    defenseTakeaway:
      "Limit sensitive actions by server-owned account, session, flow, IP, and global counters, and ignore spoofable headers unless set by trusted infrastructure.",
  },
  {
    challengeId: "api-excessive-data-exposure",
    concept: "API response minimization",
    instructorGoal:
      "Teach that a valid user may still receive too many object properties if the server returns raw database records.",
    studentOutcome:
      "A student can inspect raw JSON, identify unnecessary sensitive fields, compare secure response DTOs, and explain allowlisted serialization.",
    lesson: [
      "APIs should return only the fields required for the current client screen.",
      "The vulnerable endpoint serializes the full user record from storage.",
      "Sensitive fields may be hidden in the UI but still visible in raw JSON.",
      "The secure endpoint builds a response object from an allowlist of safe fields.",
    ],
    guidedPractice: [
      "Request the vulnerable profile API and inspect the raw JSON response.",
      "Make a list of fields the client needs and fields that belong only on the server.",
      "Compare that response with the secure endpoint's minimized profile.",
      "Submit the flag after identifying which server-only field leaked.",
    ],
    observe: [
      "How many fields does the vulnerable API return?",
      "Which fields are not needed for a profile screen?",
      "Does the secure response use an explicit allowlist?",
    ],
    checkYourself: [
      "Can you explain why frontend hiding is not data protection?",
      "Can you describe DTO or serializer allowlisting?",
      "Can you write a test that fails if sensitive fields appear?",
    ],
    commonMistakes: [
      "Inspecting only the rendered page and not the raw API response.",
      "Returning raw ORM/database objects directly to clients.",
      "Assuming authorization alone means every property is safe to disclose.",
    ],
    defenseTakeaway:
      "Use explicit response DTOs or serializers, classify fields, and test that secrets never appear in client-facing JSON.",
  },
];

export const teachingFlow = [
  "Read the core concept before opening the lab.",
  "Observe normal behavior first so abnormal behavior is meaningful.",
  "Try one controlled local test at a time and watch the traces.",
  "Capture the flag only after you can explain why the bug worked.",
  "Compare the secure version and write the root cause in your own words.",
];

export function getTeachingModule(challengeId: string) {
  return teachingModules.find((module) => module.challengeId === challengeId);
}
