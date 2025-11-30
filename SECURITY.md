# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Reporting a Vulnerability

We take the security of OSIA UIN Generator seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:

**security@pocketone.eu**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours.
- **Communication**: We will keep you informed of the progress towards a fix.
- **Fix Timeline**: We aim to resolve critical vulnerabilities within 7 days and high-severity issues within 30 days.
- **Credit**: We will credit you in our release notes (unless you prefer to remain anonymous).

## Security Best Practices for Deployment

### Environment Variables

- **Never commit secrets** to version control
- Use environment variables or a secret management system (HashiCorp Vault, AWS Secrets Manager)
- Rotate sector secrets periodically (recommended: every 90 days)
- Use strong, randomly generated secrets (minimum 32 bytes)

### Database Security

- Use dedicated database users with minimal privileges
- Enable SSL/TLS for database connections
- Implement network segmentation (database not publicly accessible)
- Enable audit logging on the database
- Regular backups with encryption at rest

### Network Security

- Deploy behind a reverse proxy (nginx, HAProxy)
- Use TLS 1.3 for all connections
- Implement rate limiting to prevent abuse
- Enable CORS only for trusted origins
- Use HTTP security headers (HSTS, CSP, X-Frame-Options)

### Authentication & Authorization

- Implement OAuth 2.0 / OpenID Connect for production
- Use short-lived access tokens
- Validate JWT signatures with strong algorithms (RS256, ES256)
- Implement scope-based access control

### Monitoring & Logging

- Log all API requests (excluding sensitive data)
- Monitor for unusual patterns (high volume, failed auth, etc.)
- Set up alerts for security events
- Retain logs for compliance requirements

## Security Features

### Built-in Protections

| Feature | Description |
|---------|-------------|
| CSPRNG | Cryptographically secure random number generation |
| No PII in UIN | Foundational mode embeds no personal data |
| Row-level Locking | Prevents race conditions on UIN claims |
| Integrity Hash | RIPEMD-160 hash for tamper detection |
| Timing-safe Comparison | Prevents timing attacks on token verification |
| Immutable Audit Log | Append-only audit trail for compliance |
| Sector Tokenization | HMAC-derived unlinkable sector identifiers |

### Checksum Validation

All generated UINs include checksum validation to prevent:
- Transcription errors
- Data entry mistakes
- Accidental modifications

## Disclosure Policy

We follow a coordinated disclosure process:

1. Security researcher reports vulnerability privately
2. We acknowledge and investigate the report
3. We develop and test a fix
4. We release the fix and publish a security advisory
5. After 90 days (or upon fix release), the researcher may publish details

## Security Advisories

Security advisories will be published on:
- [GitHub Security Advisories](https://github.com/tunjidurodola/osia_uin_generator/security/advisories)
- Release notes

## Contact

- **Security Issues**: security@pocketone.eu
- **General Inquiries**: tunji.d@pocketone.eu

## Acknowledgments

We thank the security research community for helping keep OSIA UIN Generator secure. Contributors who report valid security issues will be acknowledged in our Hall of Fame (with their permission).

---

*This security policy is based on industry best practices and follows the [ISO 27001](https://www.iso.org/isoiec-27001-information-security.html) and [OWASP](https://owasp.org/) guidelines.*
