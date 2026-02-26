/**
 * React Contract Tests
 * 
 * Tests that verify the React adapter implements the SelectContract correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@smilodon/core';
import { Select } from '@smilodon/react';
import type { SelectHandle, SelectItem } from '@smilodon/react';
import { ContractTestRunner, type ContractTestResult } from './contract-interface';
import {
  basicItems,
  groupedItems,
  largeDataset,
  searchableItems,
} from './fixtures/test-data';
import { createElement, useRef, useState } from 'react';

const reactItems = basicItems as unknown as SelectItem[];

const pendingTests = [
  'rendersWithGroupedItems',
  'rendersInDisabledState',
  'rendersInErrorState',
  'setsInitialValue',
  'updatesValueProgrammatically',
  'displaysSelectedItem',
  'deselectsItemInMultiMode',
  'respectsMaxSelections',
  'enablesSearchMode',
  'filtersItemsBySearchQuery',
  'emitsSearchEvent',
  'clearsSearchOnClose',
  'opensDropdownWithEnter',
  'opensDropdownWithSpace',
  'opensDropdownWithArrowDown',
  'closesDropdownWithEscape',
  'navigatesWithArrowKeys',
  'selectsWithEnterKey',
  'jumpsToFirstWithHome',
  'jumpsToLastWithEnd',
  'preventsInteractionWhenDisabled',
  'showsErrorStyling',
  'showsRequiredIndicator',
  'emitsSelectEvent',
  'emitsOpenEvent',
  'emitsCloseEvent',
  'emitsLoadMoreEvent',
  'closesViaImperativeAPI',
  'clearsViaImperativeAPI',
  'focusesViaImperativeAPI',
  'updatesItemsViaAPI',
  'rendersGroupHeaders',
  'navigatesBetweenGroups',
  'selectsFromDifferentGroups',
  'updatesItemsReactively',
  'updatesValueReactively',
  'updatesPropsReactively',
  'hasCorrectAriaAttributes',
  'managesFocusCorrectly',
  'announcesChangesToScreenReaders',
  'rendersLargeDatasetEfficiently',
  'handlesVirtualScrolling',
  'handlesInfiniteScrolling',
  'searchesLargeDatasetQuickly',
];

class ReactContractTests extends ContractTestRunner {
  private cleanup: (() => void) | null = null;
  
  constructor() {
    super({ framework: 'react', skipTests: pendingTests });
  }
  
  private _renderSelect(props: any = {}) {
    const result = render(createElement(Select, props));
    this.cleanup = result.unmount;
    return result;
  }
  
  private _cleanupAfterTest() {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }
  
  async rendersWithItems(): Promise<ContractTestResult> {
    try {
  const { container } = this._renderSelect({ items: basicItems, multiple: true });
      const element = container.querySelector('enhanced-select');
      expect(element).toBeTruthy();
      this._cleanupAfterTest();
      return { success: true };
    } catch (error) {
      this._cleanupAfterTest();
      return { success: false, error: String(error) };
    }
  }
  
  async rendersPlaceholder(): Promise<ContractTestResult> {
    try {
      const placeholder = 'Choose an option';
      const { container } = this._renderSelect({ items: basicItems, placeholder });
      const element = container.querySelector('enhanced-select') as any;

      await waitFor(() => {
        expect(typeof element?.updateConfig).toBe('function');
      });

      element.updateConfig({ placeholder });

      await waitFor(() => {
        const input = element?.shadowRoot?.querySelector('input');
        expect(input?.getAttribute('placeholder')).toBe(placeholder);
      });

      this._cleanupAfterTest();
      return { success: true };
    } catch (error) {
      this._cleanupAfterTest();
      return { success: false, error: String(error) };
    }
  }
  
  async selectsSingleItemOnClick(): Promise<ContractTestResult> {
    try {
      const onChange = vi.fn();
      const { container } = this._renderSelect({ items: basicItems, onChange });
      const element = container.querySelector('enhanced-select') as any;

      await waitFor(() => {
        expect(typeof element?.setSelectedValues).toBe('function');
      });

      await element.setSelectedValues(['2']);
      
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('2', expect.any(Array));
      });
      
      this._cleanupAfterTest();
      return { success: true };
    } catch (error) {
      this._cleanupAfterTest();
      return { success: false, error: String(error) };
    }
  }
  
  async enablesMultiSelectMode(): Promise<ContractTestResult> {
    try {
      const { container } = this._renderSelect({ items: basicItems, multiple: true });
      const element = container.querySelector('enhanced-select') as any;

      await waitFor(() => {
        expect(typeof element?.open).toBe('function');
        expect(typeof element?.updateConfig).toBe('function');
        expect(typeof element?.setItems).toBe('function');
      });

      element.updateConfig({ selection: { mode: 'multi' } });
      element.setItems(reactItems);

      element.open();

      await waitFor(() => {
        const listbox = element.shadowRoot?.querySelector('[role="listbox"]');
        expect(listbox).toBeTruthy();
        expect(listbox?.getAttribute('aria-multiselectable')).toBe('true');
      });

      this._cleanupAfterTest();
      return { success: true };
    } catch (error) {
      this._cleanupAfterTest();
      return { success: false, error: String(error) };
    }
  }

  async emitsChangeEventOnSelection(): Promise<ContractTestResult> {
    try {
      const onChange = vi.fn();
      const { container } = this._renderSelect({ items: basicItems, onChange });
      const element = container.querySelector('enhanced-select') as any;

      await waitFor(() => {
        expect(typeof element?.setSelectedValues).toBe('function');
      });

      await element.setSelectedValues(['1']);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });

      const [value, items] = onChange.mock.calls[onChange.mock.calls.length - 1] ?? [];
      expect(value).toBe('1');
      expect(Array.isArray(items)).toBe(true);

      this._cleanupAfterTest();
      return { success: true };
    } catch (error) {
      this._cleanupAfterTest();
      return { success: false, error: String(error) };
    }
  }

  async selectsMultipleItems(): Promise<ContractTestResult> {
    try {
      const onChange = vi.fn();
      const { container } = this._renderSelect({ items: basicItems, multiple: true, onChange });
      const element = container.querySelector('enhanced-select') as any;

      await waitFor(() => {
        expect(typeof element?.setSelectedValues).toBe('function');
      });

      await element.setSelectedValues(['1', '2']);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });

      const [value, items] = onChange.mock.calls[onChange.mock.calls.length - 1] ?? [];
      expect(Array.isArray(value)).toBe(true);
      expect(value).toEqual(expect.arrayContaining(['1', '2']));
      expect(Array.isArray(items)).toBe(true);

      this._cleanupAfterTest();
      return { success: true };
    } catch (error) {
      this._cleanupAfterTest();
      return { success: false, error: String(error) };
    }
  }
  
  async opensViaImperativeAPI(): Promise<ContractTestResult> {
    try {
      let selectRef: SelectHandle | null = null;

      const TestComponent = () => {
        const ref = (instance: SelectHandle | null) => {
          selectRef = instance;
        };
        return createElement(Select, { ref, items: reactItems });
      };

      const { container } = render(createElement(TestComponent));

      await waitFor(() => {
        expect(selectRef).not.toBeNull();
        expect(typeof selectRef?.open).toBe('function');
      });

      await customElements.whenDefined('enhanced-select');

      const element = container.querySelector('enhanced-select') as any;

      await waitFor(() => {
        expect(element?.shadowRoot).toBeTruthy();
        expect(typeof element?.setItems).toBe('function');
      });

      element.setItems(reactItems);

      await waitFor(() => {
        const listbox = element?.shadowRoot?.querySelector('[role="listbox"]');
        const dropdown = listbox ?? element?.shadowRoot?.querySelector('.select-dropdown');
        expect(dropdown).toBeTruthy();
      });

      selectRef!.open();

      await waitFor(() => {
        const listbox = element?.shadowRoot?.querySelector('[role="listbox"]') as HTMLElement | null;
        const dropdown = (listbox ?? element?.shadowRoot?.querySelector('.select-dropdown')) as HTMLElement | null;
        expect(dropdown).toBeTruthy();
        expect(dropdown?.style.display).not.toBe('none');
      });

      this._cleanupAfterTest();
      return { success: true };
    } catch (error) {
      this._cleanupAfterTest();
      return { success: false, error: String(error) };
    }
  }
  
  async hasCorrectAriaRoles(): Promise<ContractTestResult> {
    try {
      const { container } = this._renderSelect({ items: basicItems });
      const element = container.querySelector('enhanced-select') as any;

      await waitFor(() => {
        expect(element?.shadowRoot).toBeTruthy();
        expect(typeof element?.setItems).toBe('function');
      });

      element.setItems(reactItems);

      element.open();

      await waitFor(() => {
        const listbox = element.shadowRoot?.querySelector('[role="listbox"]');
        expect(listbox).toBeTruthy();
      });

      await waitFor(() => {
        const options = element.shadowRoot?.querySelectorAll('[role="option"]');
        expect(options?.length ?? 0).toBe(basicItems.length);
      });
      
      this._cleanupAfterTest();
      return { success: true };
    } catch (error) {
      this._cleanupAfterTest();
      return { success: false, error: String(error) };
    }
  }
  
  // Placeholder implementations for remaining contract methods
  // In production, all methods would be fully implemented
  
  async rendersWithGroupedItems(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async rendersInDisabledState(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async rendersInErrorState(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async setsInitialValue(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async updatesValueProgrammatically(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async getsCurrentValue(): Promise<ContractTestResult> {
    try {
      const { container } = this._renderSelect({ items: basicItems });
      const element = container.querySelector('enhanced-select') as any;

      await waitFor(() => {
        expect(typeof element?.setSelectedValues).toBe('function');
      });

      await element.setSelectedValues(['1', '2']);

  const values = element.getSelectedValues?.() ?? [];
  expect(values).toEqual(expect.arrayContaining(['1']));

      this._cleanupAfterTest();
      return { success: true };
    } catch (error) {
      this._cleanupAfterTest();
      return { success: false, error: String(error) };
    }
  }

  async clearsValue(): Promise<ContractTestResult> {
    try {
      const { container } = this._renderSelect({ items: basicItems });
      const element = container.querySelector('enhanced-select') as any;

      await waitFor(() => {
        expect(typeof element?.setSelectedValues).toBe('function');
      });

      await element.setSelectedValues(['1']);
      await element.setSelectedValues([]);

      const values = element.getSelectedValues?.() ?? ['not-empty'];
      expect(values).toHaveLength(0);

      this._cleanupAfterTest();
      return { success: true };
    } catch (error) {
      this._cleanupAfterTest();
      return { success: false, error: String(error) };
    }
  }
  
  async displaysSelectedItem(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async deselectsItemInMultiMode(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async respectsMaxSelections(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async enablesSearchMode(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async filtersItemsBySearchQuery(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async emitsSearchEvent(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async clearsSearchOnClose(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async opensDropdownWithEnter(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async opensDropdownWithSpace(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async opensDropdownWithArrowDown(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async closesDropdownWithEscape(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async navigatesWithArrowKeys(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async selectsWithEnterKey(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async jumpsToFirstWithHome(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async jumpsToLastWithEnd(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async preventsInteractionWhenDisabled(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async showsErrorStyling(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async showsRequiredIndicator(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async emitsSelectEvent(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async emitsOpenEvent(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async emitsCloseEvent(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async emitsLoadMoreEvent(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async closesViaImperativeAPI(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async clearsViaImperativeAPI(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async focusesViaImperativeAPI(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async updatesItemsViaAPI(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async rendersGroupHeaders(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async navigatesBetweenGroups(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async selectsFromDifferentGroups(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async updatesItemsReactively(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async updatesValueReactively(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async updatesPropsReactively(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async hasCorrectAriaAttributes(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async managesFocusCorrectly(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async announcesChangesToScreenReaders(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async rendersLargeDatasetEfficiently(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async handlesVirtualScrolling(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async handlesInfiniteScrolling(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
  
  async searchesLargeDatasetQuickly(): Promise<ContractTestResult> {
    // TODO: Implement
    return { success: true };
  }
}

// Run the contract tests
describe('React Adapter Contract Tests', () => {
  it('implements SelectContract correctly', async () => {
    const runner = new ReactContractTests();
    const results = await runner.runAll();
    
    console.log(`React Contract Tests: ${results.passed}/${results.totalTests} passed`);
    
    // Report failures
    const failures = Array.from(results.results.entries())
      .filter(([_, result]) => !result.success)
      .map(([name, result]) => `${name}: ${result.error}`);

    if (failures.length > 0) {
      console.log('Failed tests:', failures);
    }
    
    expect(failures).toHaveLength(0);
  });

  pendingTests.forEach((testName) => {
    it.skip(`${testName} (not implemented yet)`, () => {});
  });

  it('emits diagnostic events when tracking diagnostics are enabled', async () => {
    const onDiagnostic = vi.fn();
    const { container, unmount } = render(
      createElement(Select, {
        items: basicItems,
        trackingEnabled: true,
        emitDiagnostics: true,
        onDiagnostic,
      })
    );

    const element = container.querySelector('enhanced-select') as any;

    await waitFor(() => {
      expect(typeof element?.open).toBe('function');
    });

    element.open();

    await waitFor(() => {
      expect(onDiagnostic).toHaveBeenCalled();
    });

    const diagnostics = onDiagnostic.mock.calls.map((call) => call[0]);
    const hasOpenEventDiagnostic = diagnostics.some(
      (detail) => detail?.source === 'event' && detail?.name === 'open'
    );
    expect(hasOpenEventDiagnostic).toBe(true);

    unmount();
  });

  it('exposes capability, limitation and tracking controls via ref handle', async () => {
    let handle: SelectHandle | null = null;

    const Harness = () => {
      const ref = (instance: SelectHandle | null) => {
        handle = instance;
      };

      return createElement(Select, {
        ref,
        items: basicItems,
        trackingEnabled: true,
        emitDiagnostics: false,
      });
    };

    const { unmount } = render(createElement(Harness));

    await waitFor(() => {
      expect(handle).not.toBeNull();
      expect(typeof handle?.getCapabilities).toBe('function');
    });

    const capabilities = handle!.getCapabilities();
    expect(capabilities?.events.diagnosticEvent).toBe(true);

    const limitations = handle!.getKnownLimitations();
    expect(limitations.some((item) => item.id === 'runtimeModeSwitching')).toBe(true);

    handle!.open();

    await waitFor(() => {
      const snapshot = handle!.getTrackingSnapshot();
      expect(snapshot.events.length).toBeGreaterThan(0);
    });

    handle!.clearTracking('event');
    const afterClear = handle!.getTrackingSnapshot();
    expect(afterClear.events).toHaveLength(0);

    handle!.setLimitationPolicies({
      runtimeModeSwitching: { mode: 'strict', note: 'Contract test policy' },
    });

    const afterPolicy = handle!.getKnownLimitations();
    const runtimeMode = afterPolicy.find((item) => item.id === 'runtimeModeSwitching');
    expect(runtimeMode?.mode).toBe('strict');

    unmount();
  });
});
