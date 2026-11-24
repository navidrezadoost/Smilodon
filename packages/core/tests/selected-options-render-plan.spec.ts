import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

type Item = { value: string; label: string };

const items: Item[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'fig', label: 'Fig' },
];

describe('selected-option render-plan ordering', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
    select.setItems(items);
  });

  afterEach(() => {
    select.remove();
  });

  function sourceKey(index: number): string {
    return (select as any)._itemRegistry.indexToKey.get(index);
  }

  function enableSelectedFirst(): void {
    select.updateConfig({ selectedOptions: { placement: 'selected-first' } });
  }

  it('keeps original order by default and separates display positions from source indices', () => {
    void select.setSelectedValues(['cherry', 'fig']);
    select.open();

    const plan = (select as any)._renderPlan;
    const keysInSourceOrder = items.map((_item, index) => sourceKey(index));
    expect(plan.filteredKeys).toEqual(keysInSourceOrder);
    expect(plan.filteredIndices).toEqual([0, 1, 2, 3, 4]);
    expect(plan.displayIndexByKey.get(sourceKey(2))).toBe(2);
    expect(plan.sourceIndexByKey.get(sourceKey(2))).toBe(2);
  });

  it('renders projected keys in stable selected-first order without renumbering source indices', async () => {
    await select.updateConfig({ selection: { mode: 'multi' } });
    await select.setSelectedValues(['fig', 'cherry']);
    const registryKeysBefore = items.map((_item, index) => sourceKey(index));
    enableSelectedFirst();
    select.open();

    const plan = (select as any)._renderPlan;
    const expectedKeys = [sourceKey(2), sourceKey(4), sourceKey(0), sourceKey(1), sourceKey(3)];
    expect(plan.filteredKeys).toEqual(expectedKeys);
    expect(plan.filteredIndices).toEqual([2, 4, 0, 1, 3]);
    expect(plan.displayIndexByKey.get(sourceKey(4))).toBe(1);
    expect(plan.sourceIndexByKey.get(sourceKey(4))).toBe(4);
    expect(items.map((_item, index) => sourceKey(index))).toEqual(registryKeysBefore);

    const renderedSourceIndices = [...select.shadowRoot!.querySelectorAll<HTMLElement>(
      '[data-sm-selectable], [data-selectable]',
    )].map((option) => Number(option.getAttribute('data-sm-index') ?? option.getAttribute('data-index')));
    expect(renderedSourceIndices).toEqual([2, 4, 0, 1, 3]);
  });

  it('keeps the selected partition stable through open-list selection changes and refreshes on reopen', async () => {
    await select.updateConfig({ selection: { mode: 'multi' } });
    await select.setSelectedValues(['cherry', 'fig']);
    enableSelectedFirst();
    select.open();

    const firstOpeningOrder = [...(select as any)._renderPlan.filteredKeys];
    expect(firstOpeningOrder).toEqual([sourceKey(2), sourceKey(4), sourceKey(0), sourceKey(1), sourceKey(3)]);

    await select.setSelectedValues(['date']);
    expect((select as any)._renderPlan.filteredKeys).toEqual(firstOpeningOrder);

    select.close();
    select.open();
    expect((select as any)._renderPlan.filteredKeys).toEqual([
      sourceKey(3), sourceKey(0), sourceKey(1), sourceKey(2), sourceKey(4),
    ]);
  });

  it('applies filtering before projection and carries projected order into virtual windows', async () => {
    await select.setSelectedValues(['cherry', 'fig']);
    enableSelectedFirst();
    select.open();

    (select as any)._state.searchQuery = 'e';
    (select as any)._renderOptions();

    const plan = (select as any)._renderPlan;
    expect(plan.filteredKeys).toEqual([sourceKey(2), sourceKey(0), sourceKey(3)]);
    expect(plan.filteredIndices).toEqual([2, 0, 3]);

    const virtualWindow = (select as any)._createVirtualRenderPlan(1, 3);
    expect(virtualWindow.filteredKeys).toEqual(plan.filteredKeys);
    expect(virtualWindow.intendedRenderKeys).toEqual([sourceKey(0), sourceKey(3)]);
    expect(virtualWindow.filteredIndices).toEqual([0, 3]);
    expect(virtualWindow.displayIndexByKey.get(sourceKey(0))).toBe(1);
    expect(virtualWindow.sourceIndexByKey.get(sourceKey(0))).toBe(0);
    expect(virtualWindow.filteredIndexByKey).toBe(virtualWindow.displayIndexByKey);
  });
});
