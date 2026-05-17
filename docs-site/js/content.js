/**
 * Documentation Content Module
 * Contains all documentation content for each page
 */

const documentationContent = {
  home: `
    <div class="doc-hero">
      <h1>Welcome to Smilodon</h1>
      <p class="lead">High-performance select components for modern web frameworks</p>
    </div>
    
    <div class="doc-section">
      <h2>What is Smilodon?</h2>
      <p>Smilodon is a shared select runtime built around the <code>enhanced-select</code> custom element and wrapped by framework-specific adapters. The goal is simple:</p>
      <ul>
        <li>One behavior model</li>
        <li>One styling model</li>
        <li>One diagnostics model</li>
        <li>One performance story across every supported platform</li>
      </ul>
    </div>
    
    <div class="doc-grid">
      <div class="feature-card">
        <h3>🚀 Performance First</h3>
        <p>Virtualized rendering handles datasets from 100 to 1,000,000+ items with consistent 60 FPS scrolling.</p>
      </div>
      <div class="feature-card">
        <h3>♿ Accessible</h3>
        <p>WCAG 2.1 Level AA compliant with full keyboard navigation and screen reader support.</p>
      </div>
      <div class="feature-card">
        <h3>🎨 Customizable</h3>
        <p>Extensive CSS custom properties, shadow parts, and styling tokens for complete visual control.</p>
      </div>
      <div class="feature-card">
        <h3>🔧 Framework Agnostic</h3>
        <p>Works with React, Vue, Svelte, SolidJS, Vanilla JS, and React Native.</p>
      </div>
    </div>
  `,
  
  introduction: `
    <h1>Introduction</h1>
    
    <div class="doc-section">
      <h2>What Smilodon Provides</h2>
      
      <h3>Functional Support</h3>
      <ul>
        <li><strong>Selection Modes:</strong> Single-select and multi-select with chip rendering</li>
        <li><strong>Search:</strong> Local and remote search with debouncing</li>
        <li><strong>Grouping:</strong> Organized options with group headers</li>
        <li><strong>Infinite Scroll:</strong> Load-more flows for large datasets</li>
        <li><strong>Virtualization:</strong> Efficient rendering of massive lists</li>
        <li><strong>Custom Rendering:</strong> Full control over option appearance</li>
        <li><strong>Accessibility:</strong> ARIA listbox semantics and keyboard navigation</li>
        <li><strong>Diagnostics:</strong> Runtime performance and capability reporting</li>
      </ul>
      
      <h3>Engineering Support</h3>
      <ul>
        <li>Shared Web Component runtime in <code>@smilodon/core</code></li>
        <li>Thin adapters for all major frameworks</li>
        <li>Consistent event model across platforms</li>
        <li>Shared CSS token surface and shadow parts</li>
        <li>Programmatic APIs for runtime control</li>
        <li>Monorepo with aligned versions</li>
      </ul>
    </div>
    
    <div class="doc-section">
      <h2>Supported Platforms</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Package</th>
            <th>Target</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>@smilodon/core</code></td>
            <td>Base custom element runtime</td>
            <td><span class="badge-success">Primary</span></td>
          </tr>
          <tr>
            <td><code>@smilodon/react</code></td>
            <td>React, Next.js</td>
            <td><span class="badge-success">Maintained</span></td>
          </tr>
          <tr>
            <td><code>@smilodon/vue</code></td>
            <td>Vue 3, Nuxt</td>
            <td><span class="badge-success">Maintained</span></td>
          </tr>
          <tr>
            <td><code>@smilodon/svelte</code></td>
            <td>Svelte, SvelteKit</td>
            <td><span class="badge-success">Maintained</span></td>
          </tr>
          <tr>
            <td><code>@smilodon/solid</code></td>
            <td>SolidJS</td>
            <td><span class="badge-success">Maintained</span></td>
          </tr>
          <tr>
            <td><code>@smilodon/vanilla</code></td>
            <td>Vanilla JS/TS</td>
            <td><span class="badge-success">Maintained</span></td>
          </tr>
          <tr>
            <td><code>@smilodon/react-native</code></td>
            <td>React Native</td>
            <td><span class="badge-success">Maintained</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  
  installation: `
    <h1>Installation</h1>
    
    <div class="doc-section">
      <h2>Choose Your Framework</h2>
      <p>Install the core package plus your framework adapter:</p>
      
      <h3>React</h3>
      <pre><code class="language-bash">npm install @smilodon/core @smilodon/react</code></pre>
      
      <h3>Vue 3</h3>
      <pre><code class="language-bash">npm install @smilodon/core @smilodon/vue</code></pre>
      
      <h3>Svelte</h3>
      <pre><code class="language-bash">npm install @smilodon/core @smilodon/svelte</code></pre>
      
      <h3>SolidJS</h3>
      <pre><code class="language-bash">npm install @smilodon/core @smilodon/solid</code></pre>
      
      <h3>Vanilla JavaScript</h3>
      <pre><code class="language-bash">npm install @smilodon/core @smilodon/vanilla</code></pre>
      
      <h3>React Native</h3>
      <pre><code class="language-bash">npm install @smilodon/core @smilodon/react-native</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>CDN Usage</h2>
      <p>For quick prototyping, you can use the CDN:</p>
      <pre><code class="language-html">&lt;script type="module"&gt;
  import { NativeSelect } from 'https://cdn.jsdelivr.net/npm/@smilodon/core@1.6.0/+esm';
&lt;/script&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>TypeScript Support</h2>
      <p>All packages include TypeScript definitions out of the box. No <code>@types</code> packages needed!</p>
    </div>
  `,
  
  'quick-start': `
    <h1>Quick Start</h1>
    
    <div class="doc-section">
      <h2>React Example</h2>
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react';

function App() {
  const items = [
    { id: 1, label: 'Apple' },
    { id: 2, label: 'Banana' },
    { id: 3, label: 'Cherry' }
  ];

  return (
    &lt;NativeSelect
      items={items}
      onSelect={({ indices, items }) => {
        console.log('Selected:', items[indices[0]]);
      }}
    /&gt;
  );
}</code></pre>
      <p class="doc-note">⏱️ Time to first render: ~2 minutes</p>
    </div>
    
    <div class="doc-section">
      <h2>Vue 3 Example</h2>
      <pre><code class="language-vue">&lt;template&gt;
  &lt;NativeSelect
    :items="items"
    @select="handleSelect"
  /&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { NativeSelect } from '@smilodon/vue';

const items = [
  { id: 1, label: 'Apple' },
  { id: 2, label: 'Banana' },
  { id: 3, label: 'Cherry' }
];

function handleSelect({ indices, items }) {
  console.log('Selected:', items[indices[0]]);
}
&lt;/script&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Svelte Example</h2>
      <pre><code class="language-svelte">&lt;script&gt;
  import { NativeSelect } from '@smilodon/svelte';
  
  const items = [
    { id: 1, label: 'Apple' },
    { id: 2, label: 'Banana' },
    { id: 3, label: 'Cherry' }
  ];
  
  function handleSelect(event) {
    console.log('Selected:', event.detail.items[0]);
  }
&lt;/script&gt;

&lt;NativeSelect
  {items}
  on:select={handleSelect}
/&gt;</code></pre>
    </div>
  `,
  
  concepts: `
    <h1>Fundamental Concepts</h1>
    
    <div class="doc-section">
      <h2>Architecture Overview</h2>
      <p>Smilodon is built on a three-layer architecture:</p>
      
      <ol>
        <li><strong>Core Runtime:</strong> The <code>enhanced-select</code> Web Component handles all interaction logic</li>
        <li><strong>Framework Adapters:</strong> Thin wrappers expose framework-specific APIs</li>
        <li><strong>Application Layer:</strong> Your code using the component</li>
      </ol>
    </div>
    
    <div class="doc-section">
      <h2>Selection Modes</h2>
      
      <h3>Single Select</h3>
      <p>Users can select one option at a time. Selecting a new option replaces the previous selection.</p>
      <pre><code class="language-tsx">&lt;NativeSelect mode="single" items={items} /&gt;</code></pre>
      
      <h3>Multi Select</h3>
      <p>Users can select multiple options. Selected items appear as chips/badges.</p>
      <pre><code class="language-tsx">&lt;NativeSelect mode="multi" items={items} /&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Data Flow</h2>
      <p>Smilodon follows a unidirectional data flow:</p>
      <ol>
        <li>Application provides items array</li>
        <li>User interacts with the select</li>
        <li>Component emits selection events</li>
        <li>Application updates state</li>
        <li>Component re-renders with new state</li>
      </ol>
    </div>
    
    <div class="doc-section">
      <h2>Virtualization</h2>
      <p>For large datasets, Smilodon only renders visible items plus a buffer. This keeps DOM size small and performance high.</p>
      <ul>
        <li>Automatic when dataset exceeds threshold (default: 100 items)</li>
        <li>Buffer size configurable</li>
        <li>Maintains 60 FPS scrolling</li>
      </ul>
    </div>
  `,
  
  architecture: `
    <h1>Architecture</h1>
    
    <div class="doc-section">
      <h2>System Design</h2>
      <p>Smilodon uses a shared runtime approach where one Web Component powers all framework adapters.</p>
      
      <div class="architecture-diagram">
        <pre>
┌─────────────────────────────────────────────┐
│         Application Layer                    │
│  (React, Vue, Svelte, SolidJS, etc.)        │
└────────────────┬────────────────────────────┘
                 │
┌────────────────┴────────────────────────────┐
│         Framework Adapters                   │
│  (@smilodon/react, @smilodon/vue, etc.)     │
└────────────────┬────────────────────────────┘
                 │
┌────────────────┴────────────────────────────┐
│         Core Runtime                         │
│  (@smilodon/core - enhanced-select)         │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │  Virtualizer                          │  │
│  ├──────────────────────────────────────┤  │
│  │  Selection Manager                    │  │
│  ├──────────────────────────────────────┤  │
│  │  Search Engine                        │  │
│  ├──────────────────────────────────────┤  │
│  │  Accessibility Layer                  │  │
│  ├──────────────────────────────────────┤  │
│  │  Event System                         │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
        </pre>
      </div>
    </div>
    
    <div class="doc-section">
      <h2>Core Components</h2>
      
      <h3>Virtualizer</h3>
      <p>Manages efficient rendering of large lists by only creating DOM nodes for visible items.</p>
      
      <h3>Selection Manager</h3>
      <p>Tracks selected indices, handles multi-select logic, and manages selection state.</p>
      
      <h3>Search Engine</h3>
      <p>Provides local filtering and remote search coordination with debouncing.</p>
      
      <h3>Accessibility Layer</h3>
      <p>Implements ARIA patterns, keyboard navigation, and screen reader announcements.</p>
      
      <h3>Event System</h3>
      <p>Unified event handling across all frameworks with consistent payloads.</p>
    </div>
  `,
  
  performance: `
    <h1>Performance</h1>
    
    <div class="doc-section">
      <h2>Performance Targets</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Dataset Size</th>
            <th>Render Target</th>
            <th>Memory Target</th>
            <th>Scroll Target</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>100 items</td>
            <td>&lt;10ms</td>
            <td>~2MB</td>
            <td>60 FPS</td>
          </tr>
          <tr>
            <td>1,000 items</td>
            <td>&lt;20ms</td>
            <td>~4MB</td>
            <td>60 FPS</td>
          </tr>
          <tr>
            <td>10,000 items</td>
            <td>&lt;30ms</td>
            <td>~8MB</td>
            <td>60 FPS</td>
          </tr>
          <tr>
            <td>100,000 items</td>
            <td>&lt;50ms</td>
            <td>~15MB</td>
            <td>60 FPS</td>
          </tr>
          <tr>
            <td>1,000,000 items</td>
            <td>&lt;100ms</td>
            <td>~30MB</td>
            <td>60 FPS</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Optimization Strategies</h2>
      
      <h3>Virtualization</h3>
      <p>Only renders visible items plus a buffer, dramatically reducing DOM size for large lists.</p>
      
      <h3>Debouncing</h3>
      <p>Search and filter operations are debounced to prevent excessive renders.</p>
      
      <h3>Memoization</h3>
      <p>Computed values are cached and only recalculated when dependencies change.</p>
      
      <h3>Web Workers</h3>
      <p>Heavy operations like sorting and filtering can be offloaded to worker threads.</p>
    </div>
    
    <div class="doc-section">
      <h2>Benchmarks</h2>
      <p>Run benchmarks locally:</p>
      <pre><code class="language-bash">npm run benchmark</code></pre>
    </div>
  `,
  
  'props-config': `
    <h1>Props & Configuration</h1>
    
    <div class="doc-section">
      <h2>Core Properties</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>items</code></td>
            <td><code>Array&lt;T&gt;</code></td>
            <td><code>[]</code></td>
            <td>Array of options to display. Required.</td>
          </tr>
          <tr>
            <td><code>mode</code></td>
            <td><code>'single' | 'multi'</code></td>
            <td><code>'single'</code></td>
            <td>Selection mode. Single allows one selection, multi allows multiple.</td>
          </tr>
          <tr>
            <td><code>selectedIndices</code></td>
            <td><code>number[]</code></td>
            <td><code>[]</code></td>
            <td>Array of selected item indices (controlled)</td>
          </tr>
          <tr>
            <td><code>placeholder</code></td>
            <td><code>string</code></td>
            <td><code>'Select...'</code></td>
            <td>Placeholder text when no selection</td>
          </tr>
          <tr>
            <td><code>disabled</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>Disable the entire select component</td>
          </tr>
          <tr>
            <td><code>clearable</code></td>
            <td><code>boolean</code></td>
            <td><code>true</code></td>
            <td>Show clear button to reset selection</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Search & Filtering</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>searchable</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>Enable search input in dropdown</td>
          </tr>
          <tr>
            <td><code>searchPlaceholder</code></td>
            <td><code>string</code></td>
            <td><code>'Search...'</code></td>
            <td>Search input placeholder</td>
          </tr>
          <tr>
            <td><code>searchDebounce</code></td>
            <td><code>number</code></td>
            <td><code>300</code></td>
            <td>Debounce delay for search (ms)</td>
          </tr>
          <tr>
            <td><code>minSearchLength</code></td>
            <td><code>number</code></td>
            <td><code>0</code></td>
            <td>Minimum characters before search triggers</td>
          </tr>
          <tr>
            <td><code>searchFilter</code></td>
            <td><code>Function</code></td>
            <td>Built-in</td>
            <td>Custom filter function (items, query) => items[]</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Virtualization & Performance</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>virtualized</code></td>
            <td><code>boolean</code></td>
            <td><code>auto</code></td>
            <td>Enable virtualization. Auto enables for >100 items</td>
          </tr>
          <tr>
            <td><code>estimatedItemHeight</code></td>
            <td><code>number</code></td>
            <td><code>48</code></td>
            <td>Estimated height of each item (px). Critical for performance!</td>
          </tr>
          <tr>
            <td><code>buffer</code></td>
            <td><code>number</code></td>
            <td><code>5</code></td>
            <td>Number of items to render outside viewport</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Grouping & Organization</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>grouped</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>Enable grouped mode with category headers</td>
          </tr>
          <tr>
            <td><code>groupBy</code></td>
            <td><code>string | Function</code></td>
            <td>-</td>
            <td>Property name or function to group by</td>
          </tr>
          <tr>
            <td><code>renderGroupHeader</code></td>
            <td><code>Function</code></td>
            <td>-</td>
            <td>Custom group header renderer</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Event Handlers</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Payload</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>onSelect</code></td>
            <td><code>{ indices, items, source }</code></td>
            <td>Selection changed. source: 'click' | 'keyboard' | 'api'</td>
          </tr>
          <tr>
            <td><code>onSearch</code></td>
            <td><code>{ query }</code></td>
            <td>Search input changed</td>
          </tr>
          <tr>
            <td><code>onOpen</code></td>
            <td><code>{}</code></td>
            <td>Dropdown opened</td>
          </tr>
          <tr>
            <td><code>onClose</code></td>
            <td><code>{}</code></td>
            <td>Dropdown closed</td>
          </tr>
          <tr>
            <td><code>onClear</code></td>
            <td><code>{}</code></td>
            <td>Selection cleared</td>
          </tr>
          <tr>
            <td><code>onLoadMore</code></td>
            <td><code>{}</code></td>
            <td>Scroll threshold reached (infinite scroll)</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Rendering & Customization</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>renderOption</code></td>
            <td><code>(item) => ReactNode | string</code></td>
            <td>Custom option renderer</td>
          </tr>
          <tr>
            <td><code>renderValue</code></td>
            <td><code>(item) => ReactNode | string</code></td>
            <td>Custom selected value renderer</td>
          </tr>
          <tr>
            <td><code>renderChip</code></td>
            <td><code>(item) => ReactNode | string</code></td>
            <td>Custom chip renderer (multi-select)</td>
          </tr>
          <tr>
            <td><code>optionTemplate</code></td>
            <td><code>(item) => string</code></td>
            <td>HTML string template for options (Vanilla JS)</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Complete Example</h2>
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react';

function FullyConfiguredSelect() {
  return (
    &lt;NativeSelect
      // Core
      items={items}
      selectedIndices={selected}
      mode="multi"
      placeholder="Choose items..."
      disabled={false}
      clearable={true}
      
      // Search
      searchable={true}
      searchPlaceholder="Filter..."
      searchDebounce={300}
      minSearchLength={2}
      
      // Virtualization
      virtualized={true}
      estimatedItemHeight={48}
      buffer={10}
      
      // Grouping
      grouped={true}
      groupBy="category"
      
      // Events
      onSelect={({ indices, items }) => console.log(items)}
      onSearch={({ query }) => console.log(query)}
      onOpen={() => console.log('opened')}
      onClose={() => console.log('closed')}
      
      // Custom Rendering
      renderOption={(item) => (
        &lt;div className="custom-option"&gt;{item.label}&lt;/div&gt;
      )}
    /&gt;
  );
}</code></pre>
    </div>
  `,
  
  'styling-guide': `
    <h1>Complete Styling Guide</h1>
    
    <div class="doc-note">
      <p>📚 This guide covers all styling methods, tokens, and framework integration patterns for Smilodon.</p>
    </div>

    <div class="doc-section">
      <h2>Styling Hierarchy (Recommended)</h2>
      <p>Use the right styling method for your needs:</p>
      
      <div class="doc-table-wrapper">
        <table class="doc-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Method</th>
              <th>When to Use</th>
              <th>Example</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>1</strong></td>
              <td><strong>CSS Variables</strong></td>
              <td>Overall organizational theme</td>
              <td><code>--select-primary: #3b82f6;</code></td>
            </tr>
            <tr>
              <td><strong>2</strong></td>
              <td><strong>::part() Selectors</strong></td>
              <td>Style key inner elements</td>
              <td><code>enhanced-select::part(input) { }</code></td>
            </tr>
            <tr>
              <td><strong>3</strong></td>
              <td><strong>classMap</strong></td>
              <td>Override states with utilities</td>
              <td><code>classMap: { selected: 'bg-blue-700' }</code></td>
            </tr>
            <tr>
              <td><strong>4</strong></td>
              <td><strong>[data-sm-state]</strong></td>
              <td>Strong fallback or complex selectors</td>
              <td><code>[data-sm-state~="selected"]</code></td>
            </tr>
            <tr>
              <td><strong>5</strong></td>
              <td><strong>Custom Renderers</strong></td>
              <td>Rich option content</td>
              <td><code>optionRenderer: (item) => ...</code></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="doc-section">
      <h2>1. CSS Custom Properties (Variables)</h2>
      <p>The fastest way to theme the entire component:</p>
      
      <h3>Core Theme Tokens</h3>
      <pre><code class="language-css">:root {
  /* Layout */
  --select-width: 100%;
  --select-height: auto;
  
  /* Colors */
  --select-primary: #1a1a2e;
  --select-primary-light: #16213e;
  --select-accent: #0f3460;
  --select-accent-hover: #e94560;
  --select-surface: #ffffff;
  --select-surface-elevated: #fafbfc;
  --select-border: #e1e5eb;
  --select-border-focus: #0f3460;
  --select-text: #1a1a2e;
  --select-text-muted: #6b7280;
  --select-text-placeholder: #9ca3af;
  
  /* Shadows */
  --select-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --select-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --select-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --select-shadow-focus: 0 0 0 3px rgba(15, 52, 96, 0.12);
  
  /* Border Radius */
  --select-radius-sm: 6px;
  --select-radius-md: 10px;
  --select-radius-lg: 14px;
  
  /* Transitions */
  --select-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --select-transition-smooth: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --select-transition-bounce: 350ms cubic-bezier(0.34, 1.56, 0.64, 1);
  
  /* Typography */
  --select-font-family: 'Inter', -apple-system, sans-serif;
}</code></pre>

      <h3>Input Shell Tokens</h3>
      <pre><code class="language-css">/* Input container styling */
--select-input-gap: 6px;
--select-input-padding: 10px 52px 10px 14px;
--select-input-padding-with-clear: 10px 84px 10px 14px;
--select-input-height: auto;
--select-input-min-height: 48px;
--select-input-max-height: 160px;
--select-input-bg: var(--select-surface);
--select-input-border: 1.5px solid var(--select-border);
--select-input-border-radius: var(--select-radius-md);
--select-input-hover-border: var(--select-border-focus);
--select-input-focus-border: var(--select-border-focus);

/* Text alignment */
--select-input-text-align: start;
--select-input-justify-content: flex-start;
--select-input-align-items: center;</code></pre>

      <h3>Badge/Chip Tokens (Multi-Select)</h3>
      <pre><code class="language-css">/* Badge appearance */
--select-badge-bg: linear-gradient(135deg, var(--select-accent), var(--select-primary-light));
--select-badge-color: #ffffff;
--select-badge-border: none;
--select-badge-border-radius: 999px;
--select-badge-padding: 4px 10px 4px 12px;
--select-badge-margin: 3px;
--select-badge-font-size: 13px;
--select-badge-font-weight: 500;
--select-badge-shadow: var(--select-shadow-sm);

/* Badge remove button */
--select-badge-remove-size: 18px;
--select-badge-remove-bg: rgba(255, 255, 255, 0.2);
--select-badge-remove-color: #ffffff;
--select-badge-remove-hover-bg: rgba(233, 69, 96, 0.9);
--select-badge-remove-hover-transform: scale(1.15) rotate(90deg);

/* Badge animations */
--select-badge-animation: badgeEnter 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
--select-badge-hover-transform: scale(1.02);</code></pre>

      <h3>Dropdown & Options Tokens</h3>
      <pre><code class="language-css">/* Dropdown panel */
--select-dropdown-bg: var(--select-surface);
--select-dropdown-border: 1px solid var(--select-border);
--select-dropdown-border-radius: var(--select-radius-md);
--select-dropdown-shadow: var(--select-shadow-lg);
--select-dropdown-max-height: 320px;
--select-dropdown-padding: 4px;

/* Option styling */
--select-option-padding: 10px 14px;
--select-option-min-height: 42px;
--select-option-border-radius: var(--select-radius-sm);
--select-option-font-size: 14px;
--select-option-font-weight: 400;
--select-option-color: var(--select-text);
--select-option-bg: transparent;

/* Option states */
--select-option-hover-bg: var(--select-surface-elevated);
--select-option-hover-color: var(--select-text);
--select-option-active-bg: rgba(15, 52, 96, 0.08);
--select-option-selected-bg: linear-gradient(135deg, #0f3460, #1a1a2e);
--select-option-selected-color: #ffffff;
--select-option-selected-indicator-color: #4ade80;

/* Option alignment */
--select-option-text-align: start;
--select-option-justify-content: flex-start;</code></pre>
    </div>

    <div class="doc-section">
      <h2>2. Shadow Parts Styling</h2>
      <p>Target internal elements using the <code>::part()</code> pseudo-element:</p>
      
      <pre><code class="language-css">/* Style the main trigger/button */
enhanced-select::part(button) {
  min-height: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid transparent;
}

/* Style the input field */
enhanced-select::part(input) {
  font-size: 1rem;
  padding: 0.75rem 1rem;
}

/* Style the dropdown panel */
enhanced-select::part(listbox) {
  border-radius: 1rem;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

/* Style individual options */
enhanced-select::part(option) {
  padding: 12px 16px;
  transition: all 200ms;
  font-weight: 500;
}

/* Style the clear button */
enhanced-select::part(clear-button) {
  color: #ef4444;
  opacity: 0.7;
  transition: opacity 200ms;
}

enhanced-select::part(clear-button):hover {
  opacity: 1;
}</code></pre>
    </div>

    <div class="doc-section">
      <h2>3. Class Mapping (classMap)</h2>
      <p>Override state classes with your framework's utility classes:</p>
      
      <h3>Vanilla JavaScript</h3>
      <pre><code class="language-javascript">const select = document.querySelector('enhanced-select');

select.classMap = {
  selected: 'bg-blue-600 text-white font-semibold ring-2 ring-blue-300',
  active: 'bg-blue-50 text-blue-900 ring-1 ring-blue-200',
  disabled: 'opacity-50 cursor-not-allowed grayscale',
  hover: 'bg-gray-100'
};</code></pre>

      <h3>React</h3>
      <pre><code class="language-tsx">import { Select } from '@smilodon/react';

&lt;Select
  items={items}
  classMap={{
    selected: 'bg-blue-600 text-white font-semibold',
    active: 'bg-blue-50 text-blue-900',
    disabled: 'opacity-50 cursor-not-allowed',
  }}
/&gt;</code></pre>

      <h3>Vue</h3>
      <pre><code class="language-vue">&lt;template&gt;
  &lt;Select
    :items="items"
    :class-map="classMap"
  /&gt;
&lt;/template&gt;

&lt;script setup&gt;
const classMap = {
  selected: 'bg-blue-600 text-white font-semibold',
  active: 'bg-blue-50 text-blue-900',
  disabled: 'opacity-50 cursor-not-allowed'
};
&lt;/script&gt;</code></pre>
    </div>

    <div class="doc-section">
      <h2>4. Per-Option Styling</h2>
      <p>Apply custom styles to individual options:</p>
      
      <h3>Using Inline Style Object</h3>
      <pre><code class="language-javascript">const items = [
  {
    value: 'gradient',
    label: 'Gradient Option',
    style: {
      backgroundImage: 'linear-gradient(180deg, #f4f4f4 0%, #d7d7d7 100%)',
      color: '#111',
      fontWeight: 'bold',
      borderLeft: '4px solid #0f3460'
    }
  },
  {
    value: 'image',
    label: 'Background Image',
    style: {
      backgroundImage: 'url(/images/option-bg.jpg)',
      backgroundSize: 'cover',
      color: 'white',
      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
    }
  }
];

select.setItems(items);</code></pre>

      <h3>Using className with ::part()</h3>
      <pre><code class="language-html">&lt;style&gt;
enhanced-select::part(option).user-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  align-items: center;
  background-image: url('/avatars/user.jpg');
  background-size: cover;
  color: white;
}

enhanced-select::part(option).user-card:hover {
  filter: brightness(0.92);
}

enhanced-select::part(option).premium {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a2e;
  font-weight: bold;
}
&lt;/style&gt;

&lt;script&gt;
const items = [
  { value: 1, label: 'Alex', className: 'user-card' },
  { value: 2, label: 'Premium Plan', className: 'premium' }
];
&lt;/script&gt;</code></pre>
    </div>

    <div class="doc-section">
      <h2>5. Custom Option Renderers</h2>
      <p>Create rich, custom HTML content for options:</p>
      
      <pre><code class="language-javascript">function optionRenderer(item, index) {
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-option';
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.gap = '12px';
  wrapper.style.padding = '12px';
  
  // Escape HTML to prevent XSS
  const escapeHtml = (str) =&gt; {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };
  
  wrapper.innerHTML = \`
    &lt;img 
      src="\${escapeHtml(item.avatar) || '/default-avatar.png'}" 
      alt="\${escapeHtml(item.label)}"
      style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"
    &gt;
    &lt;div style="flex: 1;"&gt;
      &lt;div style="font-weight: 600; color: var(--select-text);"&gt;
        \${escapeHtml(item.label)}
      &lt;/div&gt;
      &lt;div style="font-size: 0.8rem; color: var(--select-text-muted);"&gt;
        \${escapeHtml(item.subtitle || '')}
      &lt;/div&gt;
    &lt;/div&gt;
    \${item.badge ? \`
      &lt;span style="
        padding: 2px 8px;
        background: #dbeafe;
        color: #1e40af;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
      "&gt;\${escapeHtml(item.badge)}&lt;/span&gt;
    \` : ''}
  \`;
  
  return wrapper;
}

const items = [
  {
    value: 1,
    label: 'John Doe',
    subtitle: 'john@example.com',
    avatar: '/avatars/john.jpg',
    badge: 'Admin',
    render: optionRenderer
  },
  {
    value: 2,
    label: 'Jane Smith',
    subtitle: 'jane@example.com',
    avatar: '/avatars/jane.jpg',
    render: optionRenderer
  }
];

select.setItems(items);</code></pre>
    </div>

    <div class="doc-section">
      <h2>Dark Mode Support</h2>
      <p>Smilodon automatically supports dark mode using CSS custom properties:</p>
      
      <pre><code class="language-css">/* Light mode (default) */
:root {
  --select-surface: #ffffff;
  --select-text: #1a1a2e;
  --select-border: #e1e5eb;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --select-surface: #1f2937;
    --select-text: #f9fafb;
    --select-border: #374151;
    --select-text-muted: #9ca3af;
    --select-surface-elevated: #374151;
    
    /* Dark mode specific tokens */
    --select-dark-bg: #111827;
    --select-dark-text: #f9fafb;
    --select-dark-border: #4b5563;
    --select-dark-dropdown-bg: #1f2937;
    --select-dark-option-hover-bg: #374151;
    --select-dark-option-selected-bg: #3b82f6;
  }
}

/* Manual dark mode toggle */
[data-theme="dark"] enhanced-select {
  --select-surface: #1f2937;
  --select-text: #f9fafb;
  --select-border: #374151;
}</code></pre>
    </div>

    <div class="doc-section">
      <h2>Framework Integration</h2>
      
      <h3>Tailwind CSS</h3>
      <pre><code class="language-tsx">import { Select } from '@smilodon/react';

&lt;Select
  className="w-full max-w-xl"
  style={{
    '--select-input-border': '1px solid rgb(229 231 235)',
    '--select-input-border-radius': '0.75rem',
    '--select-input-focus-border': 'rgb(59 130 246)',
    '--select-shadow-focus': '0 0 0 3px rgb(59 130 246 / 0.18)',
    '--select-option-selected-bg': 'rgb(219 234 254)',
    '--select-option-selected-color': 'rgb(30 64 175)',
  } as React.CSSProperties}
  classMap={{
    selected: 'bg-blue-600 text-white',
    active: 'bg-blue-50 text-blue-900 ring-2 ring-blue-200',
    disabled: 'opacity-50 cursor-not-allowed',
  }}
/&gt;</code></pre>

      <h3>Bootstrap</h3>
      <pre><code class="language-html">&lt;div class="container py-4"&gt;
  &lt;label class="form-label fw-semibold"&gt;Team&lt;/label&gt;
  &lt;enhanced-select class="d-block w-100"&gt;&lt;/enhanced-select&gt;
&lt;/div&gt;

&lt;style&gt;
enhanced-select {
  --select-input-border: 1px solid #ced4da;
  --select-input-border-radius: 0.375rem;
  --select-input-focus-border: #86b7fe;
  --select-shadow-focus: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  --select-option-hover-bg: #e9ecef;
  --select-option-selected-bg: #0d6efd;
  --select-option-selected-color: #ffffff;
  --select-badge-bg: #0d6efd;
}
&lt;/style&gt;</code></pre>

      <h3>Material UI (React)</h3>
      <pre><code class="language-tsx">import { GlobalStyles } from '@mui/material';
import { Select } from '@smilodon/react';

export function MuiExample() {
  return (
    &lt;&gt;
      &lt;GlobalStyles
        styles={{
          'enhanced-select': {
            '--select-input-border': '1px solid rgba(0,0,0,0.23)',
            '--select-input-border-radius': '12px',
            '--select-input-focus-border': '#1976d2',
            '--select-shadow-focus': '0 0 0 3px rgba(25, 118, 210, 0.12)',
            '--select-option-selected-bg': '#1976d2',
            '--select-option-hover-bg': 'rgba(25, 118, 210, 0.08)',
          },
        }}
      /&gt;
      &lt;Select items={items} /&gt;
    &lt;/&gt;
  );
}</code></pre>
    </div>

    <div class="doc-section">
      <h2>Accessibility & Motion</h2>
      
      <h3>Focus Rings (WCAG 2.2 Compliant)</h3>
      <pre><code class="language-css">/* Ensure visible focus indicators */
enhanced-select::part(input):focus {
  outline: 2px solid var(--select-border-focus);
  outline-offset: 2px;
}

enhanced-select::part(option):focus {
  outline: 2px solid var(--select-border-focus);
  outline-offset: -2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  enhanced-select {
    --select-border: #000000;
    --select-border-focus: #0000ff;
    --select-option-selected-bg: #0000ff;
  }
}</code></pre>

      <h3>Reduced Motion</h3>
      <pre><code class="language-css">/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  enhanced-select {
    --select-transition-fast: 0ms;
    --select-transition-smooth: 0ms;
    --select-transition-bounce: 0ms;
    --select-badge-animation: none;
  }
  
  enhanced-select::part(dropdown) {
    animation: none !important;
  }
}</code></pre>
    </div>

    <div class="doc-section">
      <h2>Complete Example: Custom Theme</h2>
      <p>A full example combining multiple styling techniques:</p>
      
      <pre><code class="language-html">&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
  &lt;style&gt;
    :root {
      /* Custom brand colors */
      --brand-primary: #6366f1;
      --brand-surface: #ffffff;
      --brand-text: #1e293b;
      --brand-border: #e2e8f0;
    }

    /* Apply to all select instances */
    enhanced-select {
      --select-primary: var(--brand-primary);
      --select-accent: var(--brand-primary);
      --select-surface: var(--brand-surface);
      --select-text: var(--brand-text);
      --select-border: var(--brand-border);
      --select-border-focus: var(--brand-primary);
      --select-shadow-focus: 0 0 0 3px rgba(99, 102, 241, 0.12);
      --select-option-selected-bg: var(--brand-primary);
      --select-badge-bg: linear-gradient(135deg, var(--brand-primary), #8b5cf6);
    }

    /* Specific customization for user select */
    enhanced-select.user-select::part(option) {
      padding: 16px;
      border-bottom: 1px solid var(--brand-border);
    }

    enhanced-select.user-select::part(option):last-child {
      border-bottom: none;
    }

    /* Premium styling */
    enhanced-select::part(option).premium-option {
      background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
      font-weight: 600;
      position: relative;
    }

    enhanced-select::part(option).premium-option::before {
      content: '⭐';
      margin-right: 8px;
    }
  &lt;/style&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;enhanced-select class="user-select"&gt;&lt;/enhanced-select&gt;

  &lt;script type="module"&gt;
    const select = document.querySelector('.user-select');
    
    // Safe HTML escaping function
    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
    
    const items = [
      {
        value: 1,
        label: 'Free Plan',
        subtitle: 'Basic features',
      },
      {
        value: 2,
        label: 'Pro Plan',
        subtitle: 'Advanced features',
        className: 'premium-option'
      }
    ];
    
    select.setItems(items);
    
    // Custom class mapping
    select.classMap = {
      selected: 'font-semibold',
      active: 'bg-indigo-50'
    };
  &lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>
    </div>

    <div class="doc-note">
      <h3>Security Best Practices</h3>
      <ul>
        <li><strong>Always escape user-generated content</strong> when using custom renderers</li>
        <li>Use <code>textContent</code> instead of <code>innerHTML</code> when possible</li>
        <li>Sanitize image URLs and other external resources</li>
        <li>Validate CSS values before applying inline styles</li>
        <li>Use Content Security Policy (CSP) headers in production</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>More Resources</h2>
      <ul>
        <li><a href="#styling-tokens">Complete Token Reference</a> - All CSS variables</li>
        <li><a href="#styling-examples">Styling Examples</a> - More practical examples</li>
        <li><a href="#css-frameworks">CSS Framework Guide</a> - Tailwind, Bootstrap, Material UI</li>
        <li><a href="#performance">Performance Guide</a> - Optimization tips</li>
      </ul>
    </div>
  `,
  
  react: `
    <h1>React Integration</h1>
    
    <div class="doc-section">
      <h2>Installation</h2>
      <pre><code class="language-bash">npm install @smilodon/core @smilodon/react</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Basic Usage</h2>
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react';

export default function MyComponent() {
  const [selected, setSelected] = useState(null);
  
  const items = [
    { id: 1, label: 'Option 1' },
    { id: 2, label: 'Option 2' },
    { id: 3, label: 'Option 3' }
  ];
  
  return (
    &lt;NativeSelect
      items={items}
      value={selected}
      onSelect={({ items }) => setSelected(items[0])}
    /&gt;
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Multi-Select</h2>
      <pre><code class="language-tsx">&lt;NativeSelect
  mode="multi"
  items={items}
  onSelect={({ items }) => console.log('Selected:', items)}
/&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>With Search</h2>
      <pre><code class="language-tsx">&lt;NativeSelect
  searchable
  items={items}
  onSearch={({ query }) => {
    // Filter items based on query
    const filtered = items.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredItems(filtered);
  }}
/&gt;</code></pre>
    </div>
  `,
  
  vue: `
    <h1>Vue 3 Integration</h1>
    
    <div class="doc-section">
      <h2>Installation</h2>
      <pre><code class="language-bash">npm install @smilodon/core @smilodon/vue</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Basic Usage</h2>
      <pre><code class="language-vue">&lt;template&gt;
  &lt;NativeSelect
    :items="items"
    :value="selected"
    @select="handleSelect"
  /&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { ref } from 'vue';
import { NativeSelect } from '@smilodon/vue';

const selected = ref(null);
const items = [
  { id: 1, label: 'Option 1' },
  { id: 2, label: 'Option 2' },
  { id: 3, label: 'Option 3' }
];

function handleSelect({ items }) {
  selected.value = items[0];
}
&lt;/script&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Composition API</h2>
      <pre><code class="language-vue">&lt;script setup&gt;
import { ref, computed } from 'vue';
import { NativeSelect } from '@smilodon/vue';

const searchQuery = ref('');
const allItems = ref([...]);

const filteredItems = computed(() => {
  if (!searchQuery.value) return allItems.value;
  return allItems.value.filter(item =>
    item.label.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});
&lt;/script&gt;</code></pre>
    </div>
  `,
  
  svelte: `
    <h1>Svelte Integration</h1>
    
    <div class="doc-section">
      <h2>Installation</h2>
      <pre><code class="language-bash">npm install @smilodon/core @smilodon/svelte</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Basic Usage</h2>
      <pre><code class="language-svelte">&lt;script&gt;
  import { NativeSelect } from '@smilodon/svelte';
  
  let selected = null;
  const items = [
    { id: 1, label: 'Option 1' },
    { id: 2, label: 'Option 2' },
    { id: 3, label: 'Option 3' }
  ];
  
  function handleSelect(event) {
    selected = event.detail.items[0];
  }
&lt;/script&gt;

&lt;NativeSelect
  {items}
  value={selected}
  on:select={handleSelect}
/&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Reactive Filtering</h2>
      <pre><code class="language-svelte">&lt;script&gt;
  import { writable, derived } from 'svelte/store';
  
  const searchQuery = writable('');
  const allItems = writable([...]);
  
  const filteredItems = derived(
    [searchQuery, allItems],
    ([$query, $items]) => {
      if (!$query) return $items;
      return $items.filter(item =>
        item.label.toLowerCase().includes($query.toLowerCase())
      );
    }
  );
&lt;/script&gt;</code></pre>
    </div>
  `,
  
  accessibility: `
    <h1>Accessibility</h1>
    
    <div class="doc-section">
      <h2>WCAG 2.1 Compliance</h2>
      <p>Smilodon is designed to be fully accessible and meets WCAG 2.1 Level AA standards.</p>
      
      <h3>ARIA Support</h3>
      <ul>
        <li><code>role="listbox"</code> for the dropdown</li>
        <li><code>role="option"</code> for each item</li>
        <li><code>aria-selected</code> for selected items</li>
        <li><code>aria-activedescendant</code> for keyboard navigation</li>
        <li><code>aria-expanded</code> for dropdown state</li>
        <li><code>aria-label</code> and <code>aria-labelledby</code> support</li>
      </ul>
    </div>
    
    <div class="doc-section">
      <h2>Keyboard Navigation</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>Enter</code> / <code>Space</code></td>
            <td>Open dropdown or select focused option</td>
          </tr>
          <tr>
            <td><code>↑</code> / <code>↓</code></td>
            <td>Navigate through options</td>
          </tr>
          <tr>
            <td><code>Home</code> / <code>End</code></td>
            <td>Jump to first/last option</td>
          </tr>
          <tr>
            <td><code>Escape</code></td>
            <td>Close dropdown</td>
          </tr>
          <tr>
            <td><code>Tab</code></td>
            <td>Move focus (closes dropdown)</td>
          </tr>
          <tr>
            <td><code>Type ahead</code></td>
            <td>Jump to option starting with typed letter</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Screen Reader Support</h2>
      <p>Smilodon provides comprehensive screen reader announcements:</p>
      <ul>
        <li>Current selection state</li>
        <li>Number of options available</li>
        <li>Position in list during navigation</li>
        <li>Selection changes</li>
        <li>Dropdown open/closed state</li>
      </ul>
    </div>
    
    <div class="doc-section">
      <h2>Focus Management</h2>
      <p>Proper focus handling ensures keyboard users can navigate efficiently:</p>
      <ul>
        <li>Focus trap within open dropdown</li>
        <li>Focus returns to trigger on close</li>
        <li>Visible focus indicators</li>
        <li>Logical tab order</li>
      </ul>
    </div>
  `,
  
  testing: `
    <h1>Testing</h1>
    
    <div class="doc-section">
      <h2>Unit Testing</h2>
      <p>Test Smilodon components with your favorite testing framework:</p>
      
      <h3>React Testing Library</h3>
      <pre><code class="language-tsx">import { render, screen, fireEvent } from '@testing-library/react';
import { NativeSelect } from '@smilodon/react';

test('selects an option', () => {
  const handleSelect = jest.fn();
  const items = [
    { id: 1, label: 'Apple' },
    { id: 2, label: 'Banana' }
  ];
  
  render(&lt;NativeSelect items={items} onSelect={handleSelect} /&gt;);
  
  const select = screen.getByRole('combobox');
  fireEvent.click(select);
  
  const option = screen.getByText('Apple');
  fireEvent.click(option);
  
  expect(handleSelect).toHaveBeenCalledWith(
    expect.objectContaining({
      items: [items[0]]
    })
  );
});</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>E2E Testing</h2>
      <p>End-to-end tests with Playwright or Cypress:</p>
      
      <h3>Playwright</h3>
      <pre><code class="language-typescript">import { test, expect } from '@playwright/test';

test('user can select an option', async ({ page }) => {
  await page.goto('/');
  
  // Open select
  await page.click('enhanced-select');
  
  // Select option
  await page.click('text=Apple');
  
  // Verify selection
  await expect(page.locator('enhanced-select')).toContainText('Apple');
});</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Accessibility Testing</h2>
      <p>Ensure your selects are accessible:</p>
      
      <pre><code class="language-typescript">import { axe } from 'jest-axe';

test('has no accessibility violations', async () => {
  const { container } = render(&lt;NativeSelect items={items} /&gt;);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});</code></pre>
    </div>
  `,
  
  algorithms: `
    <h1>Algorithms</h1>
    
    <div class="doc-section">
      <h2>Virtualization Algorithm</h2>
      <p>Smilodon uses a sophisticated virtualization algorithm to render only visible items:</p>
      
      <h3>Key Concepts</h3>
      <ul>
        <li><strong>Viewport:</strong> The visible area of the dropdown</li>
        <li><strong>Buffer:</strong> Additional items rendered above/below viewport</li>
        <li><strong>Recycling:</strong> DOM nodes are reused as items scroll</li>
        <li><strong>Anchor Point:</strong> Maintains scroll position during updates</li>
      </ul>
      
      <h3>Performance Characteristics</h3>
      <ul>
        <li>O(1) render complexity regardless of dataset size</li>
        <li>O(log n) search with binary search optimization</li>
        <li>Constant memory usage for DOM nodes</li>
        <li>60 FPS scrolling maintained at all dataset sizes</li>
      </ul>
    </div>
  `,
  
  paradigms: `
    <h1>Design Paradigms</h1>
    
    <div class="doc-section">
      <h2>Core Principles</h2>
      
      <h3>1. Performance First</h3>
      <p>Every decision prioritizes runtime performance and user experience. No feature ships without meeting performance budgets.</p>
      
      <h3>2. Framework Agnostic Core</h3>
      <p>One Web Component powers all framework adapters. This ensures consistent behavior and reduces maintenance burden.</p>
      
      <h3>3. Progressive Enhancement</h3>
      <p>Basic functionality works everywhere. Advanced features activate when supported.</p>
      
      <h3>4. Accessibility by Default</h3>
      <p>ARIA patterns, keyboard navigation, and screen reader support are built-in, not add-ons.</p>
      
      <h3>5. Customization without Complexity</h3>
      <p>Powerful styling options through CSS custom properties and shadow parts, without JavaScript configuration hell.</p>
    </div>
  `,
  
  'single-select': `
    <h1>Single Select</h1>
    
    <div class="doc-section">
      <h2>Overview</h2>
      <p>Single select mode allows users to choose one option from the list.</p>
      
      <h3>Basic Example</h3>
      <pre><code class="language-tsx">&lt;NativeSelect
  mode="single"
  items={items}
  onSelect={({ items }) => console.log('Selected:', items[0])}
/&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Behavior</h2>
      <ul>
        <li>Selecting a new option replaces the previous selection</li>
        <li>Dropdown closes automatically after selection (configurable)</li>
        <li>Clear button removes current selection</li>
        <li>Keyboard: Enter/Space to select, Escape to close</li>
      </ul>
    </div>
  `,
  
  'multi-select': `
    <h1>Multi-Select Mode</h1>
    
    <div class="doc-section">
      <h2>Overview</h2>
      <p>Multi-select mode allows users to choose multiple options simultaneously. Selected items appear as removable chips/badges in the input area, providing clear visual feedback of current selections.</p>
      
      <h3>Key Features</h3>
      <ul>
        <li>✅ Selected items displayed as removable chips with hover/focus states</li>
        <li>✅ Dropdown stays open after selection for continued browsing</li>
        <li>✅ Individual chip removal or clear all functionality</li>
        <li>✅ Selection limits with visual feedback</li>
        <li>✅ Bulk operations (select all, clear all)</li>
        <li>✅ Keyboard navigation between chips (Arrow keys, Backspace)</li>
        <li>✅ Custom chip rendering and styling</li>
        <li>✅ Accessibility support with ARIA attributes</li>
      </ul>
    </div>
    
    <div class="doc-section">
      <h2>Basic Usage</h2>
      
      <h3>React</h3>
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react';
import { useState } from 'react';

function MultiSelectExample() {
  const [selected, setSelected] = useState([]);
  
  const items = [
    { id: 1, label: 'Apple', category: 'Fruits' },
    { id: 2, label: 'Banana', category: 'Fruits' },
    { id: 3, label: 'Carrot', category: 'Vegetables' },
    { id: 4, label: 'Broccoli', category: 'Vegetables' }
  ];
  
  return (
    &lt;NativeSelect
      mode="multi"
      items={items}
      selectedIndices={selected}
      onSelect={({ indices, items }) => {
        setSelected(indices);
        console.log('Selected items:', items);
      }}
      placeholder="Select multiple items..."
    /&gt;
  );
}</code></pre>

      <h3>Vue</h3>
      <pre><code class="language-vue">&lt;template&gt;
  &lt;NativeSelect
    mode="multi"
    :items="items"
    :selected-indices="selected"
    @select="handleSelect"
    placeholder="Select multiple items..."
  /&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { ref } from 'vue';
import { NativeSelect } from '@smilodon/vue';

const selected = ref([]);
const items = [
  { id: 1, label: 'Option 1' },
  { id: 2, label: 'Option 2' },
  { id: 3, label: 'Option 3' }
];

const handleSelect = ({ indices, items }) => {
  selected.value = indices;
  console.log('Selected:', items);
};
&lt;/script&gt;</code></pre>

      <h3>Vanilla JavaScript</h3>
      <pre><code class="language-html">&lt;enhanced-select id="multi-select"&gt;&lt;/enhanced-select&gt;

&lt;script type="module"&gt;
import '@smilodon/core';

const select = document.getElementById('multi-select');
select.multi = true;
select.items = [
  { id: 1, label: 'Option 1' },
  { id: 2, label: 'Option 2' },
  { id: 3, label: 'Option 3' }
];

select.addEventListener('select', (e) => {
  console.log('Selected indices:', e.detail.indices);
  console.log('Selected items:', e.detail.items);
});
&lt;/script&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Configuration Options</h2>
      
      <h3>Selection Limits</h3>
      <p>Restrict the maximum number of selections:</p>
      <pre><code class="language-tsx">import { configureSelect } from '@smilodon/core';

// Global configuration
configureSelect({
  selection: {
    mode: 'multi',
    maxSelections: 5,  // Limit to 5 items
    showRemoveButton: true,
    closeOnSelect: false  // Keep dropdown open
  }
});

// Or per component
&lt;NativeSelect
  mode="multi"
  config={{
    selection: { maxSelections: 3 }
  }}
  items={items}
/&gt;</code></pre>

      <h3>Close Behavior</h3>
      <pre><code class="language-tsx">// Auto-close after each selection
&lt;NativeSelect
  mode="multi"
  config={{
    selection: { closeOnSelect: true }
  }}
  items={items}
/&gt;

// Keep open for multiple selections (default)
&lt;NativeSelect
  mode="multi"
  config={{
    selection: { closeOnSelect: false }
  }}
  items={items}
/&gt;</code></pre>

      <h3>Allow Deselection</h3>
      <pre><code class="language-tsx">// Allow clicking selected items to deselect
&lt;NativeSelect
  mode="multi"
  config={{
    selection: { allowDeselect: true }
  }}
  items={items}
/&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Chip Customization</h2>
      
      <h3>Custom Remove Button</h3>
      <pre><code class="language-tsx">import { configureSelect } from '@smilodon/core';

configureSelect({
  selection: {
    mode: 'multi',
    showRemoveButton: true,
    removeButtonIcon: '&times;'  // Or use custom SVG
  }
});

// With custom SVG icon
configureSelect({
  selection: {
    removeButtonIcon: \`
      &lt;svg viewBox="0 0 16 16" width="16" height="16"&gt;
        &lt;path d="M4 4l8 8m0-8l-8 8" stroke="currentColor" stroke-width="2"/&gt;
      &lt;/svg&gt;
    \`
  }
});</code></pre>

      <h3>Chip Styling with CSS</h3>
      <pre><code class="language-css">/* Style chips/badges */
enhanced-select::part(chip) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

enhanced-select::part(chip):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Style chip label */
enhanced-select::part(chip-label) {
  margin-right: 8px;
}

/* Style remove button */
enhanced-select::part(chip-remove) {
  opacity: 0.7;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

enhanced-select::part(chip-remove):hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.3);
}

/* CSS Custom Properties */
enhanced-select {
  --select-badge-bg: #3b82f6;
  --select-badge-color: white;
  --select-badge-border-radius: 4px;
  --select-badge-padding: 4px 8px;
  --select-badge-gap: 4px;
  --select-badge-font-size: 14px;
  --select-badge-font-weight: 500;
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Bulk Operations</h2>
      
      <h3>Select All</h3>
      <pre><code class="language-tsx">function SelectAllExample() {
  const selectRef = useRef&lt;NativeSelectElement&gt;(null);
  
  const handleSelectAll = () => {
    selectRef.current?.selectAll();
  };
  
  return (
    &lt;div&gt;
      &lt;button onClick={handleSelectAll}&gt;Select All&lt;/button&gt;
      &lt;NativeSelect
        ref={selectRef}
        mode="multi"
        items={items}
      /&gt;
    &lt;/div&gt;
  );
}</code></pre>

      <h3>Clear All</h3>
      <pre><code class="language-tsx">function ClearAllExample() {
  const selectRef = useRef&lt;NativeSelectElement&gt;(null);
  
  const handleClearAll = () => {
    selectRef.current?.clearSelection();
  };
  
  return (
    &lt;div&gt;
      &lt;button onClick={handleClearAll}&gt;Clear All&lt;/button&gt;
      &lt;NativeSelect
        ref={selectRef}
        mode="multi"
        items={items}
      /&gt;
    &lt;/div&gt;
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Keyboard Navigation</h2>
      
      <h3>Supported Keys</h3>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>Space</code> / <code>Enter</code></td>
            <td>Select/deselect focused option</td>
          </tr>
          <tr>
            <td><code>ArrowUp</code> / <code>ArrowDown</code></td>
            <td>Navigate through options</td>
          </tr>
          <tr>
            <td><code>ArrowLeft</code> / <code>ArrowRight</code></td>
            <td>Navigate between chips</td>
          </tr>
          <tr>
            <td><code>Backspace</code></td>
            <td>Remove focused chip</td>
          </tr>
          <tr>
            <td><code>Escape</code></td>
            <td>Close dropdown</td>
          </tr>
          <tr>
            <td><code>Home</code> / <code>End</code></td>
            <td>Jump to first/last option</td>
          </tr>
          <tr>
            <td><code>Ctrl + A</code></td>
            <td>Select all items</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Accessibility</h2>
      
      <h3>ARIA Attributes</h3>
      <p>Multi-select mode automatically includes proper ARIA attributes:</p>
      <ul>
        <li><code>role="listbox"</code> with <code>aria-multiselectable="true"</code></li>
        <li><code>aria-selected="true"</code> on selected options</li>
        <li><code>aria-label</code> on remove buttons</li>
        <li><code>aria-live</code> region for selection announcements</li>
      </ul>
      
      <h3>Screen Reader Support</h3>
      <pre><code class="language-html">&lt;!-- Announces: "Apple selected, 3 of 10 items selected" --&gt;
&lt;enhanced-select
  mode="multi"
  aria-label="Select fruits"
&gt;&lt;/enhanced-select&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Performance Considerations</h2>
      
      <h3>Large Datasets</h3>
      <p>For datasets with many items, combine multi-select with virtualization:</p>
      <pre><code class="language-tsx">&lt;NativeSelect
  mode="multi"
  virtualized={true}
  items={largeDataset}  // 10,000+ items
  estimatedItemHeight={48}
  buffer={10}
/&gt;</code></pre>
      
      <h3>Chip Rendering Performance</h3>
      <p>With many selected items, chips are virtualized automatically when exceeding 20 items:</p>
      <ul>
        <li>First 15 chips fully rendered</li>
        <li>Remaining shown as "+N more" badge</li>
        <li>Click to expand full list</li>
      </ul>
    </div>
    
    <div class="doc-section">
      <h2>Event Handling</h2>
      
      <pre><code class="language-tsx">function EventHandlingExample() {
  const handleSelect = (event) => {
    console.log('Selected indices:', event.indices);
    console.log('Selected items:', event.items);
    console.log('Source:', event.source); // 'click' | 'keyboard' | 'api'
  };
  
  const handleChipRemove = (event) => {
    console.log('Removed item:', event.item);
    console.log('Remaining indices:', event.indices);
  };
  
  return (
    &lt;NativeSelect
      mode="multi"
      items={items}
      onSelect={handleSelect}
      onChipRemove={handleChipRemove}
    /&gt;
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Complete Example</h2>
      
      <pre><code class="language-tsx">import { NativeSelect, configureSelect } from '@smilodon/react';
import { useState, useRef } from 'react';

// Global configuration
configureSelect({
  selection: {
    mode: 'multi',
    maxSelections: 0,  // Unlimited
    showRemoveButton: true,
    removeButtonIcon: '×',
    closeOnSelect: false,
    allowDeselect: true
  }
});

function ComprehensiveMultiSelect() {
  const [selected, setSelected] = useState([]);
  const selectRef = useRef(null);
  
  const items = [
    { id: 1, label: 'React', category: 'Frontend' },
    { id: 2, label: 'Vue', category: 'Frontend' },
    { id: 3, label: 'Svelte', category: 'Frontend' },
    { id: 4, label: 'Node.js', category: 'Backend' },
    { id: 5, label: 'Python', category: 'Backend' },
    { id: 6, label: 'Go', category: 'Backend' }
  ];
  
  return (
    &lt;div className="multi-select-demo"&gt;
      &lt;div className="controls"&gt;
        &lt;button onClick={() => selectRef.current.selectAll()}&gt;
          Select All
        &lt;/button&gt;
        &lt;button onClick={() => selectRef.current.clearSelection()}&gt;
          Clear All
        &lt;/button&gt;
        &lt;span&gt;Selected: {selected.length}&lt;/span&gt;
      &lt;/div&gt;
      
      &lt;NativeSelect
        ref={selectRef}
        mode="multi"
        items={items}
        grouped
        searchable
        selectedIndices={selected}
        onSelect={({ indices, items }) => {
          setSelected(indices);
          console.log('Selection changed:', items);
        }}
        placeholder="Select technologies..."
        config={{
          selection: {
            maxSelections: 5  // Override: limit to 5
          }
        }}
      /&gt;
      
      &lt;style jsx&gt;{\`
        enhanced-select::part(chip) {
          background: #3b82f6;
          color: white;
          border-radius: 16px;
          padding: 4px 12px;
          font-size: 14px;
          transition: all 0.2s;
        }
        
        enhanced-select::part(chip):hover {
          background: #2563eb;
          transform: scale(1.05);
        }
        
        enhanced-select::part(chip-remove) {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          margin-left: 8px;
        }
        
        enhanced-select::part(chip-remove):hover {
          background: rgba(255, 255, 255, 0.4);
        }
      \`}&lt;/style&gt;
    &lt;/div&gt;
  );
}</code></pre>
    </div>
  `,
  
  searchable: `
    <h1>Searchable Select</h1>
    
    <div class="doc-section">
      <h2>Overview</h2>
      <p>Searchable mode adds a text input that filters the option when the dropdown is open. Supports both local client-side filtering and remote server-side search with debouncing and caching.</p>
      
      <h3>Key Features</h3>
      <ul>
        <li>✅ Client-side filtering with fuzzy matching</li>
        <li>✅ Server-side search with API integration</li>
        <li>✅ Configurable debouncing (default: 300ms)</li>
        <li>✅ Minimum query length threshold</li>
        <li>✅ Case-sensitive/insensitive matching</li>
        <li>✅ Custom search algorithms</li>
        <li>✅ Search highlighting in results</li>
        <li>✅ Clear search button</li>
        <li>✅ Loading indicators for async search</li>
        <li>✅ Keyboard navigation during search</li>
      </ul>
    </div>
    
    <div class="doc-section">
      <h2>Local Search (Client-Side)</h2>
      
      <h3>Basic Usage</h3>
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react';

function LocalSearchExample() {
  const items = [
    { id: 1, label: 'Apple' },
    { id: 2, label: 'Banana' },
    { id: 3, label: 'Cherry' },
    { id: 4, label: 'Date' },
    { id: 5, label: 'Elderberry' }
  ];
  
  return (
    &lt;NativeSelect
      searchable
      items={items}
      searchPlaceholder="Search fruits..."
    /&gt;
  );
}</code></pre>

      <h3>Custom Search Algorithm</h3>
      <p>Override the default search algorithm with your own:</p>
      <pre><code class="language-tsx">function CustomSearchExample() {
  const customFilter = (items, query) => {
    return items.filter(item => {
      // Custom logic: starts with, contains, fuzzy, etc.
      return item.label.toLowerCase().startsWith(query.toLowerCase());
    });
  };
  
  return (
    &lt;NativeSelect
      searchable
      items={items}
      searchFilter={customFilter}
    /&gt;
  );
}</code></pre>

      <h3>Fuzzy Matching</h3>
      <pre><code class="language-tsx">import { fuzzyMatch } from '@smilodon/core';

function FuzzySearchExample() {
  const fuzzyFilter = (items, query) => {
    return items.filter(item => {
      const score = fuzzyMatch(item.label, query);
      return score > 0.5;  // Threshold for match quality
    }).sort((a, b) => {
      // Sort by match quality
      return fuzzyMatch(b.label, query) - fuzzyMatch(a.label, query);
    });
  };
  
  return (
    &lt;NativeSelect
      searchable
      items={items}
      searchFilter={fuzzyFilter}
    /&gt;
  );
}</code></pre>

      <h3>Case-Sensitive Search</h3>
      <pre><code class="language-tsx">&lt;NativeSelect
  searchable
  items={items}
  searchCaseSensitive={true}
/&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Remote Search (Server-Side)</h2>
      
      <h3>Basic API Integration</h3>
      <pre><code class="language-tsx">import { useState } from 'react';

function RemoteSearchExample() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const handleSearch = async ({ query }) => {
    if (!query || query.length < 2) {
      setItems([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}\`);
      const results = await response.json();
      setItems(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    &lt;NativeSelect
      searchable
      items={items}
      onSearch={handleSearch}
      loading={loading}
      searchPlaceholder="Type to search..."
      minSearchLength={2}
    /&gt;
  );
}</code></pre>

      <h3>With Debouncing</h3>
      <pre><code class="language-tsx">import { useDebouncedCallback } from 'use-debounce';

function DebouncedSearchExample() {
  const [items, setItems] = useState([]);
  
  const debouncedSearch = useDebouncedCallback(async (query) => {
    const response = await fetch(\`/api/search?q=\${query}\`);
    const results = await response.json();
    setItems(results);
  }, 300);  // 300ms delay
  
  return (
    &lt;NativeSelect
      searchable
      items={items}
      onSearch={({ query }) => debouncedSearch(query)}
      searchDebounce={300}
    /&gt;
  );
}</code></pre>

      <h3>With Caching</h3>
      <pre><code class="language-tsx">import { useState, useRef } from 'react';

function CachedSearchExample() {
  const [items, setItems] = useState([]);
  const cacheRef = useRef(new Map());
  
  const handleSearch = async ({ query }) => {
    // Check cache first
    if (cacheRef.current.has(query)) {
      setItems(cacheRef.current.get(query));
      return;
    }
    
    // Fetch from API
    const response = await fetch(\`/api/search?q=\${query}\`);
    const results = await response.json();
    
    // Store in cache
    cacheRef.current.set(query, results);
    setItems(results);
  };
  
  return (
    &lt;NativeSelect
      searchable
      items={items}
      onSearch={handleSearch}
    /&gt;
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Configuration Options</h2>
      
      <h3>Search Settings</h3>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>searchable</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>Enable search functionality</td>
          </tr>
          <tr>
            <td><code>searchPlaceholder</code></td>
            <td><code>string</code></td>
            <td><code>'Search...'</code></td>
            <td>Placeholder text for search input</td>
          </tr>
          <tr>
            <td><code>searchDebounce</code></td>
            <td><code>number</code></td>
            <td><code>300</code></td>
            <td>Debounce delay in milliseconds</td>
          </tr>
          <tr>
            <td><code>minSearchLength</code></td>
            <td><code>number</code></td>
            <td><code>0</code></td>
            <td>Minimum characters before search triggers</td>
          </tr>
          <tr>
            <td><code>searchCaseSensitive</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>Enable case-sensitive matching</td>
          </tr>
          <tr>
            <td><code>searchFilter</code></td>
            <td><code>Function</code></td>
            <td>Built-in</td>
            <td>Custom filter function</td>
          </tr>
          <tr>
            <td><code>onSearch</code></td>
            <td><code>Function</code></td>
            <td>-</td>
            <td>Search event handler</td>
          </tr>
          <tr>
            <td><code>clearSearchOnClose</code></td>
            <td><code>boolean</code></td>
            <td><code>true</code></td>
            <td>Clear search when dropdown closes</td>
          </tr>
        </tbody>
      </table>
      
      <h3>Example Configuration</h3>
      <pre><code class="language-tsx">&lt;NativeSelect
  searchable={true}
  searchPlaceholder="Type to filter..."
  searchDebounce={500}
  minSearchLength={2}
  searchCaseSensitive={false}
  clearSearchOnClose={true}
  items={items}
/&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Search Highlighting</h2>
      
      <p>Highlight matching text in search results:</p>
      <pre><code class="language-tsx">function HighlightedSearchExample() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const highlightText = (text, query) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(\`(\${query})\`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase()
        ? \`&lt;mark&gt;\${part}&lt;/mark&gt;\`
        : part
    ).join('');
  };
  
  return (
    &lt;NativeSelect
      searchable
      items={items}
      onSearch={({ query }) => setSearchQuery(query)}
      renderOption={(item) => ({
        ...item,
        label: highlightText(item.label, searchQuery)
      })}
    /&gt;
  );
}</code></pre>

      <h3>Styling Highlights</h3>
      <pre><code class="language-css">enhanced-select mark {
  background-color: #fef08a;
  color: #854d0e;
  font-weight: 600;
  padding: 2px 4px;
  border-radius: 2px;
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Performance Optimization</h2>
      
      <h3>Virtual Scrolling with Search</h3>
      <pre><code class="language-tsx">// Combine search with virtualization for large datasets
&lt;NativeSelect
  searchable
  virtualized={true}
  items={largeDataset}  // 10,000+ items
  estimatedItemHeight={48}
  searchDebounce={200}
/&gt;</code></pre>

      <h3>Web Worker for Search</h3>
      <p>Offload heavy search computations to a Web Worker:</p>
      <pre><code class="language-tsx">import { useWorkerSearch } from '@smilodon/core';

function WorkerSearchExample() {
  const { search, results, isSearching } = useWorkerSearch({
    items: largeDataset,
    searchFields: ['label', 'description', 'tags']
  });
  
  return (
    &lt;NativeSelect
      searchable
      items={results}
      onSearch={({ query }) => search(query)}
      loading={isSearching}
    /&gt;
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Keyboard Shortcuts</h2>
      
      <table class="doc-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>/</code></td>
            <td>Focus search input</td>
          </tr>
          <tr>
            <td><code>Escape</code></td>
            <td>Clear search / close dropdown</td>
          </tr>
          <tr>
            <td><code>ArrowUp</code> / <code>ArrowDown</code></td>
            <td>Navigate filtered results</td>
          </tr>
          <tr>
            <td><code>Enter</code></td>
            <td>Select highlighted option</td>
          </tr>
          <tr>
            <td><code>Ctrl + K</code></td>
            <td>Clear search</td>
          </tr>
        </tbody>
      </table>
      
      <h3>Custom Keyboard Handlers</h3>
      <pre><code class="language-tsx">function CustomKeyboardExample() {
  const handleKeyDown = (e) => {
    if (e.key === '/' && !e.ctrlKey) {
      e.preventDefault();
      // Focus search input
    }
  };
  
  return (
    &lt;NativeSelect
      searchable
      items={items}
      onKeyDown={handleKeyDown}
    /&gt;
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Accessibility</h2>
      
      <h3>ARIA Attributes</h3>
      <ul>
        <li><code>role="combobox"</code> on search input</li>
        <li><code>aria-autocomplete="list"</code></li>
        <li><code>aria-controls</code> linked to listbox</li>
        <li><code>aria-activedescendant</code> for keyboard navigation</li>
        <li><code>aria-live="polite"</code> for result count announcements</li>
      </ul>
      
      <h3>Screen Reader Support</h3>
      <pre><code class="language-html">&lt;!-- Announces: "Type to search. 5 results available" --&gt;
&lt;enhanced-select
  searchable
  aria-label="Search products"
&gt;&lt;/enhanced-select&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Complete Example</h2>
      
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react';
import { useState, useRef, useCallback } from 'react';

function ComprehensiveSearchExample() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);
  
  const handleSearch = useCallback(async ({ query }) => {
    setSearchQuery(query);
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Minimum length check
    if (query.length < 2) {
      setItems([]);
      return;
    }
    
    // Check cache
    if (cacheRef.current.has(query)) {
      setItems(cacheRef.current.get(query));
      return;
    }
    
    // Fetch from API
    abortControllerRef.current = new AbortController();
    setLoading(true);
    
    try {
      const response = await fetch(
        \`/api/search?q=\${encodeURIComponent(query)}\`,
        { signal: abortControllerRef.current.signal }
      );
      const results = await response.json();
      
      cacheRef.current.set(query, results);
      setItems(results);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search failed:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);
  
  const highlightMatch = (text) => {
    if (!searchQuery) return text;
    
    const regex = new RegExp(\`(\${searchQuery})\`, 'gi');
    return text.replace(regex, '&lt;mark&gt;$1&lt;/mark&gt;');
  };
  
  return (
    &lt;NativeSelect
      searchable
      items={items}
      onSearch={handleSearch}
      loading={loading}
      searchPlaceholder="Search products..."
      searchDebounce={300}
      minSearchLength={2}
      virtualized={true}
      renderOption={(item) => \`
        &lt;div class="search-result"&gt;
          &lt;div class="result-title"&gt;\${highlightMatch(item.label)}&lt;/div&gt;
          &lt;div class="result-description"&gt;\${highlightMatch(item.description)}&lt;/div&gt;
        &lt;/div&gt;
      \`}
    /&gt;
  );
}</code></pre>
    </div>
  `,
  
  virtualization: `
    <h1>Virtualization</h1>
    
    <div class="doc-section">
      <h2>Overview</h2>
      <p>Virtualization is a performance optimization technique that renders only the items visible in the viewport plus a buffer zone. Instead of rendering all 100,000 items in the DOM, only ~20 visible items are rendered, achieving 60 FPS scrolling with massive datasets.</p>
      
      <h3>Performance Benefits</h3>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Dataset Size</th>
            <th>Without Virtualization</th>
            <th>With Virtualization</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>100 items</td>
            <td>~10ms render</td>
            <td>~10ms render (same)</td>
          </tr>
          <tr>
            <td>1,000 items</td>
            <td>~100ms render</td>
            <td>~10ms render (10x faster)</td>
          </tr>
          <tr>
            <td>10,000 items</td>
            <td>~1,000ms render</td>
            <td>~15ms render (66x faster)</td>
          </tr>
          <tr>
            <td>100,000 items</td>
            <td>~10,000ms render</td>
            <td>~20ms render (500x faster)</td>
          </tr>
          <tr>
            <td>1,000,000 items</td>
            <td>Browser crash</td>
            <td>~50ms render ✅</td>
          </tr>
        </tbody>
      </table>
      
      <h3>When to Use Virtualization</h3>
      <ul>
        <li>✅ Lists with 100+ items</li>
        <li>✅ Performance-critical applications</li>
        <li>✅ Mobile devices with limited resources</li>
        <li>✅ Real-time data updates with large datasets</li>
        <li>✅ Infinite scroll implementations</li>
        <li>✅ Data grids and tables</li>
      </ul>
    </div>
    
    <div class="doc-section">
      <h2>Basic Usage</h2>
      
      <h3>Auto-Enable (Recommended)</h3>
      <pre><code class="language-tsx">// Virtualization automatically enables for datasets >100 items
import { NativeSelect } from '@smilodon/react';

function AutoVirtualizedSelect() {
  const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    label: \`Item \${i + 1}\`
  }));
  
  return (
    &lt;NativeSelect
      items={largeDataset}
      // Virtualization enabled automatically!
    /&gt;
  );
}</code></pre>

      <h3>Manual Configuration</h3>
      <pre><code class="language-tsx">function ManualVirtualizedSelect() {
  return (
    &lt;NativeSelect
      virtualized={true}
      estimatedItemHeight={48}  // CRITICAL: Must be accurate!
      buffer={10}               // Render 10 extra items above/below
      items={largeDataset}
    /&gt;
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Configuration Options</h2>
      
      <table class="doc-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>virtualized</code></td>
            <td><code>boolean</code></td>
            <td><code>auto</code></td>
            <td>Enable/disable virtualization. <code>auto</code> enables for >100 items</td>
          </tr>
          <tr>
            <td><code>estimatedItemHeight</code></td>
            <td><code>number</code></td>
            <td><code>48</code></td>
            <td>Estimated height of each item in pixels. <strong>Critical for performance!</strong></td>
          </tr>
          <tr>
            <td><code>buffer</code></td>
            <td><code>number</code></td>
            <td><code>5</code></td>
            <td>Number of items to render outside viewport (prevents flashing)</td>
          </tr>
        </tbody>
      </table>
      
      <h3>Finding Accurate Item Height</h3>
      <pre><code class="language-javascript">// Method 1: Inspect in DevTools
// Check "Computed" tab for height

// Method 2: Measure Programmatically
const option = selectRef.current?.querySelector('[role="option"]');
const height = option?.getBoundingClientRect().height;
console.log('Item height:', height);</code></pre>
      
      <h3>Programmatic Scrolling</h3>
      <pre><code class="language-tsx">function ScrollToExample() {
  const selectRef = useRef(null);
  
  const scrollToItem = (index) => {
    selectRef.current?.scrollToIndex(index, 'smooth');
  };
  
  return (
    &lt;div&gt;
      &lt;button onClick={() => scrollToItem(100)}&gt;Jump to item 100&lt;/button&gt;
      &lt;NativeSelect
        ref={selectRef}
        virtualized
        items={largeDataset}
      /&gt;
    &lt;/div&gt;
  );
}</code></pre>
    </div>
  `,
  
  'infinite-scroll': `
    <h1>Infinite Scroll</h1>
    
    <div class="doc-section">
      <h2>Overview</h2>
      <p>Infinite scroll automatically loads more items as the user scrolls near the bottom of the list. Perfect for paginated APIs, real-time feeds, and progressive data loading.</p>
      
      <h3>Key Features</h3>
      <ul>
        <li>✅ Automatic pagination with scroll detection</li>
        <li>✅ Configurable threshold (distance from bottom)</li>
        <li>✅ Loading states and indicators</li>
        <li>✅ Page caching for better performance</li>
        <li>✅ Error handling and retry logic</li>
        <li>✅ Compatible with virtualization</li>
      </ul>
    </div>
    
    <div class="doc-section">
      <h2>Basic Usage</h2>
      
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react';
import { useState } from 'react';

function InfiniteScrollExample() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const response = await fetch(\`/api/items?page=\${page}&limit=20\`);
      const data = await response.json();
      
      setItems(prev => [...prev, ...data.items]);
      setPage(prev => prev + 1);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    &lt;NativeSelect
      items={items}
      onLoadMore={loadMore}
      hasMore={hasMore}
      loading={loading}
      threshold={100}  // Load when 100px from bottom
    /&gt;
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Configuration</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>onLoadMore</code></td>
            <td><code>() => Promise&lt;void&gt;</code></td>
            <td>-</td>
            <td>Function to load more items</td>
          </tr>
          <tr>
            <td><code>hasMore</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>Whether more items are available</td>
          </tr>
          <tr>
            <td><code>loading</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>Loading state indicator</td>
          </tr>
          <tr>
            <td><code>threshold</code></td>
            <td><code>number</code></td>
            <td><code>100</code></td>
            <td>Distance from bottom (px) to trigger load</td>
          </tr>
          <tr>
            <td><code>loadingText</code></td>
            <td><code>string</code></td>
            <td><code>'Loading...'</code></td>
            <td>Text shown while loading</td>
          </tr>
          <tr>
            <td><code>endMessage</code></td>
            <td><code>string</code></td>
            <td><code>'No more items'</code></td>
            <td>Message when all items loaded</td>
          </tr>
        </tbody>
      </table>

      <h3>With Virtualization</h3>
      <p>Combine with virtualization for optimal performance:</p>
      <pre><code class="language-tsx">&lt;NativeSelect
  items={items}
  virtualized={true}
  estimatedItemHeight={48}
  buffer={15}
  onLoadMore={loadMore}
  hasMore={hasMore}
  loading={loading}
/&gt;</code></pre>
    </div>
  `,
  
  'custom-render': `
    <h1>Custom Rendering</h1>
    
    <div class="doc-section">
      <h2>Overview</h2>
      <p>Custom rendering allows you to fully customize how options and selected values are displayed. Use custom HTML templates, React components, Vue components, or any framework-specific rendering approach.</p>
      
      <h3>Key Features</h3>
      <ul>
        <li>✅ Custom option templates with HTML or components</li>
        <li>✅ Custom selected value display</li>
        <li>✅ Rich content: images, icons, badges, multi-line text</li>
        <li>✅ Framework-specific component rendering</li>
        <li>✅ HTML escaping for security</li>
        <li>✅ Dynamic styling based on item state</li>
      </ul>
    </div>
    
    <div class="doc-section">
      <h2>Custom Option Templates</h2>
      
      <h3>React</h3>
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react';

function CustomOptionExample() {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', avatar: '/avatars/john.jpg' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', avatar: '/avatars/jane.jpg' }
  ];
  
  return (
    &lt;NativeSelect
      items={users}
      renderOption={(user) => (
        &lt;div className="user-option"&gt;
          &lt;img src={user.avatar} alt="" className="avatar" /&gt;
          &lt;div className="user-info"&gt;
            &lt;div className="user-name"&gt;{user.name}&lt;/div&gt;
            &lt;div className="user-email"&gt;{user.email}&lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      )}
    /&gt;
  );
}</code></pre>

      <h3>Vue</h3>
      <pre><code class="language-vue">&lt;template&gt;
  &lt;NativeSelect
    :items="users"
    :render-option="renderOption"
  /&gt;
&lt;/template&gt;

&lt;script setup&gt;
const users = [...];

const renderOption = (user) => {
  return {
    template: \`
      &lt;div class="user-option"&gt;
        &lt;img :src="user.avatar" class="avatar" /&gt;
        &lt;div class="user-info"&gt;
          &lt;div class="user-name"&gt;{{ user.name }}&lt;/div&gt;
          &lt;div class="user-email"&gt;{{ user.email }}&lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    \`
  };
};
&lt;/script&gt;</code></pre>

      <h3>Vanilla JS (HTML String)</h3>
      <pre><code class="language-javascript">const select = document.querySelector('enhanced-select');

select.optionTemplate = (user) => \`
  &lt;div class="user-option"&gt;
    &lt;img src="\${user.avatar}" alt="" class="avatar" /&gt;
    &lt;div class="user-info"&gt;
      &lt;div class="user-name"&gt;\${escapeHtml(user.name)}&lt;/div&gt;
      &lt;div class="user-email"&gt;\${escapeHtml(user.email)}&lt;/div&gt;
    &lt;/div&gt;
  &lt;/div&gt;
\`;

// Security: Always escape user content
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Custom Value Display</h2>
      
      <p>Customize how the selected value appears in the input:</p>
      
      <h3>React</h3>
      <pre><code class="language-tsx">function CustomValueExample() {
  return (
    &lt;NativeSelect
      items={items}
      renderValue={(item) => (
        &lt;div className="selected-value"&gt;
          &lt;span className="emoji"&gt;{item.emoji}&lt;/span&gt;
          &lt;span className="label"&gt;{item.label}&lt;/span&gt;
          {item.badge && &lt;span className="badge"&gt;{item.badge}&lt;/span&gt;}
        &lt;/div&gt;
      )}
    /&gt;
  );
}</code></pre>

      <h3>Multi-Select Chip Rendering</h3>
      <pre><code class="language-tsx">function CustomChipExample() {
  return (
    &lt;NativeSelect
      mode="multi"
      items={items}
      renderChip={(item) => (
        &lt;div className="custom-chip"&gt;
          &lt;img src={item.icon} alt="" className="chip-icon" /&gt;
          &lt;span&gt;{item.label}&lt;/span&gt;
        &lt;/div&gt;
      )}
    /&gt;
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Rich Content Examples</h2>
      
      <h3>With Icons</h3>
      <pre><code class="language-tsx">const items = [
  { id: 1, label: 'Settings', icon: '⚙️' },
  { id: 2, label: 'Profile', icon: '👤' },
  { id: 3, label: 'Logout', icon: '🚪' }
];

&lt;NativeSelect
  items={items}
  renderOption={(item) => (
    &lt;div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}&gt;
      &lt;span style={{ fontSize: '20px' }}&gt;{item.icon}&lt;/span&gt;
      &lt;span&gt;{item.label}&lt;/span&gt;
    &lt;/div&gt;
  )}
/&gt;</code></pre>

      <h3>With Badges/Tags</h3>
      <pre><code class="language-tsx">const items = [
  { id: 1, label: 'React', tags: ['Frontend', 'Popular'] },
  { id: 2, label: 'Node.js', tags: ['Backend', 'JavaScript'] }
];

&lt;NativeSelect
  items={items}
  renderOption={(item) => (
    &lt;div className="option-with-tags"&gt;
      &lt;div className="option-label"&gt;{item.label}&lt;/div&gt;
      &lt;div className="option-tags"&gt;
        {item.tags.map(tag => (
          &lt;span key={tag} className="tag"&gt;{tag}&lt;/span&gt;
        ))}
      &lt;/div&gt;
    &lt;/div&gt;
  )}
/&gt;</code></pre>

      <h3>With Images</h3>
      <pre><code class="language-tsx">const products = [
  { id: 1, name: 'iPhone 15', price: '$999', image: '/products/iphone.jpg' },
  { id: 2, name: 'MacBook Pro', price: '$2499', image: '/products/macbook.jpg' }
];

&lt;NativeSelect
  items={products}
  renderOption={(item) => (
    &lt;div className="product-option"&gt;
      &lt;img src={item.image} alt={item.name} className="product-image" /&gt;
      &lt;div&gt;
        &lt;div className="product-name"&gt;{item.name}&lt;/div&gt;
        &lt;div className="product-price"&gt;{item.price}&lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  )}
/&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Security: HTML Escaping</h2>
      
      <p>Always escape user-provided content to prevent XSS attacks:</p>
      
      <pre><code class="language-javascript">// Escape function
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Usage in template
select.optionTemplate = (item) => \`
  &lt;div class="option"&gt;
    &lt;div class="title"&gt;\${escapeHtml(item.title)}&lt;/div&gt;
    &lt;div class="description"&gt;\${escapeHtml(item.description)}&lt;/div&gt;
  &lt;/div&gt;
\`;</code></pre>

      <h3>React (Auto-escaped)</h3>
      <p>React automatically escapes text content, so JSX is safe:</p>
      <pre><code class="language-tsx">// ✅ Safe - React escapes  automatically
renderOption={(item) => (
  &lt;div&gt;{item.userInput}&lt;/div&gt;
)}

// ⚠️ Dangerous - bypasses escaping
renderOption={(item) => (
  &lt;div dangerouslySetInnerHTML={{ __html: item.html }} /&gt;
)}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Styling Custom Options</h2>
      
      <pre><code class="language-css">/* Custom option layout */
.user-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 500;
  color: #1f2937;
}

.user-email {
  font-size: 12px;
  color: #6b7280;
}

/* Hover state */
.user-option:hover {
  background-color: #f3f4f6;
}

/* Selected state */
.user-option[aria-selected="true"] {
  background-color: #dbeafe;
}</code></pre>
    </div>
  `,
  
  'grouped-options': `
    <h1>Grouped Options</h1>
    
    <div class="doc-section">
      <h2>Overview</h2>
      <p>Grouped options organize items into categories with visual headers, making it easier for users to navigate large lists. Perfect for categorized data like file systems, product categories, or hierarchical selections.</p>
      
      <h3>Key Features</h3>
      <ul>
        <li>✅ Visual group headers with customizable styling</li>
        <li>✅ Collapsible groups (optional)</li>
        <li>✅ Group-level search filtering</li>
        <li>✅ Nested groups support</li>
        <li>✅ Custom group templates</li>
        <li>✅ ARIA semantics for accessibility</li>
      </ul>
    </div>
    
    <div class="doc-section">
      <h2>Basic Usage</h2>
      
      <h3>Object Format</h3>
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react';

function GroupedExample() {
  const groupedItems = {
    'Fruits': [
      { id: 1, label: 'Apple' },
      { id: 2, label: 'Banana' },
      { id: 3, label: 'Orange' }
    ],
    'Vegetables': [
      { id: 4, label: 'Carrot' },
      { id: 5, label: 'Broccoli' },
      { id: 6, label: 'Spinach' }
    ],
    'Grains': [
      { id: 7, label: 'Rice' },
      { id: 8, label: 'Wheat' }
    ]
  };
  
  return (
    &lt;NativeSelect
      grouped
      items={groupedItems}
    /&gt;
  );
}</code></pre>

      <h3>Array Format with Category Property</h3>
      <pre><code class="language-tsx">function CategoryGroupingExample() {
  const items = [
    { id: 1, label: 'Apple', category: 'Fruits' },
    { id: 2, label: 'Banana', category: 'Fruits' },
    { id: 3, label: 'Carrot', category: 'Vegetables' },
    { id: 4, label: 'Broccoli', category: 'Vegetables' }
  ];
  
  return (
    &lt;NativeSelect
      grouped
      groupBy="category"
      items={items}
    /&gt;
  );
}</code></pre>

      <h3>Custom Group Function</h3>
      <pre><code class="language-tsx">function CustomGroupingExample() {
  const items = [
    { id: 1, name: 'Alice', age: 25 },
    { id: 2, name: 'Bob', age: 35 },
    { id: 3, name: 'Charlie', age: 28 }
  ];
  
  const groupByAge = (item) => {
    if (item.age < 30) return 'Under 30';
    return '30 and older';
  };
  
  return (
    &lt;NativeSelect
      grouped
      groupBy={groupByAge}
      items={items}
    /&gt;
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Styling Group Headers</h2>
      
      <h3>Using Shadow Parts</h3>
      <pre><code class="language-css">/* Style group headers */
enhanced-select::part(group-header) {
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
  padding: 12px 16px 8px;
  background: linear-gradient(to bottom, #f9fafb, transparent);
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 1;
}

/* Different colors for different groups */
enhanced-select::part(group-header):nth-of-type(1) {
  color: #3b82f6;
}

enhanced-select::part(group-header):nth-of-type(2) {
  color: #10b981;
}

enhanced-select::part(group-header):nth-of-type(3) {
  color: #f59e0b;
}</code></pre>

      <h3>Using CSS Custom Properties</h3>
      <pre><code class="language-css">enhanced-select {
  --select-group-header-bg: #f3f4f6;
  --select-group-header-color: #374151;
  --select-group-header-padding: 12px 16px;
  --select-group-header-font-size: 14px;
  --select-group-header-font-weight: 600;
  --select-group-header-text-transform: uppercase;
  --select-group-header-border: 1px solid #e5e7eb;
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Custom Group Headers</h2>
      
      <h3>React</h3>
      <pre><code class="language-tsx">function CustomGroupHeaderExample() {
  const groupedItems = {
    'Fruits (3)': [...],
    'Vegetables (5)': [...]
  };
  
  return (
    &lt;NativeSelect
      grouped
      items={groupedItems}
      renderGroupHeader={(groupName, items) => (
        &lt;div className="custom-group-header"&gt;
          &lt;span className="group-icon"&gt;📁&lt;/span&gt;
          &lt;span className="group-name"&gt;{groupName}&lt;/span&gt;
          &lt;span className="group-count"&gt;{items.length}&lt;/span&gt;
        &lt;/div&gt;
      )}
    /&gt;
  );
}</code></pre>

      <h3>With Collapse/Expand</h3>
      <pre><code class="language-tsx">function CollapsibleGroupsExample() {
  const [collapsed, setCollapsed] = useState(new Set());
  
  const toggleGroup = (groupName) => {
    const newCollapsed = new Set(collapsed);
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName);
    } else {
      newCollapsed.add(groupName);
    }
    setCollapsed(newCollapsed);
  };
  
  return (
    &lt;NativeSelect
      grouped
      items={groupedItems}
      collapsedGroups={collapsed}
      onGroupToggle={toggleGroup}
      renderGroupHeader={(groupName, items, isCollapsed) => (
        &lt;div className="collapsible-group-header" onClick={() => toggleGroup(groupName)}&gt;
          &lt;span className="toggle-icon"&gt;{isCollapsed ? '▶' : '▼'}&lt;/span&gt;
          &lt;span&gt;{groupName}&lt;/span&gt;
          &lt;span className="count"&gt;({items.length})&lt;/span&gt;
        &lt;/div&gt;
      )}
    /&gt;
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Nested Groups</h2>
      
      <pre><code class="language-tsx">function NestedGroupsExample() {
  const items = [
    { id: 1, label: 'Apple', category: 'Produce', subcategory: 'Fruits' },
    { id: 2, label: 'Carrot', category: 'Produce', subcategory: 'Vegetables' },
    { id: 3, label: 'Milk', category: 'Dairy', subcategory: 'Beverages' }
  ];
  
  return (
    &lt;NativeSelect
      grouped
      groupBy={(item) => \`\${item.category} > \${item.subcategory}\`}
      items={items}
    /&gt;
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Group Filtering with Search</h2>
      
      <p>When combined with search, groups automatically hide when all their items are filtered out:</p>
      
      <pre><code class="language-tsx">function SearchableGroupedExample() {
  return (
    &lt;NativeSelect
      grouped
      searchable
      items={groupedItems}
      searchableGroupHeaders={true}  // Also search group names
    /&gt;
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Accessibility</h2>
      
      <h3>ARIA Attributes</h3>
      <p>Grouped options automatically include proper ARIA structure:</p>
      <ul>
        <li><code>role="group"</code> on each group</li>
        <li><code>aria-label</code> with group name</li>
        <li><code>role="presentation"</code> on group headers</li>
      </ul>
      
      <h3>Example Output</h3>
      <pre><code class="language-html">&lt;div role="listbox"&gt;
  &lt;div role="presentation" class="group-header"&gt;Fruits&lt;/div&gt;
  &lt;div role="group" aria-label="Fruits"&gt;
    &lt;div role="option"&gt;Apple&lt;/div&gt;
    &lt;div role="option"&gt;Banana&lt;/div&gt;
  &lt;/div&gt;
  &lt;div role="presentation" class="group-header"&gt;Vegetables&lt;/div&gt;
  &lt;div role="group" aria-label="Vegetables"&gt;
    &lt;div role="option"&gt;Carrot&lt;/div&gt;
  &lt;/div&gt;
&lt;/div&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Complete Example</h2>
      
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react';
import { useState } from 'react';

function ComprehensiveGroupedExample() {
  const [collapsed, setCollapsed] = useState(new Set());
  
  const items = [
    // Frontend
    { id: 1, label: 'React', category: 'Frontend', icon: '⚛️', popularity: 'High' },
    { id: 2, label: 'Vue', category: 'Frontend', icon: '💚', popularity: 'High' },
    { id: 3, label: 'Svelte', category: 'Frontend', icon: '🔥', popularity: 'Medium' },
    // Backend
    { id: 4, label: 'Node.js', category: 'Backend', icon: '🟢', popularity: 'High' },
    { id: 5, label: 'Python', category: 'Backend', icon: '🐍', popularity: 'High' },
    { id: 6, label: 'Go', category: 'Backend', icon: '🔵', popularity: 'Medium' },
    // Database
    { id: 7, label: 'PostgreSQL', category: 'Database', icon: '🐘', popularity: 'High' },
    { id: 8, label: 'MongoDB', category: 'Database', icon: '🍃', popularity: 'High' }
  ];
  
  const toggleGroup = (groupName) => {
    const newCollapsed = new Set(collapsed);
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName);
    } else {
      newCollapsed.add(groupName);
    }
    setCollapsed(newCollapsed);
  };
  
  return (
    &lt;div&gt;
      &lt;NativeSelect
        grouped
        searchable
        groupBy="category"
        items={items}
        collapsedGroups={collapsed}
        onGroupToggle={toggleGroup}
        renderGroupHeader={(groupName, groupItems, isCollapsed) => (
          &lt;div 
            className="group-header"
            onClick={() => toggleGroup(groupName)}
          &gt;
            &lt;span className="toggle"&gt;{isCollapsed ? '▶' : '▼'}&lt;/span&gt;
            &lt;span className="name"&gt;{groupName}&lt;/span&gt;
            &lt;span className="count"&gt;{groupItems.length}&lt;/span&gt;
          &lt;/div&gt;
        )}
        renderOption={(item) => (
          &lt;div className="tech-option"&gt;
            &lt;span className="icon"&gt;{item.icon}&lt;/span&gt;
            &lt;span className="label"&gt;{item.label}&lt;/span&gt;
            &lt;span className={\`popularity \${item.popularity.toLowerCase()}\`}&gt;
              {item.popularity}
            &lt;/span&gt;
          &lt;/div&gt;
        )}
      /&gt;
      
      &lt;style jsx&gt;{\`
        .group-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          color: #6b7280;
          background: #f9fafb;
          cursor: pointer;
          user-select: none;
        }
        
        .group-header:hover {
          background: #f3f4f6;
        }
        
        .tech-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 24px;
        }
        
        .icon {
          font-size: 20px;
        }
        
        .popularity {
          margin-left: auto;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 500;
        }
        
        .popularity.high {
          background: #dcfce7;
          color: #166534;
        }
        
        .popularity.medium {
          background: #fef3c7;
          color: #92400e;
        }
      \`}&lt;/style&gt;
    &lt;/div&gt;
  );
}</code></pre>
    </div>
  `,
  
  'css-tokens': `
    <h1>CSS Custom Properties (Tokens)</h1>
    
    <div class="doc-section">
      <h2>Overview</h2>
      <p>Smilodon provides 100+ CSS custom properties for complete visual customization. These tokens control colors, spacing, typography, animations, and more.</p>
    </div>
    
    <div class="doc-section">
      <h2>Core Theme Tokens</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--select-primary-color</code></td>
            <td>#3b82f6</td>
            <td>Primary accent color (focus, hover, selected)</td>
          </tr>
          <tr>
            <td><code>--select-bg-color</code></td>
            <td>#ffffff</td>
            <td>Background color</td>
          </tr>
          <tr>
            <td><code>--select-text-color</code></td>
            <td>#1f2937</td>
            <td>Primary text color</td>
          </tr>
          <tr>
            <td><code>--select-border-color</code></td>
            <td>#d1d5db</td>
            <td>Border color</td>
          </tr>
          <tr>
            <td><code>--select-border-radius</code></td>
            <td>8px</td>
            <td>Border radius for rounded corners</td>
          </tr>
          <tr>
            <td><code>--select-shadow</code></td>
            <td>0 4px 6px rgba(0,0,0,0.1)</td>
            <td>Box shadow</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Input Shell Tokens</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--select-input-height</code></td>
            <td>48px</td>
            <td>Input container height</td>
          </tr>
          <tr>
            <td><code>--select-input-padding</code></td>
            <td>12px 16px</td>
            <td>Input padding</td>
          </tr>
          <tr>
            <td><code>--select-input-font-size</code></td>
            <td>16px</td>
            <td>Input text size</td>
          </tr>
          <tr>
            <td><code>--select-input-font-weight</code></td>
            <td>400</td>
            <td>Input text weight</td>
          </tr>
          <tr>
            <td><code>--select-placeholder-color</code></td>
            <td>#9ca3af</td>
            <td>Placeholder text color</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Dropdown Tokens</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--select-dropdown-bg</code></td>
            <td>#ffffff</td>
            <td>Dropdown background</td>
          </tr>
          <tr>
            <td><code>--select-dropdown-max-height</code></td>
            <td>320px</td>
            <td>Maximum dropdown height</td>
          </tr>
          <tr>
            <td><code>--select-dropdown-shadow</code></td>
            <td>0 10px 20px rgba(0,0,0,0.15)</td>
            <td>Dropdown shadow</td>
          </tr>
          <tr>
            <td><code>--select-dropdown-border-radius</code></td>
            <td>8px</td>
            <td>Dropdown border radius</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Option Tokens</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--select-option-padding</code></td>
            <td>12px 16px</td>
            <td>Option padding</td>
          </tr>
          <tr>
            <td><code>--select-option-hover-bg</code></td>
            <td>#f3f4f6</td>
            <td>Option hover background</td>
          </tr>
          <tr>
            <td><code>--select-option-selected-bg</code></td>
            <td>#dbeafe</td>
            <td>Selected option background</td>
          </tr>
          <tr>
            <td><code>--select-option-selected-color</code></td>
            <td>#1e40af</td>
            <td>Selected option text color</td>
          </tr>
          <tr>
            <td><code>--select-option-disabled-opacity</code></td>
            <td>0.5</td>
            <td>Disabled option opacity</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Badge/Chip Tokens (Multi-Select)</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--select-badge-bg</code></td>
            <td>#3b82f6</td>
            <td>Chip background</td>
          </tr>
          <tr>
            <td><code>--select-badge-color</code></td>
            <td>#ffffff</td>
            <td>Chip text color</td>
          </tr>
          <tr>
            <td><code>--select-badge-padding</code></td>
            <td>4px 8px</td>
            <td>Chip padding</td>
          </tr>
          <tr>
            <td><code>--select-badge-border-radius</code></td>
            <td>4px</td>
            <td>Chip border radius</td>
          </tr>
          <tr>
            <td><code>--select-badge-gap</code></td>
            <td>4px</td>
            <td>Gap between chips</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Usage Examples</h2>
      
      <h3>Basic Theme Customization</h3>
      <pre><code class="language-css">enhanced-select {
  --select-primary-color: #10b981;
  --select-bg-color: #ffffff;
  --select-text-color: #111827;
  --select-border-color: #e5e7eb;
  --select-border-radius: 12px;
}</code></pre>

      <h3>Dark Mode</h3>
      <pre><code class="language-css">@media (prefers-color-scheme: dark) {
  enhanced-select {
    --select-bg-color: #1f2937;
    --select-text-color: #f9fafb;
    --select-border-color: #374151;
    --select-dropdown-bg: #111827;
    --select-option-hover-bg: #374151;
  }
}</code></pre>

      <h3>Compact Size</h3>
      <pre><code class="language-css">.compact enhanced-select {
  --select-input-height: 36px;
  --select-input-padding: 8px 12px;
  --select-input-font-size: 14px;
  --select-option-padding: 8px 12px;
}</code></pre>
    </div>
  `,
  
  'shadow-parts': `
    <h1>Shadow Parts</h1>
    
    <div class="doc-section">
      <h2>Available Parts</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Part</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>trigger</code></td>
            <td>Main button/input area</td>
          </tr>
          <tr>
            <td><code>dropdown</code></td>
            <td>Dropdown container</td>
          </tr>
          <tr>
            <td><code>option</code></td>
            <td>Individual option</td>
          </tr>
          <tr>
            <td><code>chip</code></td>
            <td>Selected chip in multi-select</td>
          </tr>
          <tr>
            <td><code>group-header</code></td>
            <td>Group header in grouped mode</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Usage</h2>
      <pre><code class="language-css">enhanced-select::part(trigger) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

enhanced-select::part(option):hover {
  background-color: rgba(59, 130, 246, 0.1);
}</code></pre>
    </div>
  `,
  
  methods: `
    <h1>Methods</h1>
    
    <div class="doc-section">
      <h2>Programmatic Control</h2>
      
      <h3>open()</h3>
      <p>Open the dropdown programmatically:</p>
      <pre><code class="language-tsx">const selectRef = useRef();
selectRef.current.open();</code></pre>
      
      <h3>close()</h3>
      <p>Close the dropdown:</p>
      <pre><code class="language-tsx">selectRef.current.close();</code></pre>
      
      <h3>clear()</h3>
      <p>Clear current selection:</p>
      <pre><code class="language-tsx">selectRef.current.clear();</code></pre>
      
      <h3>setItems(items)</h3>
      <p>Update items programmatically:</p>
      <pre><code class="language-tsx">selectRef.current.setItems(newItems);</code></pre>
      
      <h3>focus()</h3>
      <p>Focus the select:</p>
      <pre><code class="language-tsx">selectRef.current.focus();</code></pre>
    </div>
  `,
  
  events: `
    <h1>Events</h1>
    
    <div class="doc-section">
      <h2>Overview</h2>
      <p>Smilodon dispatches custom events at key interaction points. All events bubble and can be listened to using standard addEventListener.</p>
    </div>
    
    <div class="doc-section">
      <h2>Event Reference</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Payload</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>select</code></td>
            <td><code>{ selectedIndices: number[], selectedItems: any[] }</code></td>
            <td>Fired when selection changes</td>
          </tr>
          <tr>
            <td><code>search</code></td>
            <td><code>{ query: string }</code></td>
            <td>Fired when search input changes (debounced)</td>
          </tr>
          <tr>
            <td><code>open</code></td>
            <td><code>{ isOpen: true }</code></td>
            <td>Fired when dropdown opens</td>
          </tr>
          <tr>
            <td><code>close</code></td>
            <td><code>{ isOpen: false }</code></td>
            <td>Fired when dropdown closes</td>
          </tr>
          <tr>
            <td><code>clear</code></td>
            <td><code>{}</code></td>
            <td>Fired when clear button is clicked</td>
          </tr>
          <tr>
            <td><code>loadmore</code></td>
            <td><code>{ page: number, pageSize: number }</code></td>
            <td>Fired when infinite scroll reaches threshold</td>
          </tr>
          <tr>
            <td><code>chip-remove</code></td>
            <td><code>{ removedItem: any, removedIndex: number }</code></td>
            <td>Fired when a chip is removed (multi-select)</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Event Timing & Lifecycle</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Timing</th>
            <th>Cancelable</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>select</code></td>
            <td>After selection updates</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>search</code></td>
            <td>After debounce period (default 300ms)</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>open</code></td>
            <td>Before dropdown animation starts</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>close</code></td>
            <td>After dropdown closes (animation complete)</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>loadmore</code></td>
            <td>When scroll position reaches threshold</td>
            <td>No</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Usage Examples</h2>
      
      <h3>Vanilla JavaScript</h3>
      <pre><code class="language-javascript">const select = document.querySelector('enhanced-select');

// Selection change
select.addEventListener('select', (e) => {
  console.log('Selected:', e.detail.selectedItems);
  console.log('Indices:', e.detail.selectedIndices);
});

// Search
select.addEventListener('search', (e) => {
  console.log('Search query:', e.detail.query);
  // Fetch remote data
  fetchResults(e.detail.query);
});

// Dropdown open/close
select.addEventListener('open', () => {
  console.log('Dropdown opened');
});

select.addEventListener('close', () => {
  console.log('Dropdown closed');
});</code></pre>

      <h3>React</h3>
      <pre><code class="language-jsx">import { EnhancedSelect } from '@smilodon/react';

function MyComponent() {
  const handleSelect = (e) => {
    console.log('Selected:', e.detail.selectedItems);
  };
  
  const handleSearch = async (e) => {
    const results = await fetchData(e.detail.query);
    setItems(results);
  };

  return (
    &lt;EnhancedSelect
      items={items}
      onSelect={handleSelect}
      onSearch={handleSearch}
      onOpen={() => console.log('opened')}
      onClose={() => console.log('closed')}
    /&gt;
  );
}</code></pre>

      <h3>Vue.js</h3>
      <pre><code class="language-javascript">&lt;template&gt;
  &lt;EnhancedSelect
    :items="items"
    @select="handleSelect"
    @search="handleSearch"
    @open="onOpen"
    @close="onClose"
  /&gt;
&lt;/template&gt;

&lt;script&gt;
export default {
  methods: {
    handleSelect(e) {
      console.log('Selected:', e.detail.selectedItems);
    },
    handleSearch(e) {
      this.fetchData(e.detail.query);
    }
  }
}
&lt;/script&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Event Delegation Pattern</h2>
      <pre><code class="language-javascript">// Listen to all select events from a container
document.addEventListener('select', (e) => {
  if (e.target.tagName === 'ENHANCED-SELECT') {
    const selectId = e.target.id;
    console.log(\`Selection changed in \${selectId}\`, e.detail);
  }
});</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Error Handling</h2>
      <pre><code class="language-javascript">select.addEventListener('loadmore', async (e) => {
  try {
    const data = await fetchPage(e.detail.page);
    select.appendItems(data);
  } catch (error) {
    console.error('Failed to load more:', error);
    // Show error UI
    showErrorMessage('Failed to load more items');
  }
});

select.addEventListener('search', async (e) => {
  try {
    const results = await searchAPI(e.detail.query);
    select.items = results;
  } catch (error) {
    console.error('Search failed:', error);
    select.items = [];
  }
});</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Complete Example with All Events</h2>
      <pre><code class="language-javascript">const select = document.querySelector('#my-select');

// Track selection state
select.addEventListener('select', (e) => {
  const { selectedItems, selectedIndices } = e.detail;
  updateUI(selectedItems);
  saveToLocalStorage(selectedIndices);
});

// Remote search
let searchController = null;
select.addEventListener('search', async (e) => {
  // Cancel previous request
  if (searchController) {
    searchController.abort();
  }
  
  searchController = new AbortController();
  
  try {
    const results = await fetch(\`/api/search?q=\${e.detail.query}\`, {
      signal: searchController.signal
    });
    select.items = await results.json();
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Search failed:', err);
    }
  }
});

// Analytics tracking
select.addEventListener('open', () => {
  analytics.track('select_opened');
});

select.addEventListener('close', () => {
  analytics.track('select_closed');
});

// Infinite scroll
select.addEventListener('loadmore', async (e) => {
  const newItems = await fetchPage(e.detail.page);
  select.appendItems(newItems);
});</code></pre>
    </div>
  `,
  
  types: `
    <h1>TypeScript Types</h1>
    
    <div class="doc-section">
      <h2>Core Types</h2>
      
      <pre><code class="language-typescript">interface SelectItem {
  id: string | number;
  label: string;
  value?: any;
  disabled?: boolean;
  [key: string]: any;
}

interface SelectProps {
  items: SelectItem[];
  mode?: 'single' | 'multi';
  searchable?: boolean;
  virtualized?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onSelect?: (event: SelectEvent) => void;
  onSearch?: (event: SearchEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

interface SelectEvent {
  indices: number[];
  items: SelectItem[];
}

interface SearchEvent {
  query: string;
}</code></pre>
    </div>
  `,
  
  migration: `
    <h1>Migration Guide</h1>
    
    <div class="doc-section">
      <h2>From react-select</h2>
      
      <h3>Before (react-select)</h3>
      <pre><code class="language-tsx">import Select from 'react-select';

&lt;Select
  options={options}
  onChange={(option) => setValue(option)}
/&gt;</code></pre>
      
      <h3>After (Smilodon)</h3>
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react';

&lt;NativeSelect
  items={items}
  onSelect={({ items }) => setValue(items[0])}
/&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Key Differences</h2>
      <ul>
        <li><code>options</code> → <code>items</code></li>
        <li><code>onChange</code> → <code>onSelect</code></li>
        <li><code>isMulti</code> → <code>mode="multi"</code></li>
        <li><code>isDisabled</code> → <code>disabled</code></li>
      </ul>
    </div>
  `,
  
  limitations: `
    <h1>Known Limitations</h1>
    
    <div class="doc-section">
      <h2>Current Limitations</h2>
      
      <h3>1. Server-Side Rendering</h3>
      <p>The Web Component requires a browser environment. For SSR frameworks:</p>
      <ul>
        <li>Mount the component only on the client side</li>
        <li>Use dynamic imports or conditional rendering</li>
        <li>See framework-specific guides for details</li>
      </ul>
      
      <h3>2. Internet Explorer Support</h3>
      <p>IE11 is not supported. Minimum browser versions:</p>
      <ul>
        <li>Chrome 90+</li>
        <li>Firefox 88+</li>
        <li>Safari 14+</li>
        <li>Edge 90+</li>
      </ul>
      
      <h3>3. Touch Device Considerations</h3>
      <p>Some interactions optimized for pointer devices. Mobile-specific features are in development.</p>
    </div>
  `,
  
  solid: `
    <h1>SolidJS Integration</h1>
    
    <div class="doc-section">
      <h2>Installation</h2>
      <pre><code class="language-bash">npm install @smilodon/core @smilodon/solid</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Basic Usage</h2>
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/solid';
import { createSignal } from 'solid-js';

function App() {
  const [selected, setSelected] = createSignal(null);
  const items = [
    { id: 1, label: 'Option 1' },
    { id: 2, label: 'Option 2' }
  ];
  
  return (
    &lt;NativeSelect
      items={items}
      onSelect={({ items }) => setSelected(items[0])}
    /&gt;
  );
}</code></pre>
    </div>
  `,
  
  vanilla: `
    <h1>Vanilla JS Integration</h1>
    
    <div class="doc-section">
      <h2>Direct DOM Usage</h2>
      <pre><code class="language-html">&lt;enhanced-select id="mySelect"&gt;&lt;/enhanced-select&gt;

&lt;script type="module"&gt;
  import { NativeSelectElement } from '@smilodon/core';
  
  const select = document.getElementById('mySelect');
  
  select.items = [
    { id: 1, label: 'Option 1' },
    { id: 2, label: 'Option 2' }
  ];
  
  select.addEventListener('select', (e) => {
    console.log('Selected:', e.detail.items);
  });
&lt;/script&gt;</code></pre>
    </div>
  `,
  
  'react-native': `
    <h1>React Native Integration</h1>
    
    <div class="doc-section">
      <h2>Installation</h2>
      <pre><code class="language-bash">npm install @smilodon/core @smilodon/react-native</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Usage</h2>
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react-native';

function App() {
  const items = [
    { id: 1, label: 'Option 1' },
    { id: 2, label: 'Option 2' }
  ];
  
  return (
    &lt;NativeSelect
      items={items}
      onSelect={({ items }) => console.log(items)}
      style={styles.select}
    /&gt;
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Platform-Specific Features</h2>
      <ul>
        <li>Native picker on iOS/Android</li>
        <li>Web fallback for React Native Web</li>
        <li>Platform-specific styling</li>
        <li>Gesture handling</li>
      </ul>
    </div>
  `,
  
  'dark-mode': `
    <h1>Dark Mode</h1>
    
    <div class="doc-section">
      <h2>Automatic Detection</h2>
      <p>Smilodon automatically adapts to system dark mode preference:</p>
      
      <pre><code class="language-css">@media (prefers-color-scheme: dark) {
  enhanced-select {
    --select-bg-color: #1f2937;
    --select-text-color: #f9fafb;
    --select-border-color: #374151;
  }
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Manual Toggle</h2>
      <p>Implement your own dark mode toggle:</p>
      
      <pre><code class="language-tsx">const [isDark, setIsDark] = useState(false);

&lt;div data-theme={isDark ? 'dark' : 'light'}&gt;
  &lt;NativeSelect items={items} /&gt;
&lt;/div&gt;</code></pre>
      
      <pre><code class="language-css">[data-theme="dark"] enhanced-select {
  --select-bg-color: #1f2937;
  --select-text-color: #f9fafb;
}</code></pre>
    </div>
  `,
  
  animations: `
    <h1>Animations & Motion</h1>
    
    <div class="doc-section">
      <h2>Overview</h2>
      <p>Smilodon includes performant, accessible animations with automatic reduced-motion support. All animations use GPU-accelerated properties (transform, opacity) for 60fps performance.</p>
    </div>
    
    <div class="doc-section">
      <h2>Built-in Animations</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Animation</th>
            <th>Duration</th>
            <th>Easing</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Dropdown Open</td>
            <td>200ms</td>
            <td>ease-out</td>
            <td>Fade in + slide down</td>
          </tr>
          <tr>
            <td>Dropdown Close</td>
            <td>150ms</td>
            <td>ease-in</td>
            <td>Fade out + slide up</td>
          </tr>
          <tr>
            <td>Option Hover</td>
            <td>100ms</td>
            <td>ease-out</td>
            <td>Background color transition</td>
          </tr>
          <tr>
            <td>Chip Add</td>
            <td>200ms</td>
            <td>cubic-bezier</td>
            <td>Scale + fade in</td>
          </tr>
          <tr>
            <td>Chip Remove</td>
            <td>150ms</td>
            <td>ease-in</td>
            <td>Scale down + fade out</td>
          </tr>
          <tr>
            <td>Clear Button</td>
            <td>200ms</td>
            <td>ease-out</td>
            <td>Rotate + fade</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Animation Tokens</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--select-animation-duration</code></td>
            <td>200ms</td>
            <td>Dropdown animation duration</td>
          </tr>
          <tr>
            <td><code>--select-animation-easing</code></td>
            <td>ease-out</td>
            <td>Animation timing function</td>
          </tr>
          <tr>
            <td><code>--select-transition-duration</code></td>
            <td>150ms</td>
            <td>Transition duration for interactive elements</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Custom Animations</h2>
      
      <h3>Custom Dropdown Animation</h3>
      <pre><code class="language-css">enhanced-select::part(dropdown) {
  animation: customSlideIn var(--select-animation-duration) ease-out;
}

@keyframes customSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}</code></pre>

      <h3>Bounce Animation for Options</h3>
      <pre><code class="language-css">enhanced-select::part(option)[data-sm-state~="selected"] {
  animation: bounceIn 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}</code></pre>

      <h3>Slide from Side</h3>
      <pre><code class="language-css">enhanced-select::part(dropdown) {
  animation: slideFromRight 300ms ease-out;
}

@keyframes slideFromRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Performance Considerations</h2>
      
      <h3>GPU Acceleration</h3>
      <p>Always prefer GPU-accelerated properties:</p>
      <pre><code class="language-css">/* ✅ Good - GPU accelerated */
.dropdown {
  transform: translateY(10px);
  opacity: 0;
}

/* ❌ Bad - Triggers layout/paint */
.dropdown {
  top: 10px;
  visibility: hidden;
}</code></pre>

      <h3>Will-Change Hint</h3>
      <pre><code class="language-css">enhanced-select::part(dropdown) {
  will-change: transform, opacity;
}

/* Remove after animation completes */
enhanced-select::part(dropdown)[data-state="open"] {
  will-change: auto;
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Reduced Motion</h2>
      <p>Smilodon automatically respects user preferences for reduced motion:</p>
      
      <pre><code class="language-css">/* Built-in support */
@media (prefers-reduced-motion: reduce) {
  enhanced-select * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}</code></pre>

      <h3>Custom Implementation</h3>
      <pre><code class="language-css">@media (prefers-reduced-motion: reduce) {
  enhanced-select::part(dropdown) {
    animation: none;
    transition: none;
  }
  
  /* Still show instant state changes */
  enhanced-select::part(dropdown)[data-state="open"] {
    opacity: 1;
    display: block;
  }
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Animation Timing Functions</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Function</th>
            <th>Use Case</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>ease-out</code></td>
            <td>Elements entering</td>
            <td>Dropdown opening</td>
          </tr>
          <tr>
            <td><code>ease-in</code></td>
            <td>Elements exiting</td>
            <td>Dropdown closing</td>
          </tr>
          <tr>
            <td><code>ease-in-out</code></td>
            <td>Smooth transitions</td>
            <td>State changes</td>
          </tr>
          <tr>
            <td><code>cubic-bezier(0.68, -0.55, 0.265, 1.55)</code></td>
            <td>Playful bounce</td>
            <td>Chip animations</td>
          </tr>
          <tr>
            <td><code>cubic-bezier(0.4, 0, 0.2, 1)</code></td>
            <td>Material Design</td>
            <td>Standard motion</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Complete Animated Example</h2>
      <pre><code class="language-css">/* Themed animations */
enhanced-select {
  --select-animation-duration: 250ms;
  --select-animation-easing: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dropdown */
enhanced-select::part(dropdown) {
  animation: dropdownOpen var(--select-animation-duration) var(--select-animation-easing);
}

@keyframes dropdownOpen {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Options cascade in */
enhanced-select::part(option) {
  animation: optionFadeIn 200ms ease-out backwards;
}

enhanced-select::part(option):nth-child(1) { animation-delay: 0ms; }
enhanced-select::part(option):nth-child(2) { animation-delay: 30ms; }
enhanced-select::part(option):nth-child(3) { animation-delay: 60ms; }
enhanced-select::part(option):nth-child(4) { animation-delay: 90ms; }

@keyframes optionFadeIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Chips */
enhanced-select::part(chip) {
  animation: chipBounce 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes chipBounce {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Reduced motion override */
@media (prefers-reduced-motion: reduce) {
  enhanced-select *,
  enhanced-select::part(*) {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}</code></pre>
    </div>
  `,
};

// Export for use in navigation.js
window.documentationContent = documentationContent;
