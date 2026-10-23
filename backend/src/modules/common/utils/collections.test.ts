import { strict as assert } from 'node:assert';
import test from 'node:test';
import { collectionDiff } from './collections';

/** Verifies collection updates preserve shared values while isolating additions and removals. */
test('collectionDiff separates additions, retained values, and removals', () => {
  assert.deepEqual(collectionDiff({ current: ['tag-1', 'tag-2'], desired: ['tag-2', 'tag-3'] }), {
    added: ['tag-3'],
    retained: ['tag-2'],
    removed: ['tag-1'],
  });
});
