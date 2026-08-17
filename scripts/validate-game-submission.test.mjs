import assert from 'node:assert/strict';
import test from 'node:test';
import { validateSubmission } from './validate-game-submission.mjs';

const hosted = (id) => ({ id, source: { type: 'hosted-page', url: `https://example.com/${id}` } });
const managed = (id) => ({ id, source: { type: 'managed-unity', gameId: id } });
const catalog = (...games) => ({ schemaVersion: 1, games });

test('accepts one new hosted-page entry', () => {
  assert.deepEqual(validateSubmission(catalog(hosted('one')), catalog(hosted('one'), hosted('two'))), { changed: ['two'] });
});

test('rejects new or modified managed entries', () => {
  assert.throws(() => validateSubmission(catalog(), catalog(managed('one'))), /hosted-page/);
  assert.throws(() => validateSubmission(catalog(managed('one')), catalog({ ...managed('one'), name: 'Changed' })), /maintainer/);
});

test('rejects deletion and multi-entry submissions', () => {
  assert.throws(() => validateSubmission(catalog(hosted('one')), catalog()), /deleted or renamed/);
  assert.throws(() => validateSubmission(catalog(), catalog(hosted('one'), hosted('two'))), /one entry/);
});
