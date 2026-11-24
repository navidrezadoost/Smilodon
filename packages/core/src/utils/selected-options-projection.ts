/**
 * Return a presentation-only ordering for option keys.
 *
 * The source array and selection set are never mutated. Callers remain
 * responsible for retaining the returned order as the displayed ordering for
 * the relevant render/open transaction.
 */
export function projectSelectedOptionKeys<K>(
  orderedKeys: readonly K[],
  selectedKeys: ReadonlySet<K>,
  placement: 'original' | 'selected-first',
): K[] {
  if (placement === 'original') return [...orderedKeys];

  const selected: K[] = [];
  const unselected: K[] = [];

  for (const key of orderedKeys) {
    (selectedKeys.has(key) ? selected : unselected).push(key);
  }

  return [...selected, ...unselected];
}

export interface GroupedOptionKeys<GroupIdentity, K> {
  /** Opaque identity; labels must not be used as a substitute for identity. */
  groupIdentity: GroupIdentity;
  orderedKeys: readonly K[];
}

/**
 * Stably partitions selected keys to the front of each group independently.
 * Group order, identity, membership, and the source arrays are preserved.
 */
export function projectSelectedOptionGroups<GroupIdentity, K>(
  groups: readonly GroupedOptionKeys<GroupIdentity, K>[],
  selectedKeys: ReadonlySet<K>,
): GroupedOptionKeys<GroupIdentity, K>[] {
  return groups.map(({ groupIdentity, orderedKeys }) => {
    const selected: K[] = [];
    const unselected: K[] = [];

    for (const key of orderedKeys) {
      (selectedKeys.has(key) ? selected : unselected).push(key);
    }

    return { groupIdentity, orderedKeys: [...selected, ...unselected] };
  });
}
