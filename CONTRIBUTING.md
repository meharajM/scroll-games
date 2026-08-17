# Contributing to Scroll Games

Thanks for helping make playable indie-game discovery safer, faster, and more useful. Contributions are welcome in code, documentation, accessibility, design, testing, and the curated game catalog.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before opening an issue

- Search existing issues and pull requests.
- Use the security process in [SECURITY.md](SECURITY.md) for vulnerabilities, credentials, personal data, or active abuse.
- Use the game-report template for catalog safety, rights, privacy, rating, or availability concerns.
- Keep feature proposals aligned with the [product validation plan](docs/PRODUCT_VALIDATION_PLAN.md). Deferred features need evidence that they unblock a current validation gate.

## Development setup

Use Node.js 20 or newer.

```bash
npm install
npm --prefix api install
npm --prefix client install
```

Run the API and client in separate terminals:

```bash
npm --prefix api start
npm --prefix client run dev
```

## Make a focused change

1. Fork the repository and create a short-lived branch.
2. Keep the change scoped to one problem.
3. Follow existing TypeScript, React, Node.js, CSS, and documentation patterns.
4. Add the smallest check that would fail if non-trivial behavior regressed.
5. Do not commit dependencies, build output, environment files, credentials, reports, or device signing material.
6. Explain the user-facing outcome and verification in the pull request.

## Required checks

Run checks relevant to your change; run all four before a broad pull request.

```bash
npm test
npm run lint
npm run build
npm run test:e2e
```

## Submit a game

Game submissions use a stricter publication boundary. Read [docs/ADDING_A_GAME.md](docs/ADDING_A_GAME.md) and use the game-submission pull-request template.

A game pull request should change one catalog entry only unless a maintainer requested otherwise. Publication remains curated: passing automated checks does not guarantee acceptance.

## Documentation and brand

- Use “game,” “demo,” “catalog,” “developer,” and “destination” consistently.
- Describe Scroll Games as human-curated and open source; do not imply that every submission is accepted.
- Do not claim analytics, personalization, monetization, offline play, or audience scale that the live product does not provide.
- Follow [docs/BRAND.md](docs/BRAND.md) for approved positioning, colors, logo usage, and search descriptions.

## Review expectations

Maintainers may request changes for correctness, security, privacy, accessibility, scope, loading performance, documentation, or catalog fit. Be respectful, respond to the technical concern, and keep discussion attached to the change.
