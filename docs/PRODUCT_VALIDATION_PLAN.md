# Scroll Games product validation plan

## Decision

Proceed with a five-week, web-only validation of one focused proposition:

> Play short, curated demos of real indie games, then wishlist, download, or follow the games you enjoy.

Scroll Games will not compete as an endless casual-game portal or AI game-creation network. Its proposed wedge is human-curated, real indie games; immediate play before installation; and measurable downstream interest for developers.

Native distribution, accounts, social features, recommendations, monetization, and a self-service developer dashboard remain out of scope until the validation gates are met.

## Current implementation progress

- [x] Catalog destination metadata and player-facing destination actions.
- [x] Human-curated positioning and consistent public brand.
- [x] Crawlable product and developer pages with open-source contribution guidance.
- [ ] Privacy-conscious aggregate event measurement.
- [ ] Per-developer pilot report.
- [ ] External developer recruitment and public pilot.

## Target users

### Players

Mobile-first players who want to discover genuine indie games without watching trailers or installing each candidate first.

### Developers

Small studios and solo developers that already have a touch-friendly HTML5 or WebGL demo and a destination where interested players can wishlist, download, buy, or follow the full game.

The pilot will not target developers who need Scroll Games to port, rebuild, or host their game. That would test a different, much more expensive business.

## Product promises

### Player promise

- Real games selected by a human, not an infinite AI-generated catalog.
- A playable experience within seconds.
- A clear path to the full game.
- No account required during the pilot.

### Developer promise

- Developers keep ownership and hosting control.
- Scroll Games supplies qualified plays, not vanity impressions.
- Each participating developer receives a small report covering successful starts, meaningful plays, skips, and destination clicks.
- Submission is concierge-led during the pilot; developers do not need to learn the GitHub workflow.

## Core hypotheses

1. Developers with existing web builds will participate without an upfront payment or guaranteed audience.
2. Curated demos can become playable quickly and reliably enough to feel like scrolling, not downloading.
3. Players will sample multiple games in one session.
4. Playing a demo creates measurable intent to wishlist, download, buy, or follow a game.
5. Developers value the resulting traffic and feedback enough to participate again.

## Metrics

### North-star metric

**Qualified destination clicks per 100 meaningful plays.**

A meaningful play is a game that reported ready and remained active for at least 30 seconds. A destination click opens the developer's declared wishlist, store, download, or follow URL.

### Internal validation thresholds

These are decision thresholds for this pilot, not claimed industry benchmarks.

| Area | Gate |
|---|---|
| Supply | At least 10 external developers and 15 accepted games within two weeks of outreach. |
| Existing readiness | At least 8 developers already have a usable web build; Scroll Games does not create it for them. |
| Reliability | At least 95% of attempted games reach ready state; blank/error rate stays below 3%. |
| Speed | 75th-percentile time to ready is five seconds or less on the target mobile network profile. |
| Session depth | Median player samples at least four distinct games. |
| Meaningful engagement | At least 35% of players meaningfully play two or more games. |
| Conversion | At least 10 qualified destination clicks per 100 meaningful plays. |
| Breadth | Destination clicks occur across at least five different games, rather than one outlier. |
| Developer value | At least five developers call the report useful and at least three want to submit another game. |

The public pilot needs at least 300 players and 1,000 successful game starts before a go/no-go decision. Results below that size are directional only.

## Five-week execution plan

### Week 1: Make the product testable

Deliver only the changes needed to connect a playable trial to a measurable developer outcome.

1. Maintain the required catalog destination object:
   - URL.
   - Label: `wishlist`, `download`, `buy`, or `follow`.
   - Platform or storefront name.
2. Verify the persistent destination action across mobile viewport and game orientations.
3. Record a minimal event set:
   - Feed opened.
   - Game became ready.
   - Meaningful play reached.
   - Game skipped.
   - Destination clicked.
   - Loading or runtime failure.
4. Use a short-lived random session identifier. Do not collect accounts, advertising identifiers, fingerprints, or raw network addresses in the product dataset.
5. Produce one aggregate developer report from the captured events. A manual CSV or generated page is sufficient.
6. Tighten pilot acceptance around measured readiness. Target 10 MB or less initial transfer; reject builds above 20 MB unless they still meet the mobile readiness gate.

Exit condition: one external fixture game completes the entire path from feed impression to destination click, and its events appear in a test report.

### Week 2: Build supply manually

1. Prepare a one-page developer pitch:
   - Free curated placement during the pilot.
   - Developer retains ownership and hosting.
   - Player can reach the developer's store or wishlist page.
   - Developer receives an aggregate play-and-conversion report.
2. Contact developers who already publish mobile-friendly browser games, including relevant itch.io creators, game-jam teams, and small Unity/Godot studios with web exports.
3. Ask for the game URL, destination URL, content declaration, rights confirmation, age suitability, and permission to measure aggregate interaction events.
4. Have the maintainer create catalog entries. Keep GitHub pull-request submission optional until demand is proven.
5. Test every game on mobile Chrome and Safari/WebKit. Reject slow, broken, misleading, or policy-risky submissions.
6. Assemble one coherent collection rather than a random feed—for example, “15 one-thumb indie games.”

Exit condition: 15 accepted external games from at least 10 developers meet content, reliability, and destination requirements.

### Week 3: Closed pilot

Run a closed test with 30–50 players.

Observe, in addition to event data:

- Whether players understand that these are demos.
- Whether they notice and understand the destination action.
- Why they skip.
- Whether loading interrupts the scrolling mental model.
- Whether they trust externally developed games inside one app.

Fix only blockers that affect readiness, comprehension, destination clicks, or measurement. Do not add retention features during this week.

Exit condition: event data is trustworthy, no critical content or security issue remains, and at least 95% of attempts start successfully.

### Weeks 4–5: Public pilot

1. Release the themed collection on the web/PWA only.
2. Give every developer a permanent direct link to their game inside the collection and ask them to share it.
3. Share the collection in relevant indie-game communities where promotion is allowed.
4. Publish a small weekly editorial selection instead of marketing an infinite catalog.
5. Review failures and reports daily. Hide broken or unsafe games immediately.
6. Send each developer its aggregate result report at the end of the pilot and conduct a short follow-up interview.

Do not use paid acquisition until organic sharing proves that the product and measurements work. If the pilot cannot reach 300 relevant players organically, record audience acquisition as an unresolved risk rather than hiding it with broad paid traffic.

### End of week 5: Decision

#### Continue

Continue when all supply, reliability, speed, and conversion gates pass, and most engagement and developer-value gates pass.

Next stage:

- Grow to 25–50 curated games.
- Operate a weekly themed drop.
- Improve developer reports and editorial discovery.
- Test one lightweight preference signal, such as save or like, without adding a full social network.

#### Pivot toward developer playtesting

Choose this when meaningful-play-to-destination conversion is strong, but users do not browse deeply or return for collections. The valuable product may be a targeted playable-demo campaign and report, not a consumer game feed.

#### Pivot away from trial discovery

Choose this only when players browse and play repeatedly but rarely click destinations. This would indicate demand for a casual-game portal, which needs a separate monetization and developer-revenue model before more work.

#### Stop

Stop or retain the project as a portfolio piece when any of these remain true after one focused iteration:

- Ten credible developers cannot be recruited without Scroll Games building their web versions.
- Mobile readiness cannot reach the reliability and speed gates.
- Qualified destination conversion stays below 5%.
- Developers do not consider the resulting traffic or report useful.

## Explicitly deferred work

- iOS App Store and Google Play submission.
- Player accounts and profiles.
- Comments, followers, leaderboards, streaks, and chat.
- AI game generation or remixing.
- Personalization or recommendation models.
- Self-service developer dashboard.
- Advertising, purchases, revenue sharing, and subscriptions.
- Large-scale hosting or automated game porting.

These features add cost and operational responsibility without proving the core transaction: a player enjoys a real demo and expresses downstream interest.

## Gate for native apps

Reconsider native apps only after Scroll Games has:

- At least 1,000 monthly engaged web users.
- At least 25 reliable external games.
- Maintained the conversion threshold for four consecutive weeks.
- Successfully operated reporting, moderation, and rapid takedown procedures.
- Evidence from player interviews that installing Scroll Games would improve repeat usage.

Until then, the web is both the product and the cheapest valid test.
