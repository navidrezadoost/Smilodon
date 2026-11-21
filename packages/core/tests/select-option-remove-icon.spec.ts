import { afterEach, describe, expect, it, vi } from 'vitest';
import { SelectOption } from '../src/components/select-option.js';

describe('selected-option remove button event delegation (#97)', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('removes on icon descendant click without selecting or multiplying listeners on re-render', () => {
    const option = new SelectOption({
      item: { value: 'one', label: 'One' },
      index: 0,
      selected: true,
      showRemoveButton: true,
      removeButtonIcon: '<svg><path d="M1 1L3 3" /></svg>',
    });
    const onRemove = vi.fn();
    const onSelect = vi.fn();
    option.addEventListener('optionRemove', onRemove);
    option.addEventListener('optionSelect', onSelect);
    document.body.appendChild(option);
    option.ensureRendered();

    const clickRemovePath = () => {
      const path = option.shadowRoot!.querySelector('[part="chip-remove-icon"] path');
      expect(path).toBeTruthy();
      path!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    };
    clickRemovePath();
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();

    option.updateConfig({ selected: true });
    option.setActive(true);
    clickRemovePath();
    expect(onRemove).toHaveBeenCalledTimes(2);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
