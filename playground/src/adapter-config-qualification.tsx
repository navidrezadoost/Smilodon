import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { mount as mountSvelte, unmount as unmountSvelte } from 'svelte';
import { createComponent, createSignal } from 'solid-js';
import { render as renderSolid } from 'solid-js/web';
import { Select as ReactSelect } from '@smilodon/react';
import { Select as ReactNativeWebSelect } from '@smilodon/react-native';
import { Select as VueSelect } from '@smilodon/vue';
import { Select as SolidSelect } from '@smilodon/solid';
import { createSelect, updateConfig as updateVanillaConfig } from '@smilodon/vanilla';
import { EnhancedSelect } from '@smilodon/core';
import SelectedOptionsSvelteHarness from '../SelectedOptionsSvelteHarness.svelte';
import { fixtureItems, initialConfig, partialConfig } from '../selected-options-fixture-data';

const fixtures = document.querySelector<HTMLElement>('#fixtures')!;
const adapterUpdates = new Map<string, (nextConfig: any) => void>();
const adapterSelectionUpdates = new Map<string, (nextValue: string) => void>();
const adapterDisposers = new Map<string, () => void>();
const adapterMounts = new Map<string, () => void>();

function makeSection(id: string, framework: string): HTMLElement {
  const section = document.createElement('section');
  section.dataset.framework = framework;
  section.innerHTML = `<button id="update-${id}">Update ${framework} config</button><button id="unmount-${id}">Unmount ${framework}</button><div id="mount-${id}"></div>`;
  return section;
}

function ReactHarness({ Component, framework }: { Component: typeof ReactSelect; framework: string }) {
  const [config, setConfig] = useState(initialConfig);
  const [value, setValue] = useState('3');
  adapterUpdates.set(framework, (nextConfig) => { flushSync(() => setConfig(nextConfig)); });
  adapterSelectionUpdates.set(framework, (nextValue) => { flushSync(() => setValue(nextValue)); });
  return React.createElement('section', { 'data-framework': framework },
    React.createElement('button', { id: `update-${framework}`, onClick: () => setConfig(partialConfig) }, `Update ${framework} config`),
    React.createElement('button', { id: `unmount-${framework}` }, `Unmount ${framework}`),
    React.createElement(Component, { items: fixtureItems, value, onChange: setValue, config }),
  );
}

for (const [framework, Component] of [['react', ReactSelect], ['react-native-web', ReactNativeWebSelect]] as const) {
  const root = document.createElement('div');
  const reactRoot = createRoot(root);
  reactRoot.render(React.createElement(ReactHarness, { Component, framework }));
  adapterMounts.set(framework, () => fixtures.append(root));
  adapterDisposers.set(framework, () => reactRoot.unmount());
}

const vueConfig = ref(initialConfig);
const vueValue = ref('3');
const vueApp = createApp(defineComponent({
  setup() {
    adapterUpdates.set('vue', async (nextConfig) => { vueConfig.value = nextConfig; await nextTick(); });
    adapterSelectionUpdates.set('vue', async (nextValue) => { vueValue.value = nextValue; await nextTick(); });
    return () => h('section', { 'data-framework': 'vue' }, [
      h('button', { id: 'update-vue', onClick: () => { vueConfig.value = partialConfig; } }, 'Update vue config'),
      h('button', { id: 'unmount-vue' }, 'Unmount vue'),
      h(VueSelect as any, { items: fixtureItems, modelValue: vueValue.value, 'onUpdate:modelValue': (nextValue: string) => { vueValue.value = nextValue; }, config: vueConfig.value }),
    ]);
  },
}));
const vueTarget = document.createElement('div');
vueApp.mount(vueTarget);
adapterMounts.set('vue', () => fixtures.append(vueTarget));
adapterDisposers.set('vue', () => vueApp.unmount());

const svelteTarget = document.createElement('div');
const svelteInstance = mountSvelte(SelectedOptionsSvelteHarness, { target: svelteTarget });
adapterUpdates.set('svelte', (nextConfig) => svelteInstance.setHarnessConfig(nextConfig));
adapterSelectionUpdates.set('svelte', (nextValue) => svelteInstance.setHarnessValue(nextValue));
adapterMounts.set('svelte', () => fixtures.append(svelteTarget));
adapterDisposers.set('svelte', () => { void unmountSvelte(svelteInstance); });

const solidSection = makeSection('solid', 'solid');
const solidMount = solidSection.querySelector<HTMLElement>('#mount-solid')!;
const [solidConfig, setSolidConfig] = createSignal(initialConfig);
const [solidValue, setSolidValue] = createSignal('3');
const disposeSolid = renderSolid(() => createComponent(SolidSelect, {
  items: fixtureItems,
  get value() { return solidValue(); },
  onChange: (nextValue: string) => setSolidValue(nextValue),
  get config() { return solidConfig(); },
}), solidMount);
adapterUpdates.set('solid', setSolidConfig);
adapterSelectionUpdates.set('solid', setSolidValue);
adapterDisposers.set('solid', disposeSolid);
adapterMounts.set('solid', () => fixtures.append(solidSection));
solidSection.querySelector('#update-solid')!.addEventListener('click', () => setSolidConfig(partialConfig));

const vanillaSection = makeSection('vanilla', 'vanilla');
const vanilla = createSelect({ items: fixtureItems, value: '3', config: initialConfig }) as HTMLElement & {
  open(): void;
  close(): void;
};
adapterUpdates.set('vanilla', (nextConfig) => updateVanillaConfig(vanilla, nextConfig));
adapterSelectionUpdates.set('vanilla', (nextValue) => vanilla.setSelectedValues([nextValue]));
adapterDisposers.set('vanilla', () => vanilla.remove());
vanilla.id = 'vanilla-select';
vanillaSection.querySelector('#mount-vanilla')!.append(vanilla);
adapterMounts.set('vanilla', () => fixtures.append(vanillaSection));
vanillaSection.querySelector('#update-vanilla')!.addEventListener('click', () => updateVanillaConfig(vanilla, partialConfig));

if (!customElements.get('enhanced-select')) customElements.define('enhanced-select', EnhancedSelect);
const coreSection = makeSection('web-component', 'web-component');
const core = document.createElement('enhanced-select') as any;
core.id = 'web-component-select';
core.setItems(fixtureItems);
core.setSelectedValues(['3']);
core.updateConfig(initialConfig);
coreSection.querySelector('#mount-web-component')!.append(core);
adapterMounts.set('web-component', () => fixtures.append(coreSection));
adapterUpdates.set('web-component', (nextConfig) => core.updateConfig(nextConfig));
adapterSelectionUpdates.set('web-component', (nextValue) => core.setSelectedValues([nextValue]));
adapterDisposers.set('web-component', () => core.remove());
coreSection.querySelector('#update-web-component')!.addEventListener('click', () => core.updateConfig(partialConfig));

if (!new URLSearchParams(location.search).has('detached')) {
  for (const mount of adapterMounts.values()) mount();
}

for (const framework of ['react', 'react-native-web', 'vue', 'svelte', 'solid', 'vanilla', 'web-component']) {
  fixtures.querySelector<HTMLElement>(`[data-framework="${framework}"]`)
    ?.querySelector(`#unmount-${framework}`)
    ?.addEventListener('click', () => adapterDisposers.get(framework)?.());
}

Object.assign(window, {
  __selectedOptionsFixtureReady: true,
  __selectedOptionsAdapterUpdates: adapterUpdates,
  __selectedOptionsAdapterSelectionUpdates: adapterSelectionUpdates,
  __selectedOptionsAdapterDisposers: adapterDisposers,
  __selectedOptionsAdapterMounts: adapterMounts,
});
