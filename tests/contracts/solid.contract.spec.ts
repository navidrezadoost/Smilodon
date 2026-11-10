import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/dom';
import { createComponent, createSignal, type Component } from 'solid-js';
import { render as renderSolid } from 'solid-js/web';
import '@smilodon/core';
import { Select, type SelectHandle } from '@smilodon/solid';
import type { SelectItem } from './fixtures/test-data';
import { basicItems } from './fixtures/test-data';

const solidGroupedItems = [
  { label: 'Fruits', options: [{ value: 'apple', label: 'Apple' }, { value: 'banana', label: 'Banana' }] },
  { label: 'Vegetables', options: [{ value: 'carrot', label: 'Carrot' }] },
];

const cleanups = new Set<() => void>();

function mount(props: Record<string, unknown>) {
  const host = document.createElement('div');
  document.body.append(host);
  const SolidSelect = Select as unknown as Component<Record<string, unknown>>;
  const disposeSolid = renderSolid(() => createComponent(SolidSelect, props), host);
  const dispose = () => {
    cleanups.delete(dispose);
    disposeSolid();
    host.remove();
  };
  cleanups.add(() => {
    dispose();
  });
  const element = host.querySelector('enhanced-select') as any;
  return { host, element, dispose };
}

afterEach(() => {
  for (const cleanup of cleanups) cleanup();
  cleanups.clear();
});

describe('Solid Adapter Contract Tests', () => {
  it('mounts the custom element and synchronizes the provided items', async () => {
    const { element } = mount({ items: basicItems, placeholder: 'Choose a fruit' });

    await waitFor(() => {
      expect(element?._state?.loadedItems).toHaveLength(basicItems.length);
      expect(typeof element?.updateConfig).toBe('function');
    });

    element.updateConfig({ placeholder: 'Choose a fruit' });
    expect(element.shadowRoot?.querySelector('input')?.getAttribute('placeholder')).toBe('Choose a fruit');
  });

  it('synchronizes controlled values reactively', async () => {
    const [value, setValue] = createSignal<string | number>('1');
    const { element } = mount({
      items: basicItems,
      get value() { return value(); },
    });

    await waitFor(() => expect(element?.getSelectedValues?.()).toEqual(['1']));
    setValue('2');
    await waitFor(() => expect(element?.getSelectedValues?.()).toEqual(['2']));
  });

  it('forwards selection callbacks with the selected item and index', async () => {
    const onSelect = vi.fn();
    const { element } = mount({ items: basicItems as SelectItem[], onSelect });

    await waitFor(() => expect(element?._state?.loadedItems).toHaveLength(basicItems.length));
    element.open();
    const option = element.shadowRoot?.querySelector('[part="option"][data-index="0"]') as HTMLElement | null;
    expect(option).toBeTruthy();
    option!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(basicItems[0], 0));
  });

  it('renders grouped items from the groupedItems prop', async () => {
    const { element } = mount({ groupedItems: solidGroupedItems });

    await waitFor(() => expect(element?._state?.loadedItems).toHaveLength(3));
    element.open();

    await waitFor(() => {
      expect(element.shadowRoot?.textContent).toContain('Fruits');
      expect(element.shadowRoot?.textContent).toContain('Vegetables');
    });
  });

  it('exposes the ref handle for selection and imperative item updates', async () => {
    let handle: SelectHandle | undefined;
    const { element } = mount({ items: basicItems, ref: (value: SelectHandle) => { handle = value; } });

    await waitFor(() => expect(typeof handle?.setItems).toBe('function'));
    handle!.setItems([{ value: 'x', label: 'Xigua' }]);
    await waitFor(() => expect(element?._state?.loadedItems).toHaveLength(1));

    handle!.setItems([{ value: 'x', label: 'Xigua' }, { value: 'y', label: 'Yam' }]);
    await waitFor(() => expect(element?._state?.loadedItems).toHaveLength(2));
    handle!.open();
    expect(handle!.getSelectedValues()).toEqual([]);
  });

  it('removes adapter event listeners when the Solid owner is disposed', async () => {
    const onSelect = vi.fn();
    const { element, dispose } = mount({ items: basicItems as SelectItem[], onSelect });

    await waitFor(() => expect(element?._state?.loadedItems).toHaveLength(basicItems.length));
    dispose();
    element.dispatchEvent(new CustomEvent('select', {
      detail: { item: basicItems[0], index: 0, value: '1', label: 'Apple', selected: true },
    }));

    expect(onSelect).not.toHaveBeenCalled();
  });
});
