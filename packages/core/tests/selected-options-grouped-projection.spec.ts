import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';
import type { GroupedItem } from '../src/types';
import { resolveSelectedTargetKey } from '../src/utils/selected-target-resolver';

if (!customElements.get('enhanced-select')) customElements.define('enhanced-select', EnhancedSelect);

type Item = { value: string; label: string; disabled?: boolean };

function press(select: EnhancedSelect, key: string, options: KeyboardEventInit = {}): void {
  const input = select.shadowRoot?.querySelector<HTMLInputElement>('[part="input"]');
  expect(input).toBeTruthy();
  input!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options }));
}

describe('public grouped selected-first projection (E3.2)', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    select.updateConfig({ selectedOptions: { placement: 'selected-first' } });
    document.body.appendChild(select);
    select.updateConfig({ selection: { mode: 'multi' }, searchable: true });
  });

  afterEach(() => select.remove());

  function sourceIndex(value: string): number {
    const item = select.loadedItems.find((candidate) => (candidate as Item).value === value);
    return select.loadedItems.indexOf(item);
  }

  function renderedOptionValues(): string[] {
    return [...select.shadowRoot!.querySelectorAll<HTMLElement>('[data-sm-selectable], [data-selectable]')]
      .map((option) => option.getAttribute('data-value') ?? '');
  }

  it('projects selected options within duplicate-label groups without changing source identity', async () => {
    const groups: GroupedItem[] = [
      { label: 'Shared label', options: [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
        { value: 'cherry', label: 'Cherry' },
      ] },
      { label: 'Shared label', options: [
        { value: 'carrot', label: 'Carrot' },
        { value: 'spinach', label: 'Spinach' },
        { value: 'tomato', label: 'Tomato' },
      ] },
    ];
    select.setGroupedItems(groups);
    await select.setSelectedValues(['cherry', 'spinach']);
    const originalKeys = select.loadedItems.map((_item, index) => (select as any)._itemRegistry.indexToKey.get(index));

    select.open();

    const plan = (select as any)._renderPlan;
    expect(plan.groupedPresentation.map(({ group }: { group: GroupedItem }) => group)).toEqual(groups);
    expect(plan.groupedPresentation[0].groupIndex).toBe(0);
    expect(plan.groupedPresentation[1].groupIndex).toBe(1);
    expect(plan.filteredKeys).toEqual(['cherry', 'apple', 'banana', 'spinach', 'carrot', 'tomato']);
    expect(renderedOptionValues()).toEqual(['cherry', 'apple', 'banana', 'spinach', 'carrot', 'tomato']);
    expect([...select.shadowRoot!.querySelectorAll('.group-header')].map((header) => header.textContent))
      .toEqual(['Shared label', 'Shared label']);
    expect(plan.filteredIndices).toEqual([2, 0, 1, 4, 3, 5]);
    expect(plan.filteredKeys.map((key: string) => plan.sourceIndexByKey.get(key)))
      .toEqual([2, 0, 1, 4, 3, 5]);
    expect(resolveSelectedTargetKey(plan.filteredKeys, new Set(['cherry', 'spinach']), 'first')).toBe('cherry');
    expect(resolveSelectedTargetKey(plan.filteredKeys, new Set(['cherry', 'spinach']), 'last')).toBe('spinach');
    expect(select.loadedItems.map((_item, index) => (select as any)._itemRegistry.indexToKey.get(index)))
      .toEqual(originalKeys);
  });

  it('keeps an empty group and partitions all-selected and unselected groups stably', async () => {
    const groups: GroupedItem[] = [
      { label: 'Empty', options: [] },
      { label: 'Selected', options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ] },
      { label: 'Unselected', options: [
        { value: 'c', label: 'C' },
        { value: 'd', label: 'D' },
      ] },
    ];
    select.setGroupedItems(groups);
    await select.setSelectedValues(['a', 'b']);

    select.open();

    const plan = (select as any)._renderPlan;
    expect(plan.groupedPresentation.map(({ groupIndex }: { groupIndex: number }) => groupIndex)).toEqual([0, 1, 2]);
    expect(plan.groupedPresentation[0].orderedKeys).toEqual([]);
    expect(plan.filteredKeys).toEqual(['a', 'b', 'c', 'd']);
    expect(renderedOptionValues()).toEqual(['a', 'b', 'c', 'd']);
    expect(select.shadowRoot!.querySelectorAll('.group-header')).toHaveLength(3);
  });

  it('keeps custom group headers structural and associated with their original groups', async () => {
    const groups: GroupedItem[] = [
      { label: 'Duplicate', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] },
      { label: 'Duplicate', options: [{ value: 'c', label: 'C' }, { value: 'd', label: 'D' }] },
    ];
    select.setGroupedItems(groups);
    const renderedGroups: GroupedItem[] = [];
    select.groupHeaderRenderer = (group, index) => {
      renderedGroups.push(group);
      const header = document.createElement('h3');
      header.dataset.groupIndex = String(index);
      header.textContent = `Custom ${index}: ${group.label}`;
      return header;
    };
    renderedGroups.length = 0;
    await select.setSelectedValues(['b', 'd']);

    select.open();

    const headers = [...select.shadowRoot!.querySelectorAll<HTMLElement>('.group-header')];
    expect(headers.map((header) => header.textContent)).toEqual(['Custom 0: Duplicate', 'Custom 1: Duplicate']);
    expect(headers.map((header) => header.getAttribute('role'))).toEqual(['presentation', 'presentation']);
    expect(headers.map((header) => header.dataset.groupIndex)).toEqual(['0', '1']);
    expect(renderedGroups.slice(-2)[0]).toBe(groups[0]);
    expect(renderedGroups.slice(-2)[1]).toBe(groups[1]);
    expect(renderedOptionValues()).toEqual(['b', 'a', 'd', 'c']);
    expect(headers[0].nextElementSibling?.getAttribute('data-value')).toBe('b');
    expect(headers[1].nextElementSibling?.getAttribute('data-value')).toBe('d');
  });

  it('uses one flattened visual order for keyboard navigation across group boundaries and skips disabled items', async () => {
    const groups: GroupedItem[] = [
      { label: 'First', options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', disabled: true },
      ] },
      { label: 'Second', options: [
        { value: 'c', label: 'C' },
        { value: 'd', label: 'D' },
      ] },
    ];
    select.setGroupedItems(groups);
    await select.setSelectedValues(['d']);
    select.open();
    expect((select as any)._renderPlan.filteredKeys).toEqual(['a', 'b', 'd', 'c']);

    press(select, 'End');
    expect((select as any)._engine.state.activeKey).toBe('c');
    press(select, 'ArrowUp');
    expect((select as any)._engine.state.activeKey).toBe('d');
    press(select, 'ArrowUp');
    expect((select as any)._engine.state.activeKey).toBe('a');

    press(select, 'Home');
    press(select, 'ArrowDown', { shiftKey: true });
    expect((select as any)._engine.state.activeKey).toBe('d');
    expect(new Set((select as any)._engine.state.selectedKeys)).toEqual(new Set(['a', 'd']));
    press(select, 'd');
    expect((select as any)._engine.state.activeKey).toBe('d');
    press(select, 'PageUp');
    expect((select as any)._engine.state.activeKey).toBe('a');
    press(select, 'PageDown');
    expect((select as any)._engine.state.activeKey).toBe('c');
  });

  it('keeps the grouped partition stable while open and refreshes it on the next opening', async () => {
    const groups: GroupedItem[] = [
      { label: 'One', options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
        { value: 'c', label: 'C' },
      ] },
      { label: 'Two', options: [
        { value: 'd', label: 'D' },
        { value: 'e', label: 'E' },
      ] },
    ];
    select.setGroupedItems(groups);
    await select.setSelectedValues(['c', 'e']);
    select.open();
    const openingOrder = [...(select as any)._renderPlan.filteredKeys];
    expect(openingOrder).toEqual(['c', 'a', 'b', 'e', 'd']);

    await select.setSelectedValues(['b']);
    expect((select as any)._renderPlan.filteredKeys).toEqual(openingOrder);

    select.close();
    select.open();
    expect((select as any)._renderPlan.filteredKeys).toEqual(['b', 'a', 'c', 'd', 'e']);
  });

  it('keeps filtering and option selection functional with grouped source data', async () => {
    const groups: GroupedItem[] = [
      { label: 'Fruit', options: [
        { value: 'apple', label: 'Apple' },
        { value: 'berry', label: 'Berry' },
      ] },
      { label: 'Vegetable', options: [
        { value: 'carrot', label: 'Carrot' },
      ] },
    ];
    select.setGroupedItems(groups);
    await select.setSelectedValues(['berry']);
    select.open();
    const input = select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!;
    input.value = 'car';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

    expect(renderedOptionValues()).toEqual(['carrot']);
    expect(sourceIndex('carrot')).toBeGreaterThanOrEqual(0);
  });
});
