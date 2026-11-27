import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@smilodon/core';
import { Select } from '@smilodon/react';

describe('React busy bucket slots', () => {
  it('projects React-owned icon and accessible content into Core slots without a second React root', async () => {
    const { container, unmount } = render(
      React.createElement(Select, {
        items: [],
        config: { busyBucket: { enabled: true, contentMode: 'replace', minDisplayTime: 0 } },
        arrowIcon: React.createElement('span', { 'data-testid': 'arrow-child' }, 'arrow'),
        loadingIcon: React.createElement('span', { 'data-testid': 'loading-icon-child' }, 'icon'),
        loadingContent: React.createElement('strong', { 'data-testid': 'loading-content-child' }, 'Loading another page'),
      }),
    );

    const host = container.querySelector('enhanced-select') as (HTMLElement & {
      _setBusy: (busy: boolean) => void;
    }) | null;
    expect(host).toBeTruthy();
    await waitFor(() => expect(host?.isConnected).toBe(true));

    act(() => host!._setBusy(true));

    const icon = host!.querySelector('[slot="loading-icon"]')!;
    const content = host!.querySelector('[slot="loading-content"]')!;
    const bucket = host!.shadowRoot!.querySelector('.busy-bucket')!;
    expect(host!.querySelector('[slot="arrow"] [data-testid="arrow-child"]')).toBeTruthy();
    expect(icon.querySelector('[data-testid="loading-icon-child"]')).toBeTruthy();
    expect(content.querySelector('[data-testid="loading-content-child"]')?.textContent)
      .toBe('Loading another page');
    expect(bucket.classList.contains('busy-bucket--replace')).toBe(true);
    expect(bucket.querySelector('[part="loading-message"]')?.textContent).toBe('Loading...');
    expect(bucket.querySelector<HTMLSlotElement>('slot[name="loading-icon"]')?.assignedNodes()).toContain(icon);
    expect(bucket.querySelector<HTMLSlotElement>('slot[name="loading-content"]')?.assignedNodes()).toContain(content);
    expect(host!.contains(icon)).toBe(true);
    expect(host!.contains(content)).toBe(true);

    unmount();
  });
});
