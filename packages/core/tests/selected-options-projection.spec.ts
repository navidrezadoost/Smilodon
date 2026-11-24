import { describe, expect, it } from 'vitest';
import { projectSelectedOptionGroups, projectSelectedOptionKeys } from '../src/utils/selected-options-projection';

describe('projectSelectedOptionKeys', () => {
  const source = ['apple', 'banana', 'cherry', 'date', 'fig'] as const;

  it('preserves source order in original mode', () => {
    const keys = projectSelectedOptionKeys(source, new Set(['cherry', 'fig']), 'original');

    expect(keys).toEqual(source);
    expect(keys).not.toBe(source);
  });

  it('stably partitions selected keys before unselected keys', () => {
    const keys = projectSelectedOptionKeys(source, new Set(['fig', 'cherry']), 'selected-first');

    expect(keys).toEqual(['cherry', 'fig', 'apple', 'banana', 'date']);
  });

  it('preserves relative source order within both partitions', () => {
    const keys = projectSelectedOptionKeys(source, new Set(['date', 'banana']), 'selected-first');

    expect(keys).toEqual(['banana', 'date', 'apple', 'cherry', 'fig']);
  });

  it('does not mutate the source list or selection set', () => {
    const selected = new Set(['cherry', 'fig']);
    const original = [...source];

    projectSelectedOptionKeys(source, selected, 'selected-first');

    expect(source).toEqual(original);
    expect([...selected]).toEqual(['cherry', 'fig']);
  });

  it('ignores selected keys outside the eligible ordered projection', () => {
    const keys = projectSelectedOptionKeys(source, new Set(['cherry', 'not-loaded']), 'selected-first');

    expect(keys).toEqual(['cherry', 'apple', 'banana', 'date', 'fig']);
  });

  it('preserves key identity for non-string keys', () => {
    const first = { id: 1 };
    const second = { id: 2 };
    const third = { id: 3 };

    const keys = projectSelectedOptionKeys([first, second, third], new Set([third]), 'selected-first');

    expect(keys).toEqual([third, first, second]);
    expect(keys[0]).toBe(third);
  });
});

describe('projectSelectedOptionGroups', () => {
  it('partitions selections within each group while preserving group identity and order', () => {
    const firstGroup = { label: 'Repeated' };
    const secondGroup = { label: 'Repeated' };
    const groups = [
      { groupIdentity: firstGroup, orderedKeys: ['apple', 'banana', 'cherry'] },
      { groupIdentity: secondGroup, orderedKeys: ['carrot', 'spinach', 'tomato'] },
    ] as const;

    const result = projectSelectedOptionGroups(groups, new Set(['cherry', 'banana', 'spinach']));

    expect(result).toEqual([
      { groupIdentity: firstGroup, orderedKeys: ['banana', 'cherry', 'apple'] },
      { groupIdentity: secondGroup, orderedKeys: ['spinach', 'carrot', 'tomato'] },
    ]);
    expect(result[0].groupIdentity).toBe(firstGroup);
    expect(result[1].groupIdentity).toBe(secondGroup);
    expect(groups[0].orderedKeys).toEqual(['apple', 'banana', 'cherry']);
    expect(result.flatMap((group) => group.orderedKeys).sort()).toEqual(
      ['apple', 'banana', 'carrot', 'cherry', 'spinach', 'tomato'].sort(),
    );
  });

  it('keeps empty groups, groups without selections, and all-selected groups stable', () => {
    const groups = [
      { groupIdentity: 0, orderedKeys: [] as string[] },
      { groupIdentity: 1, orderedKeys: ['a', 'b'] },
      { groupIdentity: 2, orderedKeys: ['c', 'd'] },
    ];

    expect(projectSelectedOptionGroups(groups, new Set(['c', 'd']))).toEqual([
      { groupIdentity: 0, orderedKeys: [] },
      { groupIdentity: 1, orderedKeys: ['a', 'b'] },
      { groupIdentity: 2, orderedKeys: ['c', 'd'] },
    ]);
  });
});
