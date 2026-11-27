import { act, waitFor } from '@testing-library/react';
import { render as renderVue } from '@testing-library/vue';
import { render as renderSvelte } from '@testing-library/svelte';
import { createComponent, createSignal, type Component } from 'solid-js';
import { render as renderSolid } from 'solid-js/web';
import { render as renderReactComponent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createElement, StrictMode } from 'react';
import { createSelect, updateConfig as updateVanillaConfig } from '@smilodon/vanilla';
import { Select as ReactSelect } from '@smilodon/react';
import { Select as VueSelect } from '@smilodon/vue';
import { Select as SvelteSelect } from '@smilodon/svelte';
import { Select as SolidSelect } from '@smilodon/solid';
import { basicItems } from './fixtures/test-data';

const stableItems = Object.freeze(basicItems.map((item) => Object.freeze({ ...item })));
const reactItems = [...stableItems];
const initialConfig = {
  selectedOptions: { placement: 'selected-first' as const },
  scrollToSelected: {
    enabled: false,
    multiSelectTarget: 'last' as const,
    onOpen: 'preserve' as const,
    behavior: 'auto' as const,
    block: 'center' as const,
  },
};
const partialUpdate = {
  selectedOptions: { placement: 'original' as const },
  scrollToSelected: { onOpen: 'align' as const },
};

function optionOrder(element: any): string[] {
  return [...element.shadowRoot.querySelectorAll('[part="option"][data-value]')]
    .map((option: Element) => option.getAttribute('data-value') ?? '');
}

function expectMergedConfig(element: any): void {
  expect(element._config.selectedOptions).toMatchObject({
    placement: 'original',
    groupedPlacement: 'within-group',
  });
  expect(element._config.scrollToSelected).toMatchObject({
    enabled: false,
    multiSelectTarget: 'last',
    onOpen: 'align',
    behavior: 'auto',
    block: 'center',
  });
}

async function verifyOpeningSnapshot(element: any, update: () => void | Promise<void>): Promise<void> {
  await waitFor(() => expect(element.getSelectedValues()).toEqual(['3']));
  element.open();
  expect(optionOrder(element)).toEqual(['3', '1', '2', '4', '5']);

  await update();
  expectMergedConfig(element);
  // Core owns the current opening snapshot: adapter updates must not reorder it.
  expect(optionOrder(element)).toEqual(['3', '1', '2', '4', '5']);

  element.close();
  element.open();
  expect(optionOrder(element)).toEqual(['1', '2', '3', '4', '5']);
  expect(element.getSelectedValues()).toEqual(['3']);
}

describe('selected-options adapter configuration parity', () => {
  it('forwards and reactively updates partial config through React without resetting the open snapshot', async () => {
    const onChange = vi.fn();
    const props = { items: reactItems, value: '3', config: initialConfig, onChange };
    const view = renderReactComponent(createElement(StrictMode, null, createElement(ReactSelect, props)));
    const element = view.container.querySelector('enhanced-select') as any;
    await verifyOpeningSnapshot(element, async () => {
      await act(async () => view.rerender(createElement(StrictMode, null,
        createElement(ReactSelect, { ...props, config: partialUpdate }))));
    });
    expect(stableItems).toEqual(basicItems);
    expect(onChange).not.toHaveBeenCalled();
    view.unmount();
  });

  it('preserves an uncontrolled React selection across a config update and reopen', async () => {
    const props = { items: reactItems, defaultValue: '3', config: initialConfig };
    const view = renderReactComponent(createElement(ReactSelect, props));
    const element = view.container.querySelector('enhanced-select') as any;
    await verifyOpeningSnapshot(element, async () => {
      await act(async () => view.rerender(createElement(ReactSelect, { ...props, config: partialUpdate })));
    });
    expect(stableItems).toEqual(basicItems);
    view.unmount();
  });

  it('forwards and reactively updates partial config through Vue', async () => {
    const props = { items: stableItems, modelValue: '3', config: initialConfig };
    const view = renderVue(VueSelect, { props });
    const element = view.container.querySelector('enhanced-select') as any;
    await verifyOpeningSnapshot(element, async () => {
      await view.rerender({ ...props, config: partialUpdate });
    });
    view.unmount();
  });

  it('forwards and reactively updates partial config through Svelte', async () => {
    const view = renderSvelte(SvelteSelect as any, {
      props: { items: stableItems, value: '3', config: initialConfig },
    });
    const element = view.container.querySelector('enhanced-select') as any;
    await verifyOpeningSnapshot(element, async () => {
      await act(async () => view.component.$set({ config: partialUpdate }));
    });
    view.unmount();
  });

  it('forwards and reactively updates partial config through Solid', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const [config, setConfig] = createSignal<typeof initialConfig | typeof partialUpdate>(initialConfig);
    const ComponentUnderTest = SolidSelect as unknown as Component<Record<string, unknown>>;
    const dispose = renderSolid(() => createComponent(ComponentUnderTest, {
      items: stableItems,
      value: '3',
      get config() { return config(); },
    }), host);
    const element = host.querySelector('enhanced-select') as any;
    await verifyOpeningSnapshot(element, async () => {
      setConfig(partialUpdate);
      await waitFor(() => expectMergedConfig(element));
    });
    dispose();
    host.remove();
  });

  it('forwards construction and imperative partial updates through Vanilla', async () => {
    const element = createSelect({
      items: stableItems as any,
      value: '3',
      config: initialConfig,
    }) as any;
    document.body.append(element);
    await verifyOpeningSnapshot(element, () => updateVanillaConfig(element, partialUpdate));
    element.remove();
  });
});
