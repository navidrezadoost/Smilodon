/**
 * Contract interface that all framework adapters must implement
 * 
 * This ensures consistent API and behavior across React, Vue, Svelte, Angular, and Vanilla JS
 */

import type { SelectItem, GroupedItem } from './fixtures/test-data';

export interface ContractTestResult {
  success: boolean;
  error?: string;
  actualValue?: any;
  expectedValue?: any;
  timing?: number;
  pending?: boolean;
}

/**
 * Framework-agnostic select contract
 * 
 * Every framework implementation must pass all these tests
 */
export interface SelectContract {
  /**
   * Rendering Tests
   */
  rendersWithItems(): Promise<ContractTestResult>;
  rendersPlaceholder(): Promise<ContractTestResult>;
  rendersWithGroupedItems(): Promise<ContractTestResult>;
  rendersInDisabledState(): Promise<ContractTestResult>;
  rendersInErrorState(): Promise<ContractTestResult>;
  
  /**
   * Value Management Tests
   */
  setsInitialValue(): Promise<ContractTestResult>;
  updatesValueProgrammatically(): Promise<ContractTestResult>;
  getsCurrentValue(): Promise<ContractTestResult>;
  clearsValue(): Promise<ContractTestResult>;
  
  /**
   * Single Selection Tests
   */
  selectsSingleItemOnClick(): Promise<ContractTestResult>;
  emitsChangeEventOnSelection(): Promise<ContractTestResult>;
  displaysSelectedItem(): Promise<ContractTestResult>;
  
  /**
   * Multi-Selection Tests
   */
  enablesMultiSelectMode(): Promise<ContractTestResult>;
  selectsMultipleItems(): Promise<ContractTestResult>;
  deselectsItemInMultiMode(): Promise<ContractTestResult>;
  respectsMaxSelections(): Promise<ContractTestResult>;
  
  /**
   * Search Tests
   */
  enablesSearchMode(): Promise<ContractTestResult>;
  filtersItemsBySearchQuery(): Promise<ContractTestResult>;
  emitsSearchEvent(): Promise<ContractTestResult>;
  clearsSearchOnClose(): Promise<ContractTestResult>;
  
  /**
   * Keyboard Navigation Tests
   */
  opensDropdownWithEnter(): Promise<ContractTestResult>;
  opensDropdownWithSpace(): Promise<ContractTestResult>;
  opensDropdownWithArrowDown(): Promise<ContractTestResult>;
  closesDropdownWithEscape(): Promise<ContractTestResult>;
  navigatesWithArrowKeys(): Promise<ContractTestResult>;
  selectsWithEnterKey(): Promise<ContractTestResult>;
  jumpsToFirstWithHome(): Promise<ContractTestResult>;
  jumpsToLastWithEnd(): Promise<ContractTestResult>;
  
  /**
   * State Management Tests
   */
  preventsInteractionWhenDisabled(): Promise<ContractTestResult>;
  showsErrorStyling(): Promise<ContractTestResult>;
  showsRequiredIndicator(): Promise<ContractTestResult>;
  
  /**
   * Event Tests
   */
  emitsSelectEvent(): Promise<ContractTestResult>;
  emitsOpenEvent(): Promise<ContractTestResult>;
  emitsCloseEvent(): Promise<ContractTestResult>;
  emitsLoadMoreEvent(): Promise<ContractTestResult>;
  
  /**
   * Imperative API Tests (via ref/handle)
   */
  opensViaImperativeAPI(): Promise<ContractTestResult>;
  closesViaImperativeAPI(): Promise<ContractTestResult>;
  clearsViaImperativeAPI(): Promise<ContractTestResult>;
  focusesViaImperativeAPI(): Promise<ContractTestResult>;
  updatesItemsViaAPI(): Promise<ContractTestResult>;
  
  /**
   * Grouped Items Tests
   */
  rendersGroupHeaders(): Promise<ContractTestResult>;
  navigatesBetweenGroups(): Promise<ContractTestResult>;
  selectsFromDifferentGroups(): Promise<ContractTestResult>;
  
  /**
   * Dynamic Updates Tests
   */
  updatesItemsReactively(): Promise<ContractTestResult>;
  updatesValueReactively(): Promise<ContractTestResult>;
  updatesPropsReactively(): Promise<ContractTestResult>;
  
  /**
   * Accessibility Tests
   */
  hasCorrectAriaRoles(): Promise<ContractTestResult>;
  hasCorrectAriaAttributes(): Promise<ContractTestResult>;
  managesFocusCorrectly(): Promise<ContractTestResult>;
  announcesChangesToScreenReaders(): Promise<ContractTestResult>;
  
  /**
   * Performance Tests
   */
  rendersLargeDatasetEfficiently(): Promise<ContractTestResult>;
  handlesVirtualScrolling(): Promise<ContractTestResult>;
  handlesInfiniteScrolling(): Promise<ContractTestResult>;
  searchesLargeDatasetQuickly(): Promise<ContractTestResult>;
}

/**
 * Test runner configuration
 */
export interface ContractTestConfig {
  framework: 'react' | 'vue' | 'svelte' | 'angular' | 'vanilla';
  timeout?: number;
  retries?: number;
  skipTests?: string[];
  only?: string[];
}

/**
 * Test suite results
 */
export interface ContractTestSuite {
  framework: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: Map<string, ContractTestResult>;
}

/**
 * Comparison between frameworks
 */
export interface CrossFrameworkComparison {
  testName: string;
  frameworks: {
    react: ContractTestResult;
    vue: ContractTestResult;
    svelte: ContractTestResult;
    angular: ContractTestResult;
    vanilla: ContractTestResult;
  };
  consistent: boolean;
  discrepancies?: string[];
}

/**
 * Helper to run contract tests
 */
export abstract class ContractTestRunner implements SelectContract {
  protected config: ContractTestConfig;
  protected results: Map<string, ContractTestResult> = new Map();
  
  constructor(config: ContractTestConfig) {
    this.config = config;
  }
  
  /**
   * Run all contract tests
   */
  async runAll(): Promise<ContractTestSuite> {
    const startTime = Date.now();
    const tests = this.getAllTests();
    
    for (const [name, testFn] of tests) {
      if (this.shouldSkip(name)) {
        this.results.set(name, { success: true, pending: true, error: 'Skipped' });
        continue;
      }
      
      try {
        const result = await testFn.call(this);
        if (!result) {
          this.results.set(name, { success: true, pending: true, error: 'Not implemented' });
          continue;
        }

        this.results.set(name, result);
      } catch (error) {
        this.results.set(name, {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    
    const duration = Date.now() - startTime;
    const resultValues = Array.from(this.results.values());
    const passed = resultValues.filter(r => r.success && !r.pending).length;
    const failed = resultValues.filter(r => !r.success).length;
    const skipped = resultValues.filter(r => r.pending).length;
    
    return {
      framework: this.config.framework,
      totalTests: tests.size,
      passed,
      failed,
      skipped,
      duration,
      results: this.results,
    };
  }
  
  /**
   * Get all test methods
   */
  private getAllTests(): Map<string, () => Promise<ContractTestResult>> {
    const tests = new Map<string, () => Promise<ContractTestResult>>();
    const prototype = Object.getPrototypeOf(this);
    const methods = Object.getOwnPropertyNames(prototype);
    
    for (const method of methods) {
      if (method === 'constructor' || method === 'runAll' || method.startsWith('_')) {
        continue;
      }
      
      const descriptor = Object.getOwnPropertyDescriptor(prototype, method);
      if (descriptor && typeof descriptor.value === 'function') {
        tests.set(method, descriptor.value);
      }
    }
    
    return tests;
  }
  
  /**
   * Check if test should be skipped
   */
  private shouldSkip(testName: string): boolean {
    if (this.config.only && this.config.only.length > 0) {
      return !this.config.only.includes(testName);
    }
    
    if (this.config.skipTests && this.config.skipTests.includes(testName)) {
      return true;
    }
    
    return false;
  }
  
  // Abstract methods that must be implemented by each framework
  abstract rendersWithItems(): Promise<ContractTestResult>;
  abstract rendersPlaceholder(): Promise<ContractTestResult>;
  abstract rendersWithGroupedItems(): Promise<ContractTestResult>;
  abstract rendersInDisabledState(): Promise<ContractTestResult>;
  abstract rendersInErrorState(): Promise<ContractTestResult>;
  abstract setsInitialValue(): Promise<ContractTestResult>;
  abstract updatesValueProgrammatically(): Promise<ContractTestResult>;
  abstract getsCurrentValue(): Promise<ContractTestResult>;
  abstract clearsValue(): Promise<ContractTestResult>;
  abstract selectsSingleItemOnClick(): Promise<ContractTestResult>;
  abstract emitsChangeEventOnSelection(): Promise<ContractTestResult>;
  abstract displaysSelectedItem(): Promise<ContractTestResult>;
  abstract enablesMultiSelectMode(): Promise<ContractTestResult>;
  abstract selectsMultipleItems(): Promise<ContractTestResult>;
  abstract deselectsItemInMultiMode(): Promise<ContractTestResult>;
  abstract respectsMaxSelections(): Promise<ContractTestResult>;
  abstract enablesSearchMode(): Promise<ContractTestResult>;
  abstract filtersItemsBySearchQuery(): Promise<ContractTestResult>;
  abstract emitsSearchEvent(): Promise<ContractTestResult>;
  abstract clearsSearchOnClose(): Promise<ContractTestResult>;
  abstract opensDropdownWithEnter(): Promise<ContractTestResult>;
  abstract opensDropdownWithSpace(): Promise<ContractTestResult>;
  abstract opensDropdownWithArrowDown(): Promise<ContractTestResult>;
  abstract closesDropdownWithEscape(): Promise<ContractTestResult>;
  abstract navigatesWithArrowKeys(): Promise<ContractTestResult>;
  abstract selectsWithEnterKey(): Promise<ContractTestResult>;
  abstract jumpsToFirstWithHome(): Promise<ContractTestResult>;
  abstract jumpsToLastWithEnd(): Promise<ContractTestResult>;
  abstract preventsInteractionWhenDisabled(): Promise<ContractTestResult>;
  abstract showsErrorStyling(): Promise<ContractTestResult>;
  abstract showsRequiredIndicator(): Promise<ContractTestResult>;
  abstract emitsSelectEvent(): Promise<ContractTestResult>;
  abstract emitsOpenEvent(): Promise<ContractTestResult>;
  abstract emitsCloseEvent(): Promise<ContractTestResult>;
  abstract emitsLoadMoreEvent(): Promise<ContractTestResult>;
  abstract opensViaImperativeAPI(): Promise<ContractTestResult>;
  abstract closesViaImperativeAPI(): Promise<ContractTestResult>;
  abstract clearsViaImperativeAPI(): Promise<ContractTestResult>;
  abstract focusesViaImperativeAPI(): Promise<ContractTestResult>;
  abstract updatesItemsViaAPI(): Promise<ContractTestResult>;
  abstract rendersGroupHeaders(): Promise<ContractTestResult>;
  abstract navigatesBetweenGroups(): Promise<ContractTestResult>;
  abstract selectsFromDifferentGroups(): Promise<ContractTestResult>;
  abstract updatesItemsReactively(): Promise<ContractTestResult>;
  abstract updatesValueReactively(): Promise<ContractTestResult>;
  abstract updatesPropsReactively(): Promise<ContractTestResult>;
  abstract hasCorrectAriaRoles(): Promise<ContractTestResult>;
  abstract hasCorrectAriaAttributes(): Promise<ContractTestResult>;
  abstract managesFocusCorrectly(): Promise<ContractTestResult>;
  abstract announcesChangesToScreenReaders(): Promise<ContractTestResult>;
  abstract rendersLargeDatasetEfficiently(): Promise<ContractTestResult>;
  abstract handlesVirtualScrolling(): Promise<ContractTestResult>;
  abstract handlesInfiniteScrolling(): Promise<ContractTestResult>;
  abstract searchesLargeDatasetQuickly(): Promise<ContractTestResult>;
}
