import { strict as assert } from 'node:assert';
import test from 'node:test';
import { taskInputSchema } from './create';

/** Ensures task writes accept only the complete documented write model. */
test('taskInputSchema validates task content, status, and relations', () => {
  const input = {
    title: 'Ship module',
    description: null,
    tagId: 'work',
    dueTo: '2026-10-20',
    status: 'inProgress',
    linkedTaskIds: ['task-1'],
    linkedNoteIds: ['note-1'],
  };
  assert.deepEqual(taskInputSchema.safeParse(input).data, input);
  assert.equal(taskInputSchema.safeParse({ ...input, status: 'later' }).success, false);
  assert.equal(taskInputSchema.safeParse({ ...input, linkedTaskIds: [1] }).success, false);
  assert.equal(taskInputSchema.safeParse({ ...input, title: ' ' }).success, false);
});
