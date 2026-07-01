import {
  challenges,
  type Challenge,
  type ChallengeTeaching,
  type QuizQuestion,
} from "./challenges";

export type LessonDifficulty = "Foundation" | "Easy" | "Medium" | "Hard";

export type TeachingLesson = {
  kind: "foundation" | "challenge";
  slug: string;
  title: string;
  track: "Start from 0" | "Web Security" | "API Security" | "Defender Thinking";
  difficulty: LessonDifficulty;
  time: string;
  status: "Ready" | "Lab linked";
  summary: string;
  relatedLab?: Challenge;
  beginnerIntro: ChallengeTeaching["beginnerIntro"];
  mentalModel: string[];
  prerequisites: string[];
  methodology: string[];
  evidenceChecklist: string[];
  commonMistakes: string[];
  reportTemplate: string;
  quiz: QuizQuestion[];
  vulnerableCode?: string;
  secureCode?: string;
  mitigation: string[];
  impact: string;
  postLabDebrief: ChallengeTeaching["postLabDebrief"];
  nextLesson?: string;
};

export type TeachingModule = {
  challengeId: string;
  lessonSlug: string;
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

type FoundationLessonInput = Omit<
  TeachingLesson,
  "kind" | "difficulty" | "status" | "postLabDebrief"
> & {
  postLabDebrief?: Partial<ChallengeTeaching["postLabDebrief"]>;
};

function foundationLesson(input: FoundationLessonInput): TeachingLesson {
  return {
    ...input,
    kind: "foundation",
    difficulty: "Foundation",
    status: "Ready",
    postLabDebrief: {
      whatHappened:
        input.postLabDebrief?.whatHappened ??
        "You connected a basic security idea to how web applications behave.",
      whyItWorked:
        input.postLabDebrief?.whyItWorked ??
        "The concept becomes easier when you observe request, response, identity, and server-side decisions separately.",
      realWorldImpact:
        input.postLabDebrief?.realWorldImpact ??
        "Strong fundamentals make vulnerability testing safer, clearer, and easier to explain.",
      howToFix:
        input.postLabDebrief?.howToFix ??
        "Use these basics as a checklist before opening any VulnMentor lab.",
      reportNote:
        input.postLabDebrief?.reportNote ??
        "Write one sentence explaining the concept in human language, then one sentence explaining the technical meaning.",
      nextLesson: input.nextLesson ?? "sql-injection",
    },
  };
}

const foundationQuiz = (
  concept: string,
  correct: string,
  distractor: string,
): QuizQuestion[] => [
  {
    question: `What is the main idea of ${concept}?`,
    options: [correct, distractor, "It is only a UI color choice.", "It is a random flag value."],
    answer: correct,
    explanation: correct,
  },
  {
    question: "True or false: VulnMentor practice should stay inside local Docker labs unless you have written permission elsewhere.",
    options: ["True", "False"],
    answer: "True",
    explanation:
      "The platform is designed for safe local learning and authorized practice only.",
  },
  {
    question: "What should a beginner do before changing inputs?",
    options: [
      "Observe normal behavior first.",
      "Skip directly to guessing flags.",
      "Ignore responses and traces.",
      "Test random public websites.",
    ],
    answer: "Observe normal behavior first.",
    explanation:
      "A normal baseline makes it easier to understand what changed and why it matters.",
  },
];

export const foundationLessons: TeachingLesson[] = [
  foundationLesson({
    slug: "website-basics",
    title: "What Is a Website?",
    track: "Start from 0",
    time: "12 min",
    summary:
      "Understand browser pages, server responses, and why security checks must live on the server.",
    beginnerIntro: {
      what:
        "A website is a set of pages and features that your browser requests from a server.",
      why:
        "Security testing becomes easier when you separate what the browser shows from what the server decides.",
      where:
        "Every web lab in VulnMentor uses a browser page backed by a local server.",
      normalFeature:
        "A browser asks for a page, the server sends HTML/CSS/JavaScript, and the browser displays it.",
      developerMistake:
        "Beginners often assume hidden page elements are security controls, but the server must enforce security.",
    },
    mentalModel: ["Browser", "HTTP request", "Server route", "HTTP response", "Rendered page"],
    prerequisites: ["Basic browser usage.", "Ability to open localhost URLs."],
    methodology: [
      "Open the page.",
      "Identify what is rendered in the browser.",
      "Ask what the server must decide.",
      "Use traces to confirm server-side behavior.",
    ],
    evidenceChecklist: [
      "Page loaded.",
      "Server response observed.",
      "Localhost target confirmed.",
      "Security decision identified.",
    ],
    commonMistakes: [
      "Treating hidden UI as security.",
      "Ignoring server responses.",
      "Testing outside the local lab boundary.",
    ],
    reportTemplate:
      "A website feature should be described as browser input, server processing, response, and security decision.",
    quiz: foundationQuiz(
      "a website",
      "A browser requests features from a server and renders the response.",
      "A website is only a static image.",
    ),
    mitigation: [
      "Keep important authorization and validation on the server.",
      "Use browser UI only as a convenience layer.",
    ],
    impact:
      "Understanding the website flow helps students explain where a vulnerability is introduced.",
    nextLesson: "http-basics",
  }),
  foundationLesson({
    slug: "http-basics",
    title: "What Is HTTP?",
    track: "Start from 0",
    time: "15 min",
    summary:
      "Learn how browser and API clients talk to local servers using requests and responses.",
    beginnerIntro: {
      what:
        "HTTP is the request-response language used by browsers and APIs to communicate with servers.",
      why:
        "Every web and API vulnerability in VulnMentor appears inside HTTP requests, responses, headers, cookies, or bodies.",
      where:
        "You will see HTTP in forms, API calls, login flows, JSON responses, and trace logs.",
      normalFeature:
        "A client sends a method, path, headers, and sometimes a body; the server returns a status code and response body.",
      developerMistake:
        "Developers may trust request data without validating, authorizing, encoding, or filtering it on the server.",
    },
    mentalModel: ["Client", "Method + path", "Headers", "Body", "Server handler", "Status + response"],
    prerequisites: ["Know what a browser is.", "Know how to open localhost."],
    methodology: [
      "Open a local lab page.",
      "Look for the method and path in traces.",
      "Compare status codes such as 200, 401, 403, and 429.",
      "Write what changed between two requests.",
    ],
    evidenceChecklist: [
      "Method noted.",
      "Path noted.",
      "Status code noted.",
      "Response body compared.",
    ],
    commonMistakes: [
      "Looking only at the page and not the response.",
      "Ignoring status codes.",
      "Changing many request values at once.",
    ],
    reportTemplate:
      "The tested HTTP request was METHOD PATH. The important response difference was STATUS/BODY compared with the secure endpoint.",
    quiz: foundationQuiz(
      "HTTP",
      "HTTP is the request-response protocol used by web clients and servers.",
      "HTTP is a password storage format.",
    ),
    mitigation: [
      "Validate and authorize requests server-side.",
      "Use clear response codes without leaking sensitive details.",
    ],
    impact:
      "HTTP literacy makes every lab easier to test and explain.",
    nextLesson: "requests-responses",
  }),
  foundationLesson({
    slug: "requests-responses",
    title: "What Is a Request and Response?",
    track: "Start from 0",
    time: "15 min",
    summary:
      "Learn the basic evidence unit for every lab: what you sent and what the server returned.",
    beginnerIntro: {
      what:
        "A request is what the client sends. A response is what the server sends back.",
      why:
        "Security evidence is built by comparing a normal request-response pair with a changed one.",
      where:
        "Requests and responses appear in login forms, API endpoints, flag submission, and trace views.",
      normalFeature:
        "A normal request contains one intention, and the response confirms success, failure, or denial.",
      developerMistake:
        "Developers may forget that every request value can be changed by the user.",
    },
    mentalModel: ["Normal request", "Normal response", "Controlled change", "New response", "Evidence"],
    prerequisites: ["Know basic HTTP.", "Know how to read a status code."],
    methodology: [
      "Send or observe a normal request.",
      "Record the normal status and body.",
      "Change one user-controlled value.",
      "Compare the new status, body, and trace.",
    ],
    evidenceChecklist: [
      "Normal request saved.",
      "Changed request saved.",
      "Response difference explained.",
      "Trace evidence linked.",
    ],
    commonMistakes: [
      "Changing several values together.",
      "Forgetting the baseline.",
      "Calling a behavior vulnerable before comparing secure behavior.",
    ],
    reportTemplate:
      "Baseline request returned X. Modified request changed Y and returned Z, proving the local vulnerable behavior.",
    quiz: foundationQuiz(
      "requests and responses",
      "They are the sent input and returned server result used as security evidence.",
      "They are only visual page animations.",
    ),
    mitigation: [
      "Treat all request values as untrusted.",
      "Design responses to reveal only necessary information.",
    ],
    impact:
      "Good request-response evidence makes reports clear and professional.",
    nextLesson: "parameters",
  }),
  foundationLesson({
    slug: "parameters",
    title: "What Is a Parameter?",
    track: "Start from 0",
    time: "12 min",
    summary:
      "Understand the user-controlled values that often create security bugs when trusted too much.",
    beginnerIntro: {
      what:
        "A parameter is a value sent by the client, such as a query value, form field, path id, header, or JSON property.",
      why:
        "Many vulnerabilities begin when a server trusts a parameter too much.",
      where:
        "Parameters appear in URLs, forms, cookies, headers, and API JSON bodies.",
      normalFeature:
        "A normal parameter helps the server know what the user wants.",
      developerMistake:
        "The server treats the parameter as safe, authorized, or server-owned without checking it.",
    },
    mentalModel: ["User-controlled value", "Server receives it", "Server trusts it too early", "Security bug"],
    prerequisites: ["Know requests and responses.", "Know URLs can contain values."],
    methodology: [
      "Identify which values come from the client.",
      "Change one parameter at a time in a local lab.",
      "Compare the response and trace.",
      "Ask whether the server should have trusted that value.",
    ],
    evidenceChecklist: [
      "Parameter name identified.",
      "Original value recorded.",
      "Changed value recorded.",
      "Server-side decision explained.",
    ],
    commonMistakes: [
      "Assuming a hidden parameter is protected.",
      "Treating client values as server truth.",
      "Not checking secure endpoint behavior.",
    ],
    reportTemplate:
      "The parameter NAME is user-controlled. Changing it from A to B changed server behavior, which shows the missing server-side control.",
    quiz: foundationQuiz(
      "a parameter",
      "A parameter is a client-supplied value the server receives.",
      "A parameter is always a trusted server secret.",
    ),
    mitigation: [
      "Validate format and length.",
      "Authorize object ids and sensitive values on the server.",
    ],
    impact:
      "Parameter awareness helps students find SQLi, BOLA, JWT, and rate-limit mistakes.",
    nextLesson: "cookies",
  }),
  foundationLesson({
    slug: "cookies",
    title: "What Is a Cookie?",
    track: "Start from 0",
    time: "12 min",
    summary:
      "Learn how browsers store small values for sessions and why cookie flags matter.",
    beginnerIntro: {
      what:
        "A cookie is a small value a website asks the browser to store and send back on later requests.",
      why:
        "Cookies often carry session identifiers, so weak cookie handling can increase the impact of browser bugs.",
      where:
        "Cookies appear in login sessions, preference storage, CSRF defenses, and local teaching labs.",
      normalFeature:
        "After login, a server can set a session cookie so the browser stays signed in.",
      developerMistake:
        "Sensitive cookies may be readable by browser scripts or sent too broadly when security flags are missing.",
    },
    mentalModel: ["Server sets cookie", "Browser stores cookie", "Browser sends cookie", "Server recognizes session"],
    prerequisites: ["Know HTTP headers.", "Know browser and server roles."],
    methodology: [
      "Observe when a local lab sets a cookie.",
      "Ask whether script should be able to read it.",
      "Compare vulnerable and secure cookie attributes.",
      "Record which flags reduce impact.",
    ],
    evidenceChecklist: [
      "Cookie name identified.",
      "Security flags checked.",
      "Readable vs protected behavior compared.",
      "Impact explained.",
    ],
    commonMistakes: [
      "Putting secrets in client-readable cookies.",
      "Forgetting HttpOnly for session cookies.",
      "Ignoring SameSite behavior.",
    ],
    reportTemplate:
      "The cookie behavior matters because sensitive session values should be protected with HttpOnly, SameSite, Secure, and server-side validation.",
    quiz: foundationQuiz(
      "a cookie",
      "A cookie is a browser-stored value sent back to the server.",
      "A cookie is always encrypted by default.",
    ),
    mitigation: [
      "Use HttpOnly, SameSite, and Secure where appropriate.",
      "Keep sensitive session state server-side.",
    ],
    impact:
      "Cookie basics help explain Stored XSS impact and session safety.",
    nextLesson: "authentication",
  }),
  foundationLesson({
    slug: "authentication",
    title: "What Is Authentication?",
    track: "Start from 0",
    time: "14 min",
    summary:
      "Learn how applications prove who a user is before allowing account actions.",
    beginnerIntro: {
      what:
        "Authentication is the process of proving identity, such as logging in with a password or token.",
      why:
        "If authentication is bypassed or trusted incorrectly, attackers may act as another user.",
      where:
        "Authentication appears in login forms, JWT sessions, OTP flows, and API tokens.",
      normalFeature:
        "A normal login verifies credentials and then creates a server-trusted session or token.",
      developerMistake:
        "The application may trust weak proof, decoded claims, or injected query results.",
    },
    mentalModel: ["Credentials", "Server verification", "Session or token", "Authenticated user"],
    prerequisites: ["Know requests and responses.", "Know what a user account is."],
    methodology: [
      "Identify how the local lab proves identity.",
      "Observe failed and successful authentication behavior.",
      "Ask what data the server trusts.",
      "Compare vulnerable and secure proof checks.",
    ],
    evidenceChecklist: [
      "Identity proof identified.",
      "Failure behavior observed.",
      "Success behavior observed.",
      "Trust mistake explained.",
    ],
    commonMistakes: [
      "Confusing authentication with authorization.",
      "Trusting client-side user role values.",
      "Skipping secure comparison.",
    ],
    reportTemplate:
      "Authentication evidence should explain how identity was supposed to be proven and why the vulnerable flow accepted weak or changed proof.",
    quiz: foundationQuiz(
      "authentication",
      "Authentication proves who the user is.",
      "Authentication automatically permits every object.",
    ),
    mitigation: [
      "Verify credentials, signatures, and sessions on the server.",
      "Use generic errors and monitor abnormal authentication activity.",
    ],
    impact:
      "Authentication basics prepare students for SQL injection login bypass and JWT lessons.",
    nextLesson: "authorization",
  }),
  foundationLesson({
    slug: "authorization",
    title: "What Is Authorization?",
    track: "Start from 0",
    time: "14 min",
    summary:
      "Understand the difference between being logged in and being allowed to access a specific resource.",
    beginnerIntro: {
      what:
        "Authorization decides what an authenticated user is allowed to access or do.",
      why:
        "A user can be real and logged in but still not allowed to read another user's object.",
      where:
        "Authorization appears in account APIs, admin pages, object ids, roles, and feature permissions.",
      normalFeature:
        "A normal API checks the user's permission for the exact object or action requested.",
      developerMistake:
        "The server checks login but forgets to check object ownership or required role.",
    },
    mentalModel: ["Authenticated user", "Requested object/action", "Permission check", "Allow or deny"],
    prerequisites: ["Know authentication.", "Know user-controlled parameters."],
    methodology: [
      "Identify the logged-in user.",
      "Identify the requested object.",
      "Ask who owns it or who is allowed to access it.",
      "Compare vulnerable allow with secure deny.",
    ],
    evidenceChecklist: [
      "User identity noted.",
      "Object id noted.",
      "Owner or role requirement noted.",
      "Allow/deny result compared.",
    ],
    commonMistakes: [
      "Assuming login is enough.",
      "Trusting frontend controls.",
      "Not testing cross-user access in the local lab.",
    ],
    reportTemplate:
      "Authorization evidence should show authenticated user, requested object/action, expected permission, actual vulnerable result, and secure result.",
    quiz: foundationQuiz(
      "authorization",
      "Authorization decides what an authenticated user may access.",
      "Authorization is only the login screen.",
    ),
    mitigation: [
      "Enforce object and role checks server-side.",
      "Test allowed and denied paths for each sensitive endpoint.",
    ],
    impact:
      "Authorization basics lead directly into BOLA and JWT trust issues.",
    nextLesson: "api-basics",
  }),
  foundationLesson({
    slug: "api-basics",
    title: "What Is an API?",
    track: "API Security",
    time: "15 min",
    summary:
      "Learn how apps and browsers call backend features through structured endpoints.",
    beginnerIntro: {
      what:
        "An API is a server interface that lets clients request data or actions using defined endpoints.",
      why:
        "Modern websites and mobile apps depend heavily on APIs, so API security is a core skill.",
      where:
        "APIs appear behind dashboards, mobile apps, single-page apps, admin tools, and microservices.",
      normalFeature:
        "A normal API endpoint receives a request, checks identity and permission, performs work, and returns structured data.",
      developerMistake:
        "Developers may trust client parameters, skip authorization, trust unverified tokens, or return too much data.",
    },
    mentalModel: ["Client", "API endpoint", "Auth check", "Business logic", "JSON response"],
    prerequisites: ["Know HTTP.", "Know requests and responses.", "Know JSON basics."],
    methodology: [
      "Identify the API endpoint and method.",
      "Observe the normal JSON response.",
      "Identify user-controlled values.",
      "Compare vulnerable and secure endpoints.",
    ],
    evidenceChecklist: [
      "Endpoint noted.",
      "Method noted.",
      "Auth method noted.",
      "JSON response compared.",
    ],
    commonMistakes: [
      "Thinking APIs are hidden because there is no page.",
      "Ignoring object ids.",
      "Not reading raw JSON.",
    ],
    reportTemplate:
      "API notes should include endpoint, method, token or session context, changed input, response difference, and secure comparison.",
    quiz: foundationQuiz(
      "an API",
      "An API is a server interface for data or actions.",
      "An API is only a visual webpage.",
    ),
    mitigation: [
      "Authenticate and authorize each endpoint.",
      "Validate input and minimize output.",
    ],
    impact:
      "API basics prepare students for BOLA, JWT, rate limit, and data exposure labs.",
    nextLesson: "json-basics",
  }),
  foundationLesson({
    slug: "json-basics",
    title: "What Is JSON?",
    track: "API Security",
    time: "10 min",
    summary:
      "Read API responses confidently and spot fields that should not be exposed.",
    beginnerIntro: {
      what:
        "JSON is a structured data format using key-value pairs, arrays, strings, numbers, booleans, and objects.",
      why:
        "Most API labs return JSON, and many findings depend on reading the raw response carefully.",
      where:
        "JSON appears in API requests, API responses, logs, tokens, and configuration endpoints.",
      normalFeature:
        "A normal JSON response contains only the data needed for the client feature.",
      developerMistake:
        "The server may return raw internal objects with extra sensitive fields.",
    },
    mentalModel: ["JSON object", "Field name", "Field value", "Needed by client?", "Safe to expose?"],
    prerequisites: ["Know API basics.", "Know request and response basics."],
    methodology: [
      "Read each JSON field name.",
      "Ask what the UI needs.",
      "Identify sensitive or internal values.",
      "Compare vulnerable and secure response shapes.",
    ],
    evidenceChecklist: [
      "Raw JSON copied into notes.",
      "Unneeded fields marked.",
      "Sensitive fields marked.",
      "Secure response compared.",
    ],
    commonMistakes: [
      "Looking only at the rendered page.",
      "Ignoring nested fields.",
      "Assuming every returned field is safe.",
    ],
    reportTemplate:
      "JSON evidence should list the fields returned, which fields are unnecessary or sensitive, and how the secure response removes them.",
    quiz: foundationQuiz(
      "JSON",
      "JSON is a structured key-value data format commonly used by APIs.",
      "JSON is a firewall rule.",
    ),
    mitigation: [
      "Return explicit response DTOs.",
      "Write tests that block sensitive fields from client-facing JSON.",
    ],
    impact:
      "JSON basics prepare students for excessive data exposure and API reporting.",
    nextLesson: "client-server",
  }),
  foundationLesson({
    slug: "client-server",
    title: "Client-Side vs Server-Side",
    track: "Defender Thinking",
    time: "14 min",
    summary:
      "Learn which decisions belong in the browser and which must be enforced by the backend.",
    beginnerIntro: {
      what:
        "Client-side means code running in the browser. Server-side means code running on the backend.",
      why:
        "Users can inspect and change client-side behavior, so security decisions must be enforced server-side.",
      where:
        "This distinction appears in forms, hidden buttons, tokens, object ids, role checks, and API responses.",
      normalFeature:
        "The client helps the user interact; the server validates, authorizes, stores, and protects data.",
      developerMistake:
        "The application relies on client-side hiding or client-provided values as if they are trusted controls.",
    },
    mentalModel: ["Browser display", "User can change input", "Server receives request", "Server enforces security"],
    prerequisites: ["Know websites.", "Know HTTP.", "Know parameters."],
    methodology: [
      "Identify what happens in the browser.",
      "Identify what the server must enforce.",
      "Change only local lab input and compare server response.",
      "Write which check belongs server-side.",
    ],
    evidenceChecklist: [
      "Client-side behavior identified.",
      "Server-side decision identified.",
      "Trust boundary explained.",
      "Secure enforcement described.",
    ],
    commonMistakes: [
      "Trusting hidden fields.",
      "Trusting decoded client tokens.",
      "Filtering data only after it reaches the browser.",
    ],
    reportTemplate:
      "The report should explain whether the broken trust happened on the client or server and which server-side control is missing.",
    quiz: foundationQuiz(
      "client-side vs server-side",
      "Client code is user-controlled; server code must enforce security decisions.",
      "Client code is always secret.",
    ),
    mitigation: [
      "Keep authorization, validation, and data filtering on the server.",
      "Treat client input as untrusted.",
    ],
    impact:
      "This mindset connects every VulnMentor vulnerability to a missing server-side control.",
    nextLesson: "sql-injection",
  }),
  foundationLesson({
    slug: "secure-coding-reporting",
    title: "Secure Coding and Reporting",
    track: "Defender Thinking",
    time: "20 min",
    summary:
      "Turn a lab solve into a clean root-cause explanation, fix recommendation, and beginner-friendly report note.",
    beginnerIntro: {
      what:
        "Secure coding fixes the root cause. Reporting explains the evidence, impact, and mitigation clearly.",
      why:
        "A good security student must prove the issue safely and explain how to prevent it.",
      where:
        "This applies after every VulnMentor lab, internship task, college demo, and authorized security assessment.",
      normalFeature:
        "A normal report says what was tested, what changed, what happened, why it happened, impact, and fix.",
      developerMistake:
        "Students often stop at capturing the flag and skip root cause, evidence, and secure coding notes.",
    },
    mentalModel: ["Evidence", "Root cause", "Impact", "Fix", "Retest", "Report"],
    prerequisites: ["Complete at least one teaching lesson.", "Understand safe local testing boundaries."],
    methodology: [
      "Write the tested request.",
      "Write the changed value.",
      "Write the response difference.",
      "Map the root cause to code.",
      "Write the secure fix and retest idea.",
    ],
    evidenceChecklist: [
      "Request tested.",
      "Parameter or field changed.",
      "Response difference.",
      "Trace proof.",
      "Impact statement.",
      "Secure comparison.",
      "Fix recommendation.",
    ],
    commonMistakes: [
      "Submitting only a flag with no explanation.",
      "Using vague impact statements.",
      "Recommending filters without fixing root cause.",
    ],
    reportTemplate:
      "Finding: [vulnerability]. Evidence: [request/response/trace]. Root cause: [missing server-side control]. Impact: [what a user could access/do]. Fix: [specific secure coding change]. Retest: [secure endpoint behavior].",
    quiz: foundationQuiz(
      "secure coding and reporting",
      "A strong report connects evidence, root cause, impact, fix, and retest.",
      "A strong report only contains the flag.",
    ),
    mitigation: [
      "Fix root cause, not symptoms.",
      "Use evidence checklists and secure comparisons after every lab.",
    ],
    impact:
      "This is what makes VulnMentor feel like a learning platform instead of only a CTF dashboard.",
    nextLesson: "website-basics",
  }),
];

function lessonFromChallenge(challenge: Challenge): TeachingLesson {
  return {
    kind: "challenge",
    slug: challenge.teaching.lessonSlug,
    title: challenge.title,
    track: challenge.category === "Web Security" ? "Web Security" : "API Security",
    difficulty: challenge.difficulty,
    time: challenge.time,
    status: "Lab linked",
    summary: challenge.summary,
    relatedLab: challenge,
    beginnerIntro: challenge.teaching.beginnerIntro,
    mentalModel: challenge.teaching.mentalModel,
    prerequisites: challenge.teaching.prerequisites,
    methodology: challenge.teaching.methodology,
    evidenceChecklist: challenge.teaching.evidenceChecklist,
    commonMistakes: challenge.teaching.commonMistakes,
    reportTemplate: challenge.teaching.reportTemplate,
    quiz: challenge.teaching.quiz,
    vulnerableCode: challenge.code.vulnerable,
    secureCode: challenge.code.secure,
    mitigation: challenge.mitigation,
    impact: challenge.impact,
    postLabDebrief: challenge.teaching.postLabDebrief,
    nextLesson: challenge.teaching.postLabDebrief.nextLesson,
  };
}

export const vulnerabilityLessons: TeachingLesson[] = challenges.map(lessonFromChallenge);

export const allTeachingLessons: TeachingLesson[] = [
  ...foundationLessons,
  ...vulnerabilityLessons,
];

export const recommendedLessonOrder = [
  { title: "HTTP and Web Basics", slug: "http-basics" },
  { title: "How login works", slug: "authentication" },
  { title: "SQL Injection", slug: "sql-injection" },
  { title: "Stored XSS", slug: "stored-xss" },
  { title: "How APIs work", slug: "api-basics" },
  { title: "API Authorization / IDOR / BOLA", slug: "api-bola" },
  { title: "JWT trust issues", slug: "jwt-tampering" },
  { title: "Rate limiting", slug: "rate-limit-bypass" },
  { title: "Data exposure", slug: "excessive-data-exposure" },
  { title: "Secure coding and reporting", slug: "secure-coding-reporting" },
];

export const teachingTracks = [
  {
    title: "Start from 0",
    body: "Beginner foundations before touching any vulnerability lab.",
    slugs: [
      "website-basics",
      "http-basics",
      "requests-responses",
      "parameters",
      "cookies",
      "authentication",
      "authorization",
      "api-basics",
      "json-basics",
      "client-server",
    ],
  },
  {
    title: "Web Security",
    body: "Learn how common web bugs are introduced, tested safely, and fixed.",
    slugs: ["sql-injection", "stored-xss"],
  },
  {
    title: "API Security",
    body: "Practice modern API authorization, token trust, rate limiting, and response minimization.",
    slugs: ["api-bola", "jwt-tampering", "rate-limit-bypass", "excessive-data-exposure"],
  },
  {
    title: "Defender Thinking",
    body: "Turn every solve into evidence, root cause, mitigation, and a clean report note.",
    slugs: ["client-server", "secure-coding-reporting"],
  },
] as const;

export const teachingFlow = [
  "Study the beginner explanation.",
  "Build the mental model before opening the target.",
  "Run only the VulnMentor local Docker lab.",
  "Collect request, response, and trace evidence.",
  "Capture the flag after you can explain the root cause.",
  "Compare the secure fix, answer the quiz, and write a report note.",
];

export const teachingModules: TeachingModule[] = challenges.map((challenge) => ({
  challengeId: challenge.id,
  lessonSlug: challenge.teaching.lessonSlug,
  concept: challenge.teaching.beginnerIntro.what,
  instructorGoal: `Teach ${challenge.title} through local-only observation, root cause, and secure fix comparison.`,
  studentOutcome:
    "A student can explain the bug in simple language, test it safely in the local lab, collect evidence, submit the flag, and write a fix note.",
  lesson: [
    challenge.teaching.beginnerIntro.what,
    challenge.teaching.beginnerIntro.normalFeature,
    challenge.teaching.beginnerIntro.developerMistake,
  ],
  guidedPractice: challenge.teaching.methodology,
  observe: challenge.teaching.evidenceChecklist,
  checkYourself: challenge.teaching.quiz.map((item) => item.question),
  commonMistakes: challenge.teaching.commonMistakes,
  defenseTakeaway: challenge.mitigation[0] ?? "Fix the missing server-side security control.",
}));

export function getTeachingModule(challengeId: string) {
  return teachingModules.find((module) => module.challengeId === challengeId);
}

export function getTeachingLesson(slug: string) {
  return allTeachingLessons.find((lesson) => lesson.slug === slug);
}

export function getNextTeachingLesson(slug: string) {
  const lesson = getTeachingLesson(slug);
  if (lesson?.nextLesson) return getTeachingLesson(lesson.nextLesson);

  const currentIndex = allTeachingLessons.findIndex((item) => item.slug === slug);
  if (currentIndex < 0) return undefined;
  return allTeachingLessons[currentIndex + 1];
}

export function getLessonForChallenge(challengeId: string) {
  const challenge = challenges.find((item) => item.id === challengeId);
  return challenge ? getTeachingLesson(challenge.teaching.lessonSlug) : undefined;
}
