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
      <h2>Common Props</h2>
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
            <td><code>Array</code></td>
            <td><code>[]</code></td>
            <td>Array of options to display</td>
          </tr>
          <tr>
            <td><code>mode</code></td>
            <td><code>'single' | 'multi'</code></td>
            <td><code>'single'</code></td>
            <td>Selection mode</td>
          </tr>
          <tr>
            <td><code>searchable</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>Enable search input</td>
          </tr>
          <tr>
            <td><code>virtualized</code></td>
            <td><code>boolean</code></td>
            <td><code>auto</code></td>
            <td>Enable virtualization</td>
          </tr>
          <tr>
            <td><code>placeholder</code></td>
            <td><code>string</code></td>
            <td><code>'Select...'</code></td>
            <td>Placeholder text</td>
          </tr>
          <tr>
            <td><code>disabled</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>Disable the select</td>
          </tr>
          <tr>
            <td><code>clearable</code></td>
            <td><code>boolean</code></td>
            <td><code>true</code></td>
            <td>Show clear button</td>
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
            <td><code>{ indices, items }</code></td>
            <td>Fired when selection changes</td>
          </tr>
          <tr>
            <td><code>onSearch</code></td>
            <td><code>{ query }</code></td>
            <td>Fired when search input changes</td>
          </tr>
          <tr>
            <td><code>onOpen</code></td>
            <td><code>{}</code></td>
            <td>Fired when dropdown opens</td>
          </tr>
          <tr>
            <td><code>onClose</code></td>
            <td><code>{}</code></td>
            <td>Fired when dropdown closes</td>
          </tr>
          <tr>
            <td><code>onClear</code></td>
            <td><code>{}</code></td>
            <td>Fired when selection is cleared</td>
          </tr>
        </tbody>
      </table>
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
    <h1>Multi-Select</h1>
    
    <div class="doc-section">
      <h2>Overview</h2>
      <p>Multi-select mode allows users to choose multiple options. Selected items appear as chips/badges.</p>
      
      <h3>Basic Example</h3>
      <pre><code class="language-tsx">&lt;NativeSelect
  mode="multi"
  items={items}
  onSelect={({ items }) => console.log('Selected:', items)}
/&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Features</h2>
      <ul>
        <li>Selected items displayed as removable chips</li>
        <li>Dropdown stays open for multiple selections</li>
        <li>Individual chip removal or clear all button</li>
        <li>Selection limits (optional)</li>
        <li>Bulk operations support</li>
      </ul>
    </div>
  `,
  
  searchable: `
    <h1>Searchable</h1>
    
    <div class="doc-section">
      <h2>Local Search</h2>
      <p>Filter options based on user input:</p>
      
      <pre><code class="language-tsx">&lt;NativeSelect
  searchable
  items={items}
  searchPlaceholder="Search options..."
/&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Remote Search</h2>
      <p>Load options from an API:</p>
      
      <pre><code class="language-tsx">&lt;NativeSelect
  searchable
  onSearch={async ({ query }) => {
    const results = await fetchOptions(query);
    setItems(results);
  }}
/&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Search Options</h2>
      <ul>
        <li>Debounce delay (default: 300ms)</li>
        <li>Minimum query length</li>
        <li>Case-sensitive matching (optional)</li>
        <li>Custom search algorithm</li>
      </ul>
    </div>
  `,
  
  virtualization: `
    <h1>Virtualization</h1>
    
    <div class="doc-section">
      <h2>What is Virtualization?</h2>
      <p>Virtualization renders only the items visible in the viewport, plus a buffer. This dramatically improves performance for large datasets.</p>
      
      <h3>When to Use</h3>
      <ul>
        <li>Lists with 100+ items</li>
        <li>Performance-critical applications</li>
        <li>Mobile devices with limited resources</li>
        <li>Real-time data updates</li>
      </ul>
    </div>
    
    <div class="doc-section">
      <h2>Configuration</h2>
      <pre><code class="language-tsx">&lt;NativeSelect
  virtualized={true}
  itemHeight={40}
  bufferSize={5}
  items={largeDataset}
/&gt;</code></pre>
      
      <h3>Options</h3>
      <ul>
        <li><code>virtualized</code>: Enable/disable (auto by default)</li>
        <li><code>itemHeight</code>: Height of each item in pixels</li>
        <li><code>bufferSize</code>: Number of items to render outside viewport</li>
      </ul>
    </div>
  `,
  
  'infinite-scroll': `
    <h1>Infinite Scroll</h1>
    
    <div class="doc-section">
      <h2>Load More on Scroll</h2>
      <p>Automatically load more items as the user scrolls:</p>
      
      <pre><code class="language-tsx">&lt;NativeSelect
  items={items}
  onLoadMore={async () => {
    const moreItems = await fetchNextPage();
    setItems([...items, ...moreItems]);
  }}
  hasMore={hasMore}
  loading={loading}
/&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Configuration</h2>
      <ul>
        <li><code>threshold</code>: Distance from bottom to trigger load (px or %)</li>
        <li><code>hasMore</code>: Whether more items are available</li>
        <li><code>loading</code>: Show loading indicator</li>
        <li><code>loadingText</code>: Custom loading message</li>
      </ul>
    </div>
  `,
  
  'custom-render': `
    <h1>Custom Rendering</h1>
    
    <div class="doc-section">
      <h2>Custom Option Template</h2>
      <p>Render options with custom HTML/components:</p>
      
      <h3>React</h3>
      <pre><code class="language-tsx">&lt;NativeSelect
  items={items}
  renderOption={(item) => (
    &lt;div className="custom-option"&gt;
      &lt;img src={item.avatar} alt="" /&gt;
      &lt;div&gt;
        &lt;strong&gt;{item.label}&lt;/strong&gt;
        &lt;small&gt;{item.description}&lt;/small&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  )}
/&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Custom Value Display</h2>
      <p>Customize how selected value appears:</p>
      
      <pre><code class="language-tsx">&lt;NativeSelect
  items={items}
  renderValue={(item) => (
    &lt;span&gt;{item.emoji} {item.label}&lt;/span&gt;
  )}
/&gt;</code></pre>
    </div>
  `,
  
  'grouped-options': `
    <h1>Grouped Options</h1>
    
    <div class="doc-section">
      <h2>Group Items by Category</h2>
      <p>Organize options into groups with headers:</p>
      
      <pre><code class="language-tsx">const groupedItems = {
  'Fruits': [
    { id: 1, label: 'Apple' },
    { id: 2, label: 'Banana' }
  ],
  'Vegetables': [
    { id: 3, label: 'Carrot' },
    { id: 4, label: 'Broccoli' }
  ]
};

&lt;NativeSelect grouped items={groupedItems} /&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Styling Groups</h2>
      <pre><code class="language-css">enhanced-select::part(group-header) {
  font-weight: bold;
  color: var(--primary-color);
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.05);
}</code></pre>
    </div>
  `,
  
  'css-tokens': `
    <h1>CSS Custom Properties</h1>
    
    <div class="doc-section">
      <h2>Available Tokens</h2>
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
            <td>Primary accent color</td>
          </tr>
          <tr>
            <td><code>--select-bg-color</code></td>
            <td>#ffffff</td>
            <td>Background color</td>
          </tr>
          <tr>
            <td><code>--select-text-color</code></td>
            <td>#1f2937</td>
            <td>Text color</td>
          </tr>
          <tr>
            <td><code>--select-border-radius</code></td>
            <td>8px</td>
            <td>Border radius</td>
          </tr>
          <tr>
            <td><code>--select-shadow</code></td>
            <td>0 4px 6px rgba(0,0,0,0.1)</td>
            <td>Box shadow</td>
          </tr>
        </tbody>
      </table>
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
      <h2>Event Reference</h2>
      
      <h3>onSelect</h3>
      <p>Fired when selection changes</p>
      <pre><code class="language-tsx">onSelect={({ indices, items }) => {
  console.log('Selected indices:', indices);
  console.log('Selected items:', items);
}}</code></pre>
      
      <h3>onSearch</h3>
      <p>Fired when search input changes</p>
      <pre><code class="language-tsx">onSearch={({ query }) => {
  console.log('Search query:', query);
}}</code></pre>
      
      <h3>onOpen / onClose</h3>
      <p>Fired when dropdown opens/closes</p>
      <pre><code class="language-tsx">onOpen={() => console.log('Opened')}
onClose={() => console.log('Closed')}</code></pre>
      
      <h3>onClear</h3>
      <p>Fired when selection is cleared</p>
      <pre><code class="language-tsx">onClear={() => console.log('Cleared')}</code></pre>
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
      <h2>Built-in Animations</h2>
      <p>Smilodon includes smooth animations for:</p>
      <ul>
        <li>Dropdown open/close</li>
        <li>Option hover effects</li>
        <li>Selection changes</li>
        <li>Chip removal in multi-select</li>
      </ul>
    </div>
    
    <div class="doc-section">
      <h2>Custom Animations</h2>
      <pre><code class="language-css">enhanced-select::part(dropdown) {
  animation: slideDown 200ms ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Reduced Motion</h2>
      <p>Respects user preference for reduced motion:</p>
      <pre><code class="language-css">@media (prefers-reduced-motion: reduce) {
  enhanced-select * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}</code></pre>
    </div>
  `,
};

// Export for use in navigation.js
window.documentationContent = documentationContent;
