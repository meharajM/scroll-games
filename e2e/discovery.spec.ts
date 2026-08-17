import { expect, test, type Page } from '@playwright/test';

const game = (name: string) => `iframe[title="${name} trial"]`;
const gameUrl = (slug: string) => `https://127.0.0.1:3011/games/${slug}.html`;
const readyGame = (id: string) => `.game-player-slot[data-game-id="${id}"][data-ready="true"]`;

const openFeed = async (page: Page, slug = 'stone-skipper') => {
  const gameLoaded = page.waitForResponse(response => response.url() === gameUrl(slug) && response.ok());
  await page.goto('/');
  await page.getByRole('button', { name: '18+' }).click();
  await gameLoaded;
  await expect(page.locator('.hosted-status')).toHaveCount(0);
};

test('loads active catalog into a playable sandboxed hosted game', async ({ page }) => {
  await openFeed(page);

  const frame = page.locator(game('Stone Skipper'));
  await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-pointer-lock');
  await expect(frame).toHaveAttribute('src', gameUrl('stone-skipper'));
  await expect(frame).toBeVisible();
  await expect(page.getByRole('link', { name: 'Wishlist' })).toHaveAttribute('href', 'https://example.test/stone-skipper');
});

test('accepts pointer interaction inside hosted game frame', async ({ page }) => {
  await openFeed(page);

  const frame = page.locator(game('Stone Skipper'));
  const box = await frame.boundingBox();
  if (!box) throw new Error('Hosted game iframe was not visible');

  const interaction = page.waitForRequest(request => request.url().startsWith('https://127.0.0.1:3011/interactions?game=Stone'));
  await page.mouse.click(box.x + 30, box.y + 90);
  await interaction;
});

test('navigates active games and skips hidden catalog entries', async ({ page }) => {
  await openFeed(page);

  await expect(page.locator(readyGame('orbit-drift'))).toHaveCount(1);
  await page.getByRole('button', { name: 'Next game' }).click();
  await expect(page.locator(game('Orbit Drift'))).toBeVisible();

  await expect(page.locator(readyGame('stone-skipper'))).toHaveCount(1);
  await page.getByRole('button', { name: 'Next game' }).click();
  await expect(page.locator(game('Stone Skipper'))).toBeVisible();
  await expect(page.locator(game('Hidden Fixture'))).toHaveCount(0);

  await page.getByRole('button', { name: 'Previous game' }).click();
  await expect(page.locator(game('Orbit Drift'))).toBeVisible();
});

test('warms the likely next game and switches without another load', async ({ page }) => {
  let orbitRequests = 0;
  await page.route(gameUrl('orbit-drift'), async route => {
    orbitRequests += 1;
    await new Promise(resolve => setTimeout(resolve, 1_500));
    await route.continue();
  });

  await openFeed(page);
  await expect(page.locator(readyGame('orbit-drift'))).toHaveCount(1);

  const startedAt = Date.now();
  await page.getByRole('button', { name: 'Next game' }).click();
  await expect(page.locator(game('Orbit Drift'))).toBeVisible();
  await expect(page.locator('.hosted-status')).toHaveCount(0);

  expect(Date.now() - startedAt).toBeLessThan(1_000);
  expect(orbitRequests).toBe(1);
});

test('prefetches a managed Unity build only after the current game is ready', async ({ page }) => {
  const prefetchedAssets = new Set<string>();
  await page.route('**/api/gamesMeta', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      schemaVersion: 1,
      games: [
        {
          id: 'stone-skipper', name: 'Stone Skipper', description: 'Fixture game one', version: '1.0.0',
          developer: { name: 'Scroll Games', url: 'https://example.test' }, genres: ['puzzle'], orientation: 'any',
          destination: { url: 'https://example.test/stone-skipper', label: 'wishlist', platform: 'Example Store' },
          minimumAge: 4, estimatedDownloadMb: 1, status: 'active',
          source: { type: 'hosted-page', url: gameUrl('stone-skipper') },
        },
        {
          id: 'managed-next', name: 'Managed Next', description: 'Managed Unity fixture', version: '1.0.0',
          developer: { name: 'Scroll Games', url: 'https://example.test' }, genres: ['arcade'], orientation: 'any',
          destination: { url: 'https://example.test/managed-next', label: 'follow', platform: 'Example Store' },
          minimumAge: 4, estimatedDownloadMb: 1, status: 'active',
          source: { type: 'managed-unity', gameId: 'ManagedNext' },
        },
      ],
    }),
  }));
  await page.route('**/api/getSignedUrls/ManagedNext', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      unityLoaderJsPath: '/prefetch/loader.js',
      frameworkUrl: '/prefetch/framework.js',
      codeUrl: '/prefetch/game.wasm',
      dataUrl: '/prefetch/game.data',
    }),
  }));
  await page.route('**/prefetch/**', route => {
    prefetchedAssets.add(new URL(route.request().url()).pathname);
    return route.fulfill({ body: 'fixture-asset' });
  });

  await openFeed(page);
  await expect.poll(() => prefetchedAssets.size).toBe(4);
});

test('browses, searches, reports, hides, and restores a game', async ({ page }) => {
  await openFeed(page);
  await page.getByRole('button', { name: 'Browse all games' }).click();

  const catalog = page.getByRole('dialog', { name: 'Game catalog' });
  await catalog.getByLabel('Search games').fill('orbit');
  await expect(catalog.getByText('Orbit Drift', { exact: true })).toBeVisible();
  await expect(catalog.getByText('Stone Skipper', { exact: true })).toHaveCount(0);

  await catalog.getByLabel('Search games').fill('stone');
  await catalog.getByRole('button', { name: 'Report' }).click();
  const report = page.getByRole('dialog', { name: 'Report game' });
  await expect(report.getByLabel('Hide this game on this device')).toBeChecked();
  await report.getByLabel('What happened?').fill('Fixture report verifies local hide behavior.');
  const receipt = page.waitForResponse(response => response.url().endsWith('/api/reports') && response.status() === 201);
  await report.getByRole('button', { name: 'Send report' }).click();
  await receipt;
  await expect(report.getByRole('status')).toHaveText('Report received: fixture-report-1');
  await report.getByRole('button', { name: 'Cancel' }).click();

  const stoneCard = catalog.locator('article').filter({ hasText: 'Stone Skipper' });
  await expect(stoneCard.getByRole('button', { name: 'Show' })).toBeVisible();
  await stoneCard.getByRole('button', { name: 'Show' }).click();
  await expect(stoneCard.getByRole('button', { name: 'Hide' })).toBeVisible();
});

test('uses saved catalog when a later request fails', async ({ page }) => {
  await openFeed(page);
  await page.route('**/api/gamesMeta', route => route.fulfill({ status: 503, body: 'catalog unavailable' }));
  const gameLoaded = page.waitForResponse(response => response.url() === gameUrl('stone-skipper') && response.ok());
  await page.reload();
  await gameLoaded;

  await expect(page.getByText('Offline: showing the most recently saved catalog.', { exact: true })).toBeVisible();
  await expect(page.locator(game('Stone Skipper'))).toBeVisible();
  await expect(page.locator('.hosted-status')).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('shows a usable catalog outage message', async ({ page }) => {
  await page.route('**/api/gamesMeta', route => route.fulfill({ status: 503, body: 'catalog unavailable' }));
  await page.goto('/');
  await page.getByRole('button', { name: '18+' }).click();

  await expect(page.getByRole('alert')).toContainText('Could not load games: Catalog returned HTTP 503');
});
