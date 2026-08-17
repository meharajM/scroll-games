# Store submission worksheet

This worksheet separates repository-ready material from account-, signing-, and live-catalog decisions that cannot be completed in source control.

## Suggested listing copy

- **Name:** Scroll Games
- **Apple subtitle:** Play indie demos instantly
- **Google short description:** Play curated indie game demos before you wishlist, follow, or download.
- **Primary category:** Games (Casual)
- **Target audience:** 13+; do not select Apple’s Kids category or a Google Play child audience without a separate Families/privacy review.
- **Privacy URL:** `https://scroll-games.vercel.app/privacy.html`
- **Support URL:** `https://scroll-games.vercel.app/support.html`
- **Developer website:** `https://github.com/meharajM/scroll-games`

Suggested description:

> Find your next favorite game by playing it, not just watching a trailer. Scroll Games is a human-curated feed of short, touch-friendly demos from independent developers. Move between games instantly, then wishlist, download, buy, or follow the games that earn your attention. Browse by name, studio, or genre, hide titles you do not want to see, and report concerns directly to the platform maintainer. New reviewed demos can appear through the live catalog without an app update.

Do not claim a number of games, offline gameplay, parental controls, ratings/reviews, personalization, or privacy properties that the live build does not provide.

## Apple App Store Connect

- Create the app with bundle ID `com.scrollgames.app` under the final Apple team.
- Complete content rights because the app displays third-party games.
- Answer the age-rating questionnaire for the highest content and capability available in any listed trial; the local age preference does not lower the store rating.
- Complete App Privacy using both platform behavior and every admitted game’s disclosed data practices. Standard hosting/third-party network access must not be ignored.
- Add the privacy and support URLs above after the production deployment serves them.
- Configure universal links after the Apple Team ID exists: Associated Domains entitlement plus the production `apple-app-site-association` file.
- Supply screenshots from the signed production-like build with real approved trials, not fixture content.
- In App Review notes, identify the app as an HTML5/JavaScript mini-game catalog under guideline 4.7 and point reviewers to Browse, age preference, Report, Hide, privacy, and support. Explain that no native APIs or user permissions are exposed to trials and that there is no login or purchase flow.
- Keep the API/catalog live throughout review and include any test steps needed to reach at least three representative games.

## Google Play Console

- Create the app with package `com.scrollgames.app`, enroll in Play App Signing, and protect/upload the keystore through the owner’s secret-management process.
- Produce a signed release AAB targeting API 36 before submission on or after August 31, 2026.
- Complete Data safety, Ads, Content rating, Target audience, App access, and third-party content/policy declarations based on the actual live catalog.
- Use a 13+ target posture unless the product completes a separate child-directed/Families review.
- Run internal and closed tracks before production and attach pre-launch report results to the release checklist.
- Configure Android App Links after the release signing SHA-256 certificate is known by publishing `/.well-known/assetlinks.json` and adding the verified host intent filter.

## Required external inputs

- Apple Developer and Google Play Console account access.
- Apple Team ID, distribution certificate/profile, and App Store Connect record.
- Android upload keystore and Play App Signing certificate fingerprint.
- Final production domain ownership and deployment.
- Final privacy/data answers for every live third-party game.
- Store screenshots, promotional artwork, localization, countries, pricing, copyright owner, and legal/trader information.
- A person responsible for monitoring `meharaj137@gmail.com`, responding to reports, and hiding unsafe/broken trials.
