import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

describe('Dropdown exit animation lifecycle', () => {
  let select: EnhancedSelect;
  let dropdown: HTMLElement;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
    select.setItems([
      { value: 'one', label: 'One' },
      { value: 'two', label: 'Two' },
    ]);
    dropdown = select.shadowRoot!.querySelector<HTMLElement>('.select-dropdown')!;
    // jsdom has no native CSS animation timeline; control duration explicitly.
    vi.spyOn(select as any, '_getDropdownExitDurationMs').mockReturnValue(180);
  });

  afterEach(() => {
    select.remove();
    vi.restoreAllMocks();
  });

  it('closes logical popup and ARIA immediately but retains a noninteractive visual exit', () => {
    const closed = vi.fn();
    select.addEventListener('close', closed);
    select.open();
    expect(select.hasAttribute('data-open')).toBe(true);

    select.close();
    expect(closed).toHaveBeenCalledTimes(1);
    expect(select.hasAttribute('data-open')).toBe(false);
    expect(dropdown.style.display).toBe('block');
    expect(dropdown.getAttribute('data-motion')).toBe('closing');
    expect(dropdown.hasAttribute('inert')).toBe(true);
    expect(dropdown.getAttribute('aria-hidden')).toBe('true');
    expect(select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!.getAttribute('aria-expanded')).toBe('false');

    dropdown.dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(dropdown.style.display).toBe('none');
    expect(dropdown.hasAttribute('data-motion')).toBe(false);
  });

  it('cancels a pending exit when reopened before animationend', () => {
    select.open();
    select.close();
    select.open();
    expect(dropdown.style.display).toBe('block');
    expect(dropdown.hasAttribute('data-motion')).toBe(false);
    expect(dropdown.hasAttribute('inert')).toBe(false);
    expect(dropdown.hasAttribute('aria-hidden')).toBe(false);
    dropdown.dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(dropdown.style.display).toBe('block');
    expect(select.hasAttribute('data-open')).toBe(true);
  });

  it('ignores animationend from descendants until the dropdown itself finishes', () => {
    select.open();
    select.close();
    const child = document.createElement('div');
    dropdown.appendChild(child);
    child.dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(dropdown.style.display).toBe('block');
    dropdown.dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(dropdown.style.display).toBe('none');
    child.remove();
  });

  it('hides immediately if the configured animation has zero duration', () => {
    vi.spyOn(select as any, '_getDropdownExitDurationMs').mockReturnValue(0);
    select.open();
    select.close();
    expect(dropdown.style.display).toBe('none');
    expect(dropdown.hasAttribute('data-motion')).toBe(false);
    expect(dropdown.hasAttribute('inert')).toBe(true);
  });

  it('does not leave a visible exit when the host disconnects', () => {
    select.open();
    select.close();
    select.remove();
    expect(dropdown.style.display).toBe('none');
    expect(dropdown.hasAttribute('data-motion')).toBe(false);
  });

  it('finishes when animationend is not delivered', async () => {
    vi.spyOn(select as any, '_getDropdownExitDurationMs').mockReturnValue(10);
    select.open();
    select.close();
    expect(dropdown.style.display).toBe('block');
    await vi.waitFor(() => expect(dropdown.style.display).toBe('none'), { timeout: 500 });
  });

  it('does not replay close events when close is called repeatedly during exit', () => {
    const closed = vi.fn();
    select.addEventListener('close', closed);
    select.open();
    select.close();
    select.close();
    expect(closed).toHaveBeenCalledTimes(1);
    expect(dropdown.getAttribute('data-motion')).toBe('closing');
  });

  it('uses the public CSS entry/exit customization hooks', () => {
    const stylesheet = Array.from(select.shadowRoot!.querySelectorAll('style'))
      .map((element) => element.textContent ?? '').join('\n');
    expect(stylesheet).toContain('--select-dropdown-exit-animation');
    expect(stylesheet).toContain('--select-dropdown-exit-to-transform');
    expect(stylesheet).toContain('--select-dropdown-top-exit-to-transform');
    expect(stylesheet).toContain('@keyframes dropdownExit');
    expect(stylesheet).toContain('prefers-reduced-motion: reduce');
  });
});
