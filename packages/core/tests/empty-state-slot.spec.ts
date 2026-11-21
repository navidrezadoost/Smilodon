import { afterEach, describe, expect, it } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select.js';
import { resetSelectConfig } from '../src/config/global-config.js';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

function createSelect(options: { items?: unknown[]; searchable?: boolean } = {}): EnhancedSelect {
  const select = document.createElement('enhanced-select') as EnhancedSelect;
  select.updateConfig({ searchable: options.searchable ?? false });
  select.setItems(options.items ?? []);
  return select;
}

describe('Core empty-state slot and context contract', () => {
  afterEach(() => {
    document.body.replaceChildren();
    resetSelectConfig();
  });

  it('keeps the default no-options fallback and reports its context', () => {
    const select = createSelect();
    document.body.appendChild(select);

    const empty = select.shadowRoot!.querySelector<HTMLElement>('[part="no-results"]');
    expect(empty).not.toBeNull();
    expect(empty!.classList.contains('empty-state')).toBe(true);
    expect(empty!.querySelector('slot[name="empty-state"]')?.textContent).toBe('No options available');
    expect((select as any).getEmptyStateContext()).toEqual({ query: '', reason: 'no-options' });
  });

  it('projects consumer DOM through the named slot without replacing the fallback contract', () => {
    const select = createSelect();
    const customContent = document.createElement('div');
    customContent.slot = 'empty-state';
    customContent.textContent = 'Nothing to display.';
    select.appendChild(customContent);
    document.body.appendChild(select);

    const empty = select.shadowRoot!.querySelector<HTMLElement>('[part="no-results"]')!;
    const slot = empty.querySelector<HTMLSlotElement>('slot[name="empty-state"]');
    expect(slot).not.toBeNull();
    expect(slot!.assignedNodes()).toContain(customContent);
    expect(slot!.textContent).toBe('No options available');
    expect(empty.classList.contains('empty-state')).toBe(true);
  });

  it('reports exact query and stable reasons for no-results and no-options', () => {
    const select = createSelect({ items: [{ value: 'available', label: 'Available' }], searchable: true });
    document.body.appendChild(select);

    (select as any)._handleSearch('MiXeD Query ');
    expect((select as any).getEmptyStateContext()).toEqual({
      query: 'MiXeD Query ',
      reason: 'no-results',
    });
    expect(select.shadowRoot!.querySelector('[part="no-results"]')?.textContent)
      .toBe('No results found for "MiXeD Query "');

    (select as any)._handleSearch('');
    expect((select as any).getEmptyStateContext()).toBeNull();
    select.setItems([]);
    expect((select as any).getEmptyStateContext()).toEqual({ query: '', reason: 'no-options' });
  });

  it('emits only effective context changes and clears context when search or results replace emptiness', () => {
    const select = createSelect({ items: [{ value: 'match', label: 'Match' }], searchable: true });
    const changes: Array<{ context: unknown }> = [];
    select.addEventListener('emptyStateChange', (event) => {
      changes.push((event as CustomEvent<{ context: unknown }>).detail);
    });
    document.body.appendChild(select);

    expect(changes).toEqual([]);
    (select as any)._handleSearch('not-found');
    expect(changes).toEqual([{ context: { query: 'not-found', reason: 'no-results' } }]);
    (select as any)._renderOptions();
    expect(changes).toHaveLength(1);

    select.setItems([{ value: 'not-found', label: 'not-found' }]);
    expect(changes.at(-1)).toEqual({ context: null });
    expect((select as any).getEmptyStateContext()).toBeNull();

    select.setItems([]);
    expect(changes.at(-1)).toEqual({ context: { query: 'not-found', reason: 'no-results' } });
    (select as any)._handleSearch('');
    expect(changes.at(-1)).toEqual({ context: { query: '', reason: 'no-options' } });
    select.setItems([]);
    expect(changes).toHaveLength(4);

    const snapshot = (select as any).getEmptyStateContext();
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Reflect.set(snapshot, 'reason', 'no-results')).toBe(false);
    expect((select as any).getEmptyStateContext()).toEqual({ query: '', reason: 'no-options' });
  });

  it('does not expose an empty state while acknowledged remote search is pending', () => {
    const select = document.createElement('enhanced-select') as EnhancedSelect;
    select.updateConfig({
      searchable: true,
      infiniteScroll: { enabled: true, pageSize: 5 },
      dataLoading: { protocol: 'acknowledged', searchMode: 'remote', fetchLimit: 5 },
    });
    document.body.appendChild(select);
    const changes: unknown[] = [];
    select.addEventListener('emptyStateChange', (event) => {
      changes.push((event as CustomEvent).detail.context);
    });
    select.startDataLoading();
    (select as any)._handleSearch('pending-query');

    expect((select as any).getEmptyStateContext()).toBeNull();
    expect(select.shadowRoot!.querySelector('.searching-state')).not.toBeNull();
    expect(changes).toEqual([]);
  });
});
