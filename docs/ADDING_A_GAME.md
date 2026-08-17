# Adding a game trial

External developers publish a short, touch-first demo by hosting it and adding one catalog entry. Scroll Games serves the catalog; it does not host external game files. Every listing also names a destination where interested players can wishlist, download, buy, or follow the full game.

## 1. Pick the right source format

External submissions use `hosted-page`:

```json
"source": { "type": "hosted-page", "url": "https://games.example.com/orbital-dash/index.html" }
```

`url` is public, permanent HTTPS entry HTML. No localhost, private IP address, expiring/signed link, preview deployment, password, login, payment, wallet, download, or installation step.

`managed-unity` is only for builds owned and operated by Scroll Games:

```json
"source": { "type": "managed-unity", "gameId": "Game3" }
```

Do not submit a managed Unity entry unless a maintainer assigned its `gameId`.

## 2. Meet hosting and game requirements

The entry page and every asset must use HTTPS. The page is embedded cross-origin in a sandboxed iframe without `allow-same-origin`, so browser storage is unavailable and fetch/XHR/WASM requests may have an opaque `Origin: null`. The trial must still work in that environment. It must not send `X-Frame-Options: DENY` or `SAMEORIGIN`. If it sends a `Content-Security-Policy` with `frame-ancestors`, include `https://scroll-games.vercel.app` (or `*` if appropriate):

```text
Content-Security-Policy: frame-ancestors https://scroll-games.vercel.app
```

For WebAssembly exports, serve correct types and compression headers; cross-origin asset loading generally needs CORS:

```text
Access-Control-Allow-Origin: *
Content-Type: application/wasm          # .wasm
Content-Type: application/javascript   # .js
Content-Type: application/octet-stream # Unity .data
Content-Encoding: br                    # only for Brotli-compressed files
```

- **Unity:** make a current Web/mobile build, enable size optimization and data caching, use mobile texture compression, declare portrait/landscape correctly, and test first load plus close/reopen. Serve Unity loader, framework, data, and wasm with matching headers.
- **Godot:** export for Web with mobile/touch controls, serve `.wasm`, `.pck`, and generated JavaScript correctly, and test audio after a tap. Avoid threaded exports unless every required cross-origin-isolation header and embed behavior has been verified.
- **Construct:** export HTML5, upload all generated files together, preserve relative paths, and test the generated loader in the iframe.
- **Plain HTML:** use responsive CSS, a viewport tag, pointer/touch input, relative asset URLs, and no parent-page assumptions.

Every trial must work in current iOS Safari and Android Chrome, fit phone viewports in declared orientation, use touch controls, remain usable after rotation where supported, and start audio only after a user gesture. Do not open windows, navigate the parent app, ask for credentials or financial details, or use deceptive prompts.

After the trial has rendered its playable start screen and installed its input handlers, it must confirm readiness to the parent frame:

```js
window.parent.postMessage({ type: 'scroll-games:ready', version: 1 }, '*');
```

The constant readiness payload contains no user or game data, so `*` lets the same trial work in the HTTPS PWA and the isolated iOS/Android Capacitor origins. Do not send user data with this message. Because the iframe intentionally has an opaque sandbox origin, the player accepts only this exact payload from the current iframe window with origin `null`; without it, the player presents recovery controls after 15 seconds instead of assuming a blank iframe is playable.

Only submit material you own or are licensed and authorized to distribute, including fonts, music, ads, analytics, SDKs, and artwork. Keep privacy collection minimal and disclose it in the PR; do not collect unnecessary identifiers, sell/share personal data, fingerprint users, mine cryptocurrency, execute hidden downloads, or load unreviewed executable content. Age rating must match trial content. Initial loader/data/framework/wasm transfer must be 50 MB or less (target 10 MB).

## 3. Add an exact schema-valid catalog entry

Edit `api/Games/gamesMeta.json`, inside its `games` array. Schema version is `1`; every game must contain exactly these top-level fields:

| Field | Contract |
|---|---|
| `id` | Permanent unique lowercase slug, 3–80 chars: `studio-game-name`. Never reuse or rename it. |
| `name` | Non-empty display name, max 80 chars. |
| `description` | 10–240 chars. |
| `version` | Numeric `major.minor.patch`, such as `1.2.0`. Increase for material changes. |
| `developer` | Exactly `name` (max 80 chars) and HTTPS `url`. |
| `destination` | Exactly HTTPS `url`, `label` (`wishlist`, `download`, `buy`, or `follow`), and `platform` (1–40 chars). This is the player’s next step after the demo. |
| `genres` | 1–5 unique lowercase slugs. |
| `orientation` | `portrait`, `landscape`, or `any`. |
| `minimumAge` | Integer 4–18, based on actual trial content. |
| `estimatedDownloadMb` | Initial transfer in MB, greater than 0 and no more than 50. Include loader, framework, data, wasm, and first-load assets. The feed also uses this value to decide whether preloading is safe, so measure it rather than guessing. |
| `status` | `active` publishes; `hidden` removes listing while preserving history. |
| `source` | Exactly one source shape shown in section 1. |

Copy/paste this hosted-page example, then replace every example value:

```json
{
  "id": "northstar-orbital-dash",
  "name": "Orbital Dash",
  "description": "Steer a tiny shuttle through colorful orbital gates in quick touch-friendly runs.",
  "version": "1.0.0",
  "developer": {
    "name": "Northstar Studio",
    "url": "https://northstar.example.com"
  },
  "destination": {
    "url": "https://store.example.com/orbital-dash",
    "label": "wishlist",
    "platform": "Example Store"
  },
  "genres": ["arcade", "racing"],
  "orientation": "portrait",
  "minimumAge": 9,
  "estimatedDownloadMb": 8.4,
  "status": "active",
  "source": {
    "type": "hosted-page",
    "url": "https://games.northstar.example.com/orbital-dash/index.html"
  }
}
```

## 4. Validate before opening a PR

From repository root, run:

```bash
node scripts/validate-games.mjs
node scripts/check-game-urls.mjs
node --test scripts/check-game-urls.test.mjs
node --test scripts/validate-game-submission.test.mjs
```

The URL preflight checks active hosted pages only: valid URL/HTTPS, public DNS/IP addresses, redirects (maximum 3), 10-second request timeout, 2xx status, HTML content type, and iframe-blocking headers. It deliberately refuses loopback, private, link-local, metadata, multicast, and reserved destinations; do not weaken it to test a local server. Its unit test has a separate explicit local-only override.

Also manually test a first load and relaunch in current iOS Safari and Android Chrome, touch controls, both relevant orientations, no automatic audio, iframe embed behavior, and the actual initial download size.

## 5. Pull request, review, and publication

Open a PR containing only your catalog entry unless a maintainer asked for related changes. Use the game-submission PR template and include URL, rights/license statement, privacy/analytics disclosure, and device/browser test notes. Automated catalog validation and URL preflight are checks, not approval.

Maintainers review ownership, licenses, content/age rating, privacy and security risks, destination accuracy, stable hosting, mobile interaction, size/loading, iframe/CSP headers, and availability. A trusted workflow preflights PR catalog URLs using checker code from the base branch, so an untrusted PR never executes its own network code in CI. Scheduled/manual checks use `main` only.

After merge, the deployed API reads the `main` catalog after its short cache window (up to 60 seconds). Clients receive the entry on next launch or foreground refresh; no client build or app-store release is needed. You may update hosted files at the same URL only when metadata remains true; open a new PR and increase `version` for material game, content, privacy, ownership, orientation, size, or URL changes. To remove a game, request a maintainer change its `status` to `hidden`; do not delete or reuse its ID.
