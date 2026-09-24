import { describe, expect, it } from 'vitest';
import { readWorkspace } from '../src/lib/workspace-storage';
describe('persisted workspace validation', () => {
  it('returns an empty workspace for first use', () =>
    expect(readWorkspace(null)).toEqual({ added: [], updated: {}, deleted: [] }));
  it('rejects malformed JSON', () => expect(() => readWorkspace('{broken')).toThrow());
  it('rejects incomplete products before they reach rendering', () =>
    expect(() =>
      readWorkspace(
        JSON.stringify({ added: [{ id: 1, title: 'Broken' }], updated: {}, deleted: [] }),
      ),
    ).toThrow());
  it('rejects corrupted updates too', () =>
    expect(() =>
      readWorkspace(JSON.stringify({ added: [], updated: { 1: { id: 1 } }, deleted: [] })),
    ).toThrow());
  it('accepts an empty persisted workspace', () =>
    expect(readWorkspace('{"added":[],"updated":{},"deleted":[1]}').deleted).toEqual([1]));
});
