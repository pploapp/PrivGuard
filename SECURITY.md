# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the latest major version.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, please report security vulnerabilities to:

- Email: security@privguard.dev (or open a private security advisory on GitHub)

We ask that you:

1. **Do not** publicly disclose the vulnerability until a fix is released
2. Provide enough detail to reproduce the issue
3. Allow us 90 days to address the issue before public disclosure

We will:

- Acknowledge receipt within 48 hours
- Provide a detailed response within 7 days
- Release a fix as soon as possible
- Credit you in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices

When deploying PrivGuard in production:

- Always use HTTPS for API and dashboard
- Enable field-level encryption for PII data
- Use strong, unique database encryption keys
- Regularly audit consent records and DSR request logs
- Implement rate limiting on public-facing endpoints
- Follow the principle of data minimization
- Ensure compliance with GDPR Art. 32 (security of processing)