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
    <h1>Styling Guide</h1>
    
    <div class="doc-section">
      <h2>CSS Custom Properties</h2>
      <p>Smilodon uses CSS custom properties for easy theming:</p>
      
      <pre><code class="language-css">:root {
  /* Colors */
  --select-primary-color: #3b82f6;
  --select-bg-color: #ffffff;
  --select-text-color: #1f2937;
  --select-border-color: #d1d5db;
  
  /* Sizing */
  --select-border-radius: 8px;
  --select-padding: 12px;
  --select-font-size: 14px;
  
  /* Shadows */
  --select-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Shadow Parts</h2>
      <p>Access internal elements using CSS <code>::part()</code>:</p>
      
      <pre><code class="language-css">enhanced-select::part(trigger) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

enhanced-select::part(dropdown) {
  border-radius: 12px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.2);
}

enhanced-select::part(option) {
  padding: 12px 16px;
  transition: all 200ms;
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Dark Mode</h2>
      <p>Smilodon automatically adapts to dark mode:</p>
      
      <pre><code class="language-css">@media (prefers-color-scheme: dark) {
  :root {
    --select-bg-color: #1f2937;
    --select-text-color: #f9fafb;
    --select-border-color: #374151;
  }
}</code></pre>
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
