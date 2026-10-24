import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { configureSelect, resetSelectConfig, selectConfig } from '../src/config/global-config';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

type Item = { value: string; label: string };

const items: Item[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

let select: EnhancedSelect | undefined;

function mountSelect(): EnhancedSelect {
  select = document.createElement('enhanced-select') as EnhancedSelect;
  document.body.appendChild(select);
  return select;
}

function optionIndexes(element: EnhancedSelect): number[] {
  return Array.from(
    element.shadowRoot!.querySelectorAll<HTMLElement>('.options-container [data-index]'),
    (option) => Number(option.dataset.index),
  );
}

function clickOption(element: EnhancedSelect, index: number): void {
  const option = element.shadowRoot!.querySelector<HTMLElement>(
    `.options-container [data-index="${index}"]`,
  );
  expect(option, `expected option at index ${index}`).toBeTruthy();
  option!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

function search(element: EnhancedSelect, query: string): void {
  const input = element.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]');
  expect(input).toBeTruthy();
  input!.value = query;
  input!.dispatchEvent(new Event('input', { bubbles: true }));
}

function clickLoadMore(element: EnhancedSelect): void {
  const button = element.shadowRoot!.querySelector<HTMLButtonElement>('.load-more-button');
  expect(button).toBeTruthy();
  button!.click();
}

function readInternalState(element: EnhancedSelect): {
  currentPage: number;
  isBusy: boolean;
  preserveScrollPosition: boolean;
  searchQuery: string;
  loadedItems: unknown[];
} {
  return (element as any)._state;
}

beforeEach(() => {
  resetSelectConfig();
});

afterEach(() => {
  select?.remove();
  select = undefined;
  resetSelectConfig();
});

describe('Phase 1 search and pagination characterization', () => {
  it('filters a single-select list case-insensitively and restores it when the query clears', () => {
    const element = mountSelect();
    element.setItems(items);
    element.updateConfig({ searchable: true });

    search(element, 'bAn');
    expect(optionIndexes(element)).toEqual([1]);

    element.clearSearch();
    expect(optionIndexes(element)).toEqual([0, 1, 2]);
  });

  it('keeps a single selection while its option is filtered out', () => {
    const element = mountSelect();
    element.setItems(items);
    element.updateConfig({ searchable: true });
    clickOption(element, 0);

    search(element, 'Banana');

    expect(optionIndexes(element)).toEqual([1]);
    expect(element.getSelectedValues()).toEqual(['apple']);

    element.clearSearch();
    expect(element.getSelectedValues()).toEqual(['apple']);
    expect(optionIndexes(element)).toEqual([0, 1, 2]);
  });

  it('keeps multiple selections while filtering the current result set', () => {
    const element = mountSelect();
    element.updateConfig({
      searchable: true,
      selection: { mode: 'multi', closeOnSelect: false },
    });
    element.setItems(items);
    clickOption(element, 0);
    clickOption(element, 2);

    search(element, 'banana');

    expect(optionIndexes(element)).toEqual([1]);
    expect(element.getSelectedValues()).toEqual(['apple', 'cherry']);

    element.clearSearch();
    expect(optionIndexes(element)).toEqual([0, 1, 2]);
    expect(element.getSelectedValues()).toEqual(['apple', 'cherry']);
  });

  it('characterizes a whitespace-query mismatch between search event results and rendered options', async () => {
    const element = mountSelect();
    element.setItems(items);
    element.updateConfig({ searchable: true });
    const searchEvent = new Promise<CustomEvent<{ query: string; results: Item[]; count: number }>>(
      (resolve) => {
        element.addEventListener('search', (event) => resolve(event as CustomEvent), { once: true });
      },
    );

    search(element, ' Apple ');
    const searchDetail = (await searchEvent).detail;

    // This records the current 1.10.0 behavior; it is not the intended search contract.
    expect(searchDetail).toMatchObject({ query: ' Apple ', count: 1 });
    expect(searchDetail.results.map(({ value }) => value)).toEqual(['apple']);
    expect(optionIndexes(element)).toEqual([]);
  });

  it('applies a host-delivered result after the query changes without request-generation filtering', () => {
    const element = mountSelect();
    element.setItems(items);
    element.updateConfig({ searchable: true, loadMore: { enabled: true, itemsPerLoad: 3 } });

    clickLoadMore(element);
    search(element, 'Banana');

    // A host response for an earlier request is accepted as a replacement. The host owns
    // query/request identity and must prevent stale responses if that is required.
    const staleHostResult = [
      { value: 'apple-2', label: 'Apple II' },
      { value: 'apple-3', label: 'Apple III' },
      { value: 'apple-4', label: 'Apple IV' },
      { value: 'apple-5', label: 'Apple V' },
    ];
    element.setItems(staleHostResult);

    expect(readInternalState(element).searchQuery).toBe('Banana');
    expect(readInternalState(element).loadedItems).toEqual(staleHostResult);
    expect(optionIndexes(element)).toEqual([]);
  });

  it('starts at initialPage and emits the incremented page; declared page size only affects neither signal nor data', () => {
    configureSelect({
      infiniteScroll: { enabled: false, initialPage: 4, pageSize: 1 },
      loadMore: { enabled: true, itemsPerLoad: 7 },
    });
    const element = mountSelect();
    element.setItems(items);
    const loadMoreEvents: Array<{ page: number; items: unknown[] }> = [];
    const callbackPages: number[] = [];
    element.addEventListener('loadMore', (event) => {
      loadMoreEvents.push((event as CustomEvent).detail);
    });
    element.updateConfig({ callbacks: { onLoadMore: (page) => callbackPages.push(page) } });

    expect(element.shadowRoot!.querySelector('.load-more-button')?.textContent).toBe('Load 7 more');
    clickLoadMore(element);

    expect(loadMoreEvents).toEqual([{ page: 5, items: [] }]);
    expect(callbackPages).toEqual([5]);
    expect(readInternalState(element).currentPage).toBe(5);
    expect(readInternalState(element).loadedItems).toEqual(items);
  });

  it('does not reset the current page when initialPage changes through updateConfig after mounting', () => {
    const element = mountSelect();
    element.setItems(items);
    element.updateConfig({ loadMore: { enabled: true, itemsPerLoad: 3 } });
    element.updateConfig({ infiniteScroll: { enabled: false, pageSize: 20, initialPage: 9 } });
    let page: number | undefined;
    element.addEventListener('loadMore', (event) => {
      page = (event as CustomEvent<{ page: number }>).detail.page;
    });

    clickLoadMore(element);

    expect(page).toBe(2);
  });

  it('ignores repeated load-more signals while the host acknowledgement is pending', async () => {
    const element = mountSelect();
    let callbackCount = 0;
    element.setItems(items);
    element.updateConfig({
      loadMore: { enabled: true, itemsPerLoad: 3 },
      callbacks: { onLoadMore: () => { callbackCount += 1; } },
    });

    clickLoadMore(element);
    await (element as any)._loadMoreItems();

    expect(callbackCount).toBe(1);
    expect(readInternalState(element).isBusy).toBe(true);
  });

  it('clears busy and emits an error when a synchronous load-more callback throws', () => {
    const element = mountSelect();
    let errorMessage: string | undefined;
    element.setItems(items);
    element.updateConfig({
      loadMore: { enabled: true, itemsPerLoad: 3 },
      callbacks: {
        onLoadMore: () => { throw new Error('host load failed'); },
      },
    });
    element.addEventListener('error', (event) => {
      errorMessage = (event as unknown as CustomEvent<{ message: string }>).detail.message;
    });

    clickLoadMore(element);

    expect(errorMessage).toBe('host load failed');
    expect(readInternalState(element).isBusy).toBe(false);
  });

  it('uses setItems as replacement and clears busy only when the host supplies more rows', () => {
    const element = mountSelect();
    element.setItems(items);
    element.updateConfig({ loadMore: { enabled: true, itemsPerLoad: 3 } });
    clickLoadMore(element);
    expect(readInternalState(element).isBusy).toBe(true);

    const accumulatedItems = [...items, { value: 'date', label: 'Date' }];
    element.setItems(accumulatedItems);

    expect(readInternalState(element).loadedItems).toEqual(accumulatedItems);
    expect(readInternalState(element).isBusy).toBe(false);
    expect(readInternalState(element).preserveScrollPosition).toBe(false);
  });

  it('currently leaves busy state set when a pending page resolves with no additional rows', () => {
    const element = mountSelect();
    element.setItems(items);
    element.updateConfig({ loadMore: { enabled: true, itemsPerLoad: 3 } });
    clickLoadMore(element);

    element.setItems([]);

    // Characterization of an unresolved host acknowledgement contract, not approval of it.
    expect(readInternalState(element).isBusy).toBe(true);
    expect(readInternalState(element).preserveScrollPosition).toBe(true);
    expect(element.shadowRoot!.querySelector('[part="loading"]')).toBeTruthy();
  });

  it('preserves function callbacks in normal global configuration but drops them in the clone helper', () => {
    const callback = () => undefined;
    configureSelect({ callbacks: { onSearch: callback } });

    expect(selectConfig.getConfig().callbacks.onSearch).toBe(callback);
    expect(selectConfig.mergeWithComponentConfig({}).callbacks.onSearch).toBeUndefined();
  });
});
