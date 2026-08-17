# Product and production feasibility

Assessment date: August 17, 2026.

## Verdict

The product is technically feasible end to end as a web/PWA discovery feed and as a Capacitor-based Android/iOS shell. The runtime catalog design is also feasible: one production deployment reads a reviewed JSON catalog from `main`, so merged game entries can appear on installed clients without another binary or web deployment.

The largest risk is store policy and operations, not rendering technology. Apple expressly permits HTML5/JavaScript mini-games under guideline 4.7, but makes the host responsible for every game and requires privacy compliance, reporting/moderation, an indexed catalog with universal links, and age restriction. Apple also expects functionality beyond a repackaged website under guideline 4.2. Google applies Play policies to every linked or displayed third-party game and can subject software-without-installation catalogs to additional review. See the current [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [Google Play Policy Coverage](https://support.google.com/googleplay/android-developer/answer/10146128), and [Google Device and Network Abuse policy](https://support.google.com/googleplay/android-developer/answer/16559646).

Production confidence by channel:

| Channel | Feasibility | Main condition |
|---|---|---|
| Web/PWA | High | Deploy, monitor catalog/API, and admit only tested HTTPS games. |
| Android closed testing | High | Build with target API 36, sign an AAB, and complete Play Data safety/content declarations. |
| Google Play production | Medium | Demonstrate more than a basic WebView and continuously enforce policy across every game. |
| iOS TestFlight | High after signing | Requires Apple account/team, signing, current Xcode, and live backend. |
| iOS App Store | Medium-low until 4.7 operations are proven | Universal links, reporting response, age posture, complete index/metadata, and reviewer evidence are mandatory risks. |

## Comparable products

| Product | What it proves | Difference from Scroll Games |
|---|---|---|
| [itch.io HTML5](https://itch.io/docs/creators/html5) | Developers can publish iframe-playable HTML/JS games; itch.io hosts uploaded ZIPs and exposes discovery pages. | Mature hosting/community/commerce; Scroll Games is a curated, externally hosted, mobile-first trial feed. |
| [Poki for Developers](https://developers.poki.com/) | Curated web games can reach a very large cross-device audience through a developer platform. | Commercial publisher with SDK, monetization, localization, and selection support. |
| [CrazyGames Developer Portal](https://developer.crazygames.com/) | A submission portal, QA, analytics, and browser distribution are valuable to game developers. | Full hosting/publishing business; Scroll Games currently offers discovery only. |
| [MiniReview](https://minireview.io/about) | Players value curated mobile-game discovery, detailed tags, filters, ratings, and reviews. | Links to native games instead of providing instant playable trials. |

The defensible wedge is not “another game portal.” It is a human-curated, vertically swipeable demo sampler that lets players feel a real indie game before following its developer-selected destination. The transparent open-source publishing contract supports trust but is not the consumer value by itself. To become meaningfully useful, Scroll Games must validate destination conversion, editorial quality, privacy-respecting aggregate measurement, publisher verification, and reliable moderation/availability operations.

## Release constraints

- New Google Play submissions must target Android 16 / API 36 starting August 31, 2026, according to [Google Play target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en-AU).
- Apple requires a privacy-policy URL and disclosure of host and third-party data practices in App Store Connect. See [Manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy).
- Store age ratings must cover the highest content available, regardless of the local catalog filter. See [Apple age ratings](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/).
- Apple 4.7 universal-link association cannot be finalized until the Apple Team ID and signed app identifier exist.
- A merged catalog cannot be treated as “set and forget”: hosted game code can change at the same URL. Scheduled URL checks, publisher change declarations, manual sampling, a monitored report inbox, and rapid `hidden` takedowns are ongoing requirements.

## Recommended launch sequence

1. Deploy the PWA and API, add two or three real external trials, and run a time-boxed web beta.
2. Measure load failures, first-play latency, next-game use, reports, and developer submission effort without collecting unnecessary personal data.
3. Ship an Android closed test with the same curated catalog and complete policy/data declarations from the actual admitted games.
4. Add signed universal links and prepare a detailed Apple review note showing the software index, per-game metadata, 13+ posture, report/hide flow, and moderation process.
5. Submit iOS only after the live catalog and operational controls have been exercised, because an empty or mostly broken catalog will also risk minimum-functionality rejection.
