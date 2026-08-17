# Production readiness

Status date: August 17, 2026.

## Ready in the repository

- Versioned, validated JSON catalog with active/hidden states and managed/hosted source types.
- Runtime remote-catalog refresh with 60-second cache, strict validation, short in-process resolver cache, deployed fallback, and client last-known-good fallback.
- External hosted trials isolated in opaque-origin sandboxed iframes with a cooperative readiness handshake and recovery controls.
- Searchable catalog index, developer/genre/age metadata, permanent query links, 13+ local content preference, navigation, hide/show, and private report form with receipt/email fallback.
- Safe hosted-URL preflight with redirect limits, DNS/IP SSRF defenses, content/header checks, unit tests, scheduled checks, PR validation, CODEOWNERS, and one-entry external submission boundary.
- Public privacy, support, security, moderation, developer-publishing, feasibility, testing, native-release, and store-submission documentation.
- PWA manifest/icons and branded iOS/Android projects; native builds do not install the PWA service worker.
- Automated Desktop Chromium, Mobile Chrome, and Mobile Safari/WebKit E2E coverage.
- Android compile/target API 36 and native iOS/Android simulator build/launch coverage.

## Required before a public web launch

1. Merge and deploy this repository once so production serves the versioned API/client instead of the legacy catalog contract.
2. Configure AWS trial-read credentials, `REPORT_WEBHOOK_URL`, `REPORT_WEBHOOK_TOKEN`, and any production CORS/catalog override in the hosting secret store. The report receiver must be private, authenticated, monitored, and durable.
3. Add at least two real external `hosted-page` trials implementing the readiness handshake; run URL preflight and manual current-device acceptance before merge.
4. Verify production headers, catalog refresh after a real catalog-only merge, report receipt/takedown, privacy/support URLs, and fallback behavior from outside the maintainer network.
5. Add uptime/error monitoring for the catalog endpoint, report delivery, and hosted-game availability, with an on-call owner for urgent takedowns.

## Required before store submission

- Apple Developer and Google Play Console accounts, final legal/trader details, signing identities, protected Android upload key, and store records.
- Upgrade the iOS workstation to Xcode 26 and move from the Xcode-16-compatible Capacitor 7 line to Capacitor 8 in a separately tested release. The current Android project targets API 36 on Capacitor 7 and builds successfully, but Capacitor’s official API-36 line is version 8.
- Configure signed Apple Universal Links and Android App Links after Apple Team ID and signing-certificate SHA-256 values exist.
- Complete Apple privacy/content-rights/age questions and Google Data safety/ads/content-rating/target-audience declarations using the actual live game set—not generic platform assumptions.
- Capture final store screenshots and reviewer notes from signed production-like builds with live approved trials.
- Exercise TestFlight and Play internal/closed tracks, physical-device WebGL performance, interruption/resume, low-memory behavior, rotation, and real network loss.

## Accepted technical debt

- The host CSP retains `unsafe-eval` only for legacy managed Unity WebGL compatibility. Remove it after all managed builds use a tested non-eval/`wasm-unsafe-eval` toolchain.
- In-process report throttling is bounded and privacy-minimized but not a distributed abuse-control service; production webhook/edge rate limiting should enforce the durable limit.
- The client temporarily normalizes the deployed legacy catalog so native builds work during rolling deployment. Remove that adapter after production has served schema version 1 through a full supported-client window.
- Catalog-only publication is intentionally limited to externally hosted HTML5 trials. Managed S3 builds remain maintainer-operated and their 15-minute read URLs are public by design.

Repository checks passing does not itself mean App Store or Play approval; the live operational and account-owned items above are release gates.
