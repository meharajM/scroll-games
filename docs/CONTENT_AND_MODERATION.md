# Content and moderation policy

Scroll Games is a curated 13+ catalog, not an open upload service. A pull request is only a submission; maintainers decide what is published and remain responsible for every trial shown by the app.

## Submission requirements

Publishers must own or license the game and every included asset, accurately disclose ads, analytics, SDKs, network services, data handling, age suitability, download size, and destination, and keep the reviewed URLs under their control. A hosted trial or destination must not add materially different content or data practices without a new catalog pull request and version increase.

The platform rejects pornography, sexual exploitation, hate or harassment, graphic violence outside the declared rating, gambling or unlicensed prizes, deceptive interfaces, credential or wallet requests, malware, fingerprinting, cryptomining, hidden downloads, copyright or trademark infringement, impersonation, and content prohibited by Apple App Review or Google Play policies.

## User controls and reports

Every catalog item exposes its developer, age marker, permanent game link, an in-app private report form, and a local Hide control. The form returns a receipt when the configured moderation webhook accepts it and can immediately hide the game. Reports can cover safety, age rating, privacy, security, rights, impersonation, or availability. If delivery is unavailable, report privately to `meharaj137@gmail.com`; the public GitHub issue form is optional and must never contain sensitive information.

## Response process

- Imminent safety, malware, child-safety, or credential-theft reports should be reviewed as soon as they are received and targeted within 24 hours.
- Other complete reports are targeted for an initial response within seven days.
- A maintainer can set the entry to `hidden`; installed clients remove it after the catalog cache window and next refresh, without an app release.
- Repeated or serious violations can block the game, its hosting domain, or the publisher from future submissions.
- Publishers may appeal with evidence of rights, remediation, and updated test results. Re-publication requires a new review and pull request.

These are operational targets, not an automated guarantee. Store publication requires someone to actively monitor the listed mailbox and repository alerts.

Production must set `REPORT_WEBHOOK_URL` to an HTTPS-only private moderation receiver and `REPORT_WEBHOOK_TOKEN` to its bearer secret. The receiver should return a 2xx response only after durably accepting the report, restrict operator access, escape report text before display, and define deletion/retention procedures. Scroll Games retains only a bounded SHA-256 rate-limit key and recent timestamps in ephemeral process memory for up to the warm-instance lifetime; no raw network address is added to the webhook payload.
