import type { RendererHelpers } from '../types';

export type OptionTemplate = (item: unknown, index: number) => string;
export type OptionRenderer = (item: unknown, index: number, helpers: RendererHelpers) => HTMLElement;

export const createRendererHelpers = (onSelect: (item: unknown, index: number) => void): RendererHelpers => ({
  onSelect,
  getIndex: (node: Element | null) => {
    const el = node?.closest?.('[data-selectable]') as HTMLElement | null;
    if (!el) return null;
    const idx = Number(el.dataset.index);
    return Number.isFinite(idx) ? idx : null;
  },
  keyboardFocus: (index: number) => {
    const el = document.querySelector(`[data-selectable][data-index="${index}"]`) as HTMLElement | null;
    el?.focus?.();
  }
});

// Fast template render path: string -> DOM via DocumentFragment, with delegation markers
export function renderTemplate(container: HTMLElement, items: unknown[], optionTemplate: OptionTemplate) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const wrapper = document.createElement('div');
    wrapper.innerHTML = optionTemplate(item, i);
    let el = wrapper.firstElementChild as HTMLElement | null;
    if (!el) {
      // Edge case: template produced multiple or zero root nodes; wrap children
      const wrap = document.createElement('div');
      wrap.setAttribute('data-selectable', '');
      wrap.setAttribute('data-index', String(i));
      while (wrapper.firstChild) wrap.appendChild(wrapper.firstChild);
      frag.appendChild(wrap);
      continue;
    }
    // Allow override if developer sets data-smilodon-handled="true"
    if (!el.hasAttribute('data-smilodon-handled')) {
      el.setAttribute('data-selectable', '');
      el.setAttribute('data-index', String(i));
    }
    frag.appendChild(el);
  }
  container.replaceChildren(frag);
}
