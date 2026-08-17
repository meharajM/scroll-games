# Security policy

## Supported version

Security fixes target the current `main` branch and the production deployment. Older commits, forks, and developer-hosted games outside the active catalog are not maintained by Scroll Games.

## Private disclosure

Do not open a public issue for a vulnerability, exposed credential, personal-data leak, malicious game, or active abuse. Email `meharaj137@gmail.com` with the affected game ID or endpoint, impact, reproduction steps, and a safe way to follow up.

For an actively harmful hosted trial, include `URGENT` in the subject. A maintainer can remove it from installed clients by changing its catalog status to `hidden` and merging the reviewed change.

Never include passwords, access tokens, private keys, personal data, or live exploit payloads in a public pull request or issue.

You should receive an acknowledgement within seven days. Immediate safety, credential-theft, malware, or active-abuse reports are prioritized for faster review. Do not access data that is not yours, degrade the service, or exploit a vulnerability beyond what is necessary to demonstrate impact.

## Scope note

Managed Unity trials are intentionally public. Their API endpoint can issue 15-minute read URLs for catalog builds without user authentication; CORS is browser isolation, not access control. Do not place private or paid assets in the managed trial bucket.
