import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const stable = (value) => JSON.stringify(value);

export function validateSubmission(baseCatalog, candidateCatalog) {
  const baseById = new Map(baseCatalog.games.map(game => [game.id, game]));
  const candidateById = new Map(candidateCatalog.games.map(game => [game.id, game]));

  const removed = [...baseById.keys()].filter(id => !candidateById.has(id));
  assert.deepEqual(removed, [], `Catalog entries cannot be deleted or renamed; set status to hidden instead: ${removed.join(', ')}`);

  const changed = candidateCatalog.games.filter(game => stable(game) !== stable(baseById.get(game.id)));
  assert.ok(changed.length <= 1, `A game submission may add or update one entry; found ${changed.length}`);

  for (const game of changed) {
    const previous = baseById.get(game.id);
    if (!previous) {
      assert.equal(game.source?.type, 'hosted-page', 'New external submissions must use source.type hosted-page');
    } else if (previous.source?.type === 'managed-unity') {
      assert.fail(`Managed game ${game.id} can only be changed in a maintainer-authored change`);
    }
  }

  return { changed: changed.map(game => game.id) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [candidatePath = 'api/Games/gamesMeta.json', baseRef] = process.argv.slice(2);
  assert.ok(baseRef, 'Usage: node scripts/validate-game-submission.mjs [candidate-path] <base-git-ref>');
  const candidate = JSON.parse(await readFile(candidatePath, 'utf8'));
  const base = JSON.parse(execFileSync('git', ['show', `${baseRef}:api/Games/gamesMeta.json`], { encoding: 'utf8' }));
  if (base?.schemaVersion !== 1 || !Array.isArray(base.games)) {
    console.log('Legacy catalog baseline detected; submission-boundary check starts after the versioned catalog migration');
    process.exit(0);
  }
  const result = validateSubmission(base, candidate);
  console.log(result.changed.length ? `Valid submission change: ${result.changed[0]}` : 'No catalog entry changed');
}
