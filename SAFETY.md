# Safety And Ethics

VulnMentor is an educational cybersecurity sandbox. It is designed for college project work, controlled practice, CTF-style learning, and safe demonstrations.

## Allowed Use

- Run the included labs on your own laptop.
- Practice only against the provided localhost services.
- Use the labs to understand vulnerability root causes and secure fixes.
- Use Burp Suite, Postman, browser tools, or scripts only against the local lab URLs.

## Not Allowed

- Do not attack real websites, college systems, public APIs, or third-party services.
- Do not deploy intentionally vulnerable labs openly on the public internet.
- Do not add malware, phishing, credential theft, persistence, or stealth behavior.
- Do not store real user passwords, secrets, private tokens, or sensitive data in lab code.

## Why Labs Run Locally

The vulnerable services are intentionally insecure. Running them locally through Docker gives each learner a controlled environment and avoids exposing vulnerable endpoints to the internet.

The safest default model is:

```text
Portal: localhost or trusted hosted frontend
Labs: Docker containers on learner laptop
Target: only localhost lab URLs
```

## Public Demo Rules

If this project is shown to guides, recruiters, or students:

- Explain that all vulnerabilities are intentional.
- Show the target URL as `localhost`.
- Keep the GitHub repository private until safety documentation is complete.
- If the repository becomes public, include this safety file and clear lab warnings.

## AI Mentor Rules

The AI Mentor should teach, not solve everything directly. It should:

- Give progressive hints.
- Explain concepts and mitigation.
- Avoid directly revealing flags.
- Refuse requests to attack real targets.
- Keep guidance inside the project lab context.

Current mentor behavior is offline and rule-based. This keeps demos reliable without requiring an API key, and it makes the guardrails visible before any future hosted LLM backend is added.
