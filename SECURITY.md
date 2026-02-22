# Security Policy

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Email: **security@wokspec.org**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Your contact information (for follow-up)

## Response SLA

| Action | Timeframe |
|--------|-----------|
| Acknowledgement | Within 48 hours |
| Initial assessment | Within 7 days |
| Resolution or timeline | Within 30 days |

## Scope

In scope:
- Authentication and authorization bypass
- Server-side injection (SQL, command, prompt)
- Sensitive data exposure (user data, API keys)
- Generation abuse (bypassing content policies)
- CSRF / XSS in the web application

Out of scope:
- Rate limiting bypass in self-hosted OSS deployments (by design)
- Social engineering attacks
- Denial of service from normal API usage
- Issues in third-party provider APIs (report those to the provider directly)

## Disclosure Policy

WokSpec follows coordinated disclosure. After a fix is deployed, we will:
1. Credit the reporter (if they consent)
2. Publish a summary in our changelog
3. Notify affected users if data was at risk

We do not currently offer a bug bounty program.
