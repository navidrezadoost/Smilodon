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
        <p>Works with React, Vue, Svelte, SolidJS, Vanilla JS, and React Native. Angular is documented separately because the dedicated adapter is not currently maintained.</p>
      </div>
    </div>

    <div class="doc-section">
      <h2>Angular Support</h2>
      <p>Smilodon can be used in Angular today through the core custom element runtime even though there is no maintained <code>@smilodon/angular</code> adapter package in this repository.</p>
      <ul>
        <li>Install <code>@smilodon/core</code></li>
        <li>Register the custom element by importing the package once</li>
        <li>Allow custom elements with <code>CUSTOM_ELEMENTS_SCHEMA</code></li>
        <li>Configure the element in <code>ngAfterViewInit()</code> or after the view is ready</li>
      </ul>
      <pre><code class="language-ts">import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@smilodon/core';

@Component({
  selector: 'app-root',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: '&lt;enhanced-select&gt;&lt;/enhanced-select&gt;'
})
export class AppComponent {}
</code></pre>
      <p>See <a href="#angular">Angular Integration</a> for the full guide, examples, event wiring, and styling notes.</p>
    </div>

    <div class="doc-section">
      <h2>Implementation Status at a Glance</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Platform</th>
            <th>How to integrate</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>React / Vue / Svelte / Solid / Vanilla / React Native</td>
            <td>Use the dedicated Smilodon adapter package</td>
            <td><span class="badge-success">Maintained</span></td>
          </tr>
          <tr>
            <td>Angular</td>
            <td>Use <code>@smilodon/core</code> directly as a custom element</td>
            <td><span class="badge-warning">Manual integration</span></td>
          </tr>
        </tbody>
      </table>
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
          <tr>
            <td>Angular adapter</td>
            <td>Angular</td>
            <td><span class="badge-warning">Not currently maintained</span></td>
          </tr>
        </tbody>
      </table>
      <div class="doc-note">
        <p>The Angular adapter was intentionally omitted from the maintained package list because there is no active <code>@smilodon/angular</code> package in this repository right now.</p>
      </div>
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

      <h3>Angular</h3>
      <p>There is no maintained <code>@smilodon/angular</code> adapter at the moment. If you need Angular today, use <code>@smilodon/core</code> directly as a custom element.</p>
      <pre><code class="language-bash">npm install @smilodon/core</code></pre>
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
      <h2>Start Here</h2>
      <p>Smilodon is designed so you can get a real select working quickly and then layer in advanced capabilities only when you need them. The best first milestone is simple: render a select, provide a small item array, and confirm that selection events update your app state.</p>
      <ol>
        <li>Install <code>@smilodon/core</code> and the adapter package for your framework.</li>
        <li>Render a small select with 3-5 items.</li>
        <li>Listen for selection changes and store the result in your app state.</li>
        <li>Add a placeholder and keyboard test before styling heavily.</li>
        <li>Only then add search, grouping, virtualization, or custom rendering.</li>
      </ol>
      <div class="doc-note">
        <p><strong>Tip:</strong> When the first minimal select works, you have already validated most integration concerns: package wiring, adapter registration, event flow, and styling reachability.</p>
      </div>
    </div>

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

    <div class="doc-section">
      <h2>What to Add Next</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>If you need...</th>
            <th>Use...</th>
            <th>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Form submissions</td>
            <td>Controlled selection state</td>
            <td>Keeps the select aligned with your validation and submit payloads</td>
          </tr>
          <tr>
            <td>Fast filtering</td>
            <td><code>searchable</code> and <code>onSearch</code></td>
            <td>Lets you plug in local or remote filtering cleanly</td>
          </tr>
          <tr>
            <td>Huge datasets</td>
            <td>Virtualization</td>
            <td>Keeps DOM size small and scrolling responsive</td>
          </tr>
          <tr>
            <td>Custom visuals</td>
            <td>CSS variables, <code>::part()</code>, or renderers</td>
            <td>Lets you scale from light theming to fully custom options</td>
          </tr>
          <tr>
            <td>Framework utility classes</td>
            <td><code>classMap</code> / custom renderers</td>
            <td>Works well with Tailwind, Bootstrap, and similar systems</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="doc-section">
      <h2>Mental Model for New Teams</h2>
      <p>The fastest way to adopt Smilodon successfully is to separate three concerns from the beginning:</p>
      <ol>
        <li><strong>Data shape:</strong> decide what an item looks like in your application and keep that shape stable.</li>
        <li><strong>Selection state:</strong> decide whether your application stores indices, values, or full selected objects.</li>
        <li><strong>Presentation:</strong> start with default rendering and add theming or custom rendering only after behavior is correct.</li>
      </ol>
      <p>Teams often slow themselves down by mixing all three concerns at once. If you first prove that items render, selection updates, and events flow correctly, every later enhancement becomes easier.</p>
    </div>

    <div class="doc-section">
      <h2>Suggested First Production Setup</h2>
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react';
import { useMemo, useState } from 'react';

const countryItems = [
  { id: 'us', label: 'United States', value: 'US' },
  { id: 'ca', label: 'Canada', value: 'CA' },
  { id: 'mx', label: 'Mexico', value: 'MX' }
];

export function CountryField() {
  const [countryValue, setCountryValue] = useState(null);

  const selectedIndices = useMemo(() => {
    if (!countryValue) return [];
    const index = countryItems.findIndex((item) => item.value === countryValue);
    return index &gt;= 0 ? [index] : [];
  }, [countryValue]);

  return (
    &lt;NativeSelect
      items={countryItems}
      selectedIndices={selectedIndices}
      placeholder="Select a country"
      clearable
      onSelect={({ items }) =&gt; setCountryValue(items[0]?.value ?? null)}
    /&gt;
  );
}</code></pre>
      <p>This is a strong default because it keeps a stable business value in state while still allowing the select to work with item arrays internally.</p>
    </div>

    <div class="doc-section">
      <h2>Common Setup Mistakes</h2>
      <ul>
        <li>Using array indices as permanent business identifiers after filtering or reordering.</li>
        <li>Adding complex custom option rendering before confirming default selection behavior.</li>
        <li>Skipping keyboard checks during initial integration.</li>
        <li>Testing only with tiny lists and discovering performance issues later.</li>
        <li>Styling the wrong element when using a custom renderer that returns the option root.</li>
      </ul>
    </div>
  `,
  
  concepts: `
    <h1>Fundamental Concepts</h1>
    
    <div class="doc-section">
      <h2>Architecture Overview</h2>
      <p>Smilodon is built on a three-layer architecture that separates concerns and enables framework-agnostic implementation:</p>
      
      <ol>
        <li><strong>Core Runtime:</strong> The <code>enhanced-select</code> Web Component handles all interaction logic, state management, DOM rendering, and accessibility features. This is a single, optimized implementation shared across all frameworks.</li>
        <li><strong>Framework Adapters:</strong> Thin wrappers (<code>@smilodon/react</code>, <code>@smilodon/vue</code>, etc.) expose framework-specific APIs and handle integration with each framework's lifecycle and reactivity system.</li>
        <li><strong>Application Layer:</strong> Your code using the component, where you define options, handle events, and implement business logic.</li>
      </ol>
      
      <h3>Why Web Components?</h3>
      <p>The core runtime uses Web Components (Custom Elements + Shadow DOM) for several reasons:</p>
      <ul>
        <li><strong>Framework Agnostic:</strong> Works in any framework or vanilla JS without special adapters</li>
        <li><strong>Style Encapsulation:</strong> Shadow DOM prevents CSS conflicts with your application styles</li>
        <li><strong>Performance:</strong> One implementation = smaller bundle size across all frameworks</li>
        <li><strong>Standards-Based:</strong> Uses native browser APIs for better longevity</li>
        <li><strong>Progressive Enhancement:</strong> Graceful fallback if JavaScript is disabled</li>
      </ul>
      
      <h3>Communication Flow</h3>
      <pre><code class="language-plaintext">
Application (React/Vue/etc.)
    │
    │ Props/Attributes
    ▼
Framework Adapter
    │
    │ DOM Properties/Attributes
    ▼
Core Web Component
    │
    │ Custom Events
    ▼
Framework Adapter
    │
    │ Callbacks/Event Handlers
    ▼
Application (React/Vue/etc.)
      </code></pre>
      
      <h3>Example: React Adapter Implementation</h3>
      <pre><code class="language-tsx">// Simplified React adapter implementation
import { useEffect, useRef, forwardRef } from 'react';
import '@smilodon/core/enhanced-select';

export const NativeSelect = forwardRef(({ 
  items, 
  value, 
  onChange, 
  ...props 
}, ref) => {
  const elementRef = useRef(null);
  
  // Set items as DOM property (complex data)
  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.items = items;
    }
  }, [items]);
  
  // Listen to custom events
  useEffect(() => {
    const element = elementRef.current;
    const handler = (e) => onChange?.(e.detail);
    
    element?.addEventListener('select-change', handler);
    return () => element?.removeEventListener('select-change', handler);
  }, [onChange]);
  
  return <enhanced-select ref={elementRef} {...props} />;
});
      </code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Selection Modes</h2>
      
      <h3>Single Select</h3>
      <p>Users can select one option at a time. Selecting a new option replaces the previous selection. This is the default mode.</p>
      
      <h4>Behavior</h4>
      <ul>
        <li>Click an option to select it</li>
        <li>Clicking the same option deselects it (if <code>allowDeselect</code> is true)</li>
        <li>Dropdown closes after selection (if <code>closeOnSelect</code> is true, default)</li>
        <li>Value is a single item or null</li>
      </ul>
      
      <h4>State Management</h4>
      <pre><code class="language-tsx">// React example: Controlled single select
const [selectedUser, setSelectedUser] = useState(null);

&lt;NativeSelect 
  mode="single"
  items={users}
  value={selectedUser}
  onChange={setSelectedUser}
  placeholder="Select a user"
/&gt;

// Current value type: User | null
console.log(selectedUser?.name);
      </code></pre>
      
      <h3>Multi Select</h3>
      <p>Users can select multiple options. Selected items appear as chips/badges that can be individually removed.</p>
      
      <h4>Behavior</h4>
      <ul>
        <li>Click options to add them to selection</li>
        <li>Click selected option to remove it</li>
        <li>Click × on chip to remove that item</li>
        <li>Dropdown stays open by default (configurable)</li>
        <li>Value is an array of items</li>
      </ul>
      
      <h4>State Management</h4>
      <pre><code class="language-tsx">// React example: Controlled multi-select
const [selectedUsers, setSelectedUsers] = useState([]);

&lt;NativeSelect 
  mode="multi"
  items={users}
  value={selectedUsers}
  onChange={setSelectedUsers}
  placeholder="Select multiple users"
  maxSelections={5}
/&gt;

// Current value type: User[]
console.log(\`Selected \${selectedUsers.length} users\`);
      </code></pre>
      
      <h3>Mode Comparison</h3>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th>Single Select</th>
            <th>Multi Select</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Value Type</td>
            <td><code>T | null</code></td>
            <td><code>T[]</code></td>
          </tr>
          <tr>
            <td>Display</td>
            <td>Selected item text</td>
            <td>Chips/badges</td>
          </tr>
          <tr>
            <td>Default Close Behavior</td>
            <td>Closes on select</td>
            <td>Stays open</td>
          </tr>
          <tr>
            <td>Clear Button</td>
            <td>Clears selection</td>
            <td>Clears all selections</td>
          </tr>
          <tr>
            <td>Keyboard Navigation</td>
            <td>Enter/Space to select</td>
            <td>Enter/Space to toggle</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Data Flow</h2>
      <p>Smilodon follows a unidirectional data flow pattern similar to React and other modern frameworks:</p>
      
      <h3>Data Flow Diagram</h3>
      <pre><code class="language-plaintext">
┌─────────────────────────────────────────────┐
│  1. Application State                        │
│     const [value, setValue] = useState(null) │
└──────────────────┬──────────────────────────┘
                   │ Pass as props
                   ▼
┌─────────────────────────────────────────────┐
│  2. Component Receives Data                  │
│     &lt;NativeSelect items={items} value={...}&gt;│
└──────────────────┬──────────────────────────┘
                   │ Renders UI
                   ▼
┌─────────────────────────────────────────────┐
│  3. User Interaction                         │
│     User clicks an option                    │
└──────────────────┬──────────────────────────┘
                   │ Emits event
                   ▼
┌─────────────────────────────────────────────┐
│  4. Event Handler                            │
│     onChange={(newValue) => ...}             │
└──────────────────┬──────────────────────────┘
                   │ Updates state
                   ▼
┌─────────────────────────────────────────────┐
│  5. State Update                             │
│     setValue(newValue)                       │
└──────────────────┬──────────────────────────┘
                   │ Triggers re-render
                   └──────────────────────────┐
                                               │
                   ┌───────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│  6. Component Re-renders                     │
│     Shows updated selection                  │
└─────────────────────────────────────────────┘
      </code></pre>
      
      <h3>Controlled vs. Uncontrolled</h3>
      
      <h4>Controlled Component (Recommended)</h4>
      <p>You manage the selection state. The component reflects your state and notifies you of changes.</p>
      
      <pre><code class="language-tsx">// React controlled example
const [value, setValue] = useState(null);

&lt;NativeSelect 
  items={items}
  value={value}               // You control the value
  onChange={setValue}         // You receive updates
/&gt;

// You can validate, transform, or reject changes
const handleChange = (newValue) => {
  if (isValid(newValue)) {
    setValue(newValue);
  } else {
    showError('Invalid selection');
  }
};
      </code></pre>
      
      <h4>Uncontrolled Component</h4>
      <p>The component manages its own state. You can access it via ref.</p>
      
      <pre><code class="language-tsx">// React uncontrolled example
const selectRef = useRef(null);

&lt;NativeSelect 
  ref={selectRef}
  items={items}
  defaultValue={initialValue}  // Initial value only
  onChange={(value) => {
    console.log('Selection changed:', value);
  }}
/&gt;

// Access current value via ref
const getCurrentValue = () => {
  return selectRef.current?.value;
};
      </code></pre>
      
      <h3>Event Lifecycle</h3>
      
      <table class="doc-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>When Fired</th>
            <th>Payload</th>
            <th>Cancellable</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>select-change</code></td>
            <td>After selection changes</td>
            <td>New value</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>search</code></td>
            <td>After debounce delay during typing</td>
            <td>Search query string</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>open</code></td>
            <td>After dropdown opens</td>
            <td>None</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>close</code></td>
            <td>After dropdown closes</td>
            <td>None</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>clear</code></td>
            <td>When clear button clicked</td>
            <td>None</td>
            <td>No</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Virtualization</h2>
      <p>For large datasets (thousands of items), Smilodon uses virtual scrolling to render only visible items plus a small buffer. This keeps the DOM size small and performance high.</p>
      
      <h3>How Virtualization Works</h3>
      
      <ol>
        <li><strong>Viewport Calculation:</strong> Calculate which items are visible based on scroll position</li>
        <li><strong>Render Window:</strong> Render visible items plus buffer items above/below</li>
        <li><strong>DOM Recycling:</strong> Reuse DOM nodes as user scrolls instead of creating/destroying</li>
        <li><strong>Scroll Sync:</strong> Maintain correct scroll position during data changes</li>
      </ol>
      
      <h3>Automatic Activation</h3>
      <p>Virtualization activates automatically when your dataset exceeds a threshold:</p>
      
      <pre><code class="language-tsx">const items = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  label: \`Item \${i}\`,
}));

&lt;NativeSelect 
  items={items}
  virtualization={true}      // Default: auto-enabled at 100+ items
  bufferSize={10}            // Render 10 extra items above/below viewport
  itemHeight={40}            // Fixed height per item (optional)
/&gt;
      </code></pre>
      
      <h3>Performance Characteristics</h3>
      
      <table class="doc-table">
        <thead>
          <tr>
            <th>Operation</th>
            <th>Without Virtualization</th>
            <th>With Virtualization</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Initial Render</td>
            <td>O(n) - renders all items</td>
            <td>O(1) - renders ~20 items</td>
          </tr>
          <tr>
            <td>Scroll</td>
            <td>O(n) - all items in DOM</td>
            <td>O(1) - constant items</td>
          </tr>
          <tr>
            <td>Memory Usage</td>
            <td>O(n) - grows with dataset</td>
            <td>O(1) - constant ~20 nodes</td>
          </tr>
          <tr>
            <td>Search</td>
            <td>O(n) - filter all items</td>
            <td>O(n) - but 60 FPS maintained</td>
          </tr>
        </tbody>
      </table>
      
      <h3>Virtualization Configuration</h3>
      
      <pre><code class="language-tsx">// Fine-tune virtualization behavior
&lt;NativeSelect 
  items={largeDataset}
  virtualization={{
    enabled: true,
    bufferSize: 5,           // Items to render above/below viewport
    itemHeight: 48,          // Fixed height optimization
    overscanCount: 3,        // Extra items to prevent white space
    scrollThrottle: 16,      // Throttle scroll events (ms)
  }}
/&gt;
      </code></pre>
      
      <h3>Best Practices</h3>
      
      <ul>
        <li><strong>Fixed Heights:</strong> Use consistent item heights for best performance</li>
        <li><strong>Buffer Size:</strong> Increase buffer for slower devices or complex items</li>
        <li><strong>Key Function:</strong> Provide stable keys for efficient updates</li>
        <li><strong>Memoization:</strong> Memoize item rendering functions to prevent unnecessary work</li>
      </ul>
      
      <pre><code class="language-tsx">// React example with memoized rendering
const renderOption = useCallback((item) => (
  &lt;div className="option"&gt;
    &lt;img src={item.avatar} loading="lazy" /&gt;
    &lt;span&gt;{item.label}&lt;/span&gt;
  &lt;/div&gt;
), []);

&lt;NativeSelect 
  items={items}
  renderOption={renderOption}
  keyExtractor={(item) => item.id}  // Stable keys
/&gt;
      </code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Shadow DOM Encapsulation</h2>
      <p>Smilodon uses Shadow DOM to encapsulate styles and prevent CSS conflicts.</p>
      
      <h3>What is Shadow DOM?</h3>
      <p>Shadow DOM is a web standard that creates a separate DOM tree with its own scope for styles and IDs. Styles inside the shadow root don't affect the outside, and outside styles don't leak in (except through CSS custom properties).</p>
      
      <h3>Styling Strategy</h3>
      <ul>
        <li><strong>CSS Custom Properties:</strong> Define theme tokens in your global CSS, component reads them</li>
        <li><strong>Shadow Parts:</strong> Expose specific elements for external styling via <code>::part()</code></li>
        <li><strong>Slots:</strong> Project your own HTML content into the component</li>
      </ul>
      
      <pre><code class="language-css">/* Your global CSS - custom properties pierce Shadow DOM */
:root {
  --smilodon-primary-color: #3b82f6;
  --smilodon-border-radius: 8px;
}

/* Style exposed shadow parts */
enhanced-select::part(trigger) {
  border: 2px solid var(--smilodon-primary-color);
}

enhanced-select::part(option):hover {
  background: rgba(59, 130, 246, 0.1);
}
      </code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Memory Management</h2>
      <p>Smilodon is designed to prevent memory leaks and manage resources efficiently.</p>
      
      <h3>Automatic Cleanup</h3>
      <ul>
        <li><strong>Event Listeners:</strong> Automatically removed when component unmounts</li>
        <li><strong>DOM References:</strong> Cleared to allow garbage collection</li>
        <li><strong>Timers:</strong> All timers (debounce, throttle) are cleaned up</li>
        <li><strong>AbortControllers:</strong> Pending async operations are cancelled</li>
      </ul>
      
      <h3>Large Dataset Handling</h3>
      <pre><code class="language-tsx">// Efficient handling of large datasets
const MyComponent = () => {
  const [items, setItems] = useState([]);
  
  useEffect(() => {
    const controller = new AbortController();
    
    // Load data
    fetchLargeDataset({ signal: controller.signal })
      .then(data => setItems(data));
    
    // Cleanup: abort pending requests
    return () => controller.abort();
  }, []);
  
  return (
    &lt;NativeSelect 
      items={items}
      virtualization={true}  // Only renders visible items
    /&gt;
  );
};
      </code></pre>
    </div>
  `,
  
  architecture: `
    <h1>Architecture</h1>
    
    <div class="doc-section">
      <h2>System Design</h2>
      <p>Smilodon uses a shared runtime approach where one Web Component powers all framework adapters. This architecture maximizes code reuse, minimizes bundle size, and ensures consistent behavior across all frameworks.</p>
      
      <div class="architecture-diagram">
        <pre>
┌─────────────────────────────────────────────┐
│         Application Layer                    │
│  (React, Vue, Svelte, SolidJS, etc.)        │
│  - Business logic                            │
│  - State management                          │
│  - Data fetching                             │
└────────────────┬────────────────────────────┘
                 │ Props, Event Handlers
                 ▼
┌─────────────────────────────────────────────┐
│         Framework Adapters                   │
│  (@smilodon/react, @smilodon/vue, etc.)     │
│  - Props mapping                             │
│  - Event bridging                            │
│  - Lifecycle integration                     │
│  - Type definitions                          │
└────────────────┬────────────────────────────┘
                 │ DOM Properties, Custom Events
                 ▼
┌─────────────────────────────────────────────┐
│         Core Runtime                         │
│  (@smilodon/core - enhanced-select)         │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │  Virtualizer                          │  │
│  │  - Viewport calculation               │  │
│  │  - DOM recycling                      │  │
│  │  - Scroll handling                    │  │
│  ├──────────────────────────────────────┤  │
│  │  Selection Manager                    │  │
│  │  - State tracking                     │  │
│  │  - Multi-select logic                 │  │
│  │  - Validation                         │  │
│  ├──────────────────────────────────────┤  │
│  │  Search Engine                        │  │
│  │  - Filtering                          │  │
│  │  - Debouncing                         │  │
│  │  - Fuzzy matching                     │  │
│  ├──────────────────────────────────────┤  │
│  │  Accessibility Layer                  │  │
│  │  - ARIA attributes                    │  │
│  │  - Keyboard navigation                │  │
│  │  - Screen reader announcements        │  │
│  ├──────────────────────────────────────┤  │
│  │  Event System                         │  │
│  │  - Custom events                      │  │
│  │  - Event normalization                │  │
│  │  - Bubbling control                   │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
        </pre>
      </div>
      
      <h3>Layer Responsibilities</h3>
      
      <h4>Application Layer</h4>
      <ul>
        <li><strong>Data Management:</strong> Fetch, transform, and maintain option data</li>
        <li><strong>State:</strong> Manage selected values and UI state (loading, errors)</li>
        <li><strong>Business Logic:</strong> Validation, formatting, side effects</li>
        <li><strong>Integration:</strong> Connect to forms, routers, stores</li>
      </ul>
      
      <h4>Framework Adapter Layer</h4>
      <ul>
        <li><strong>Props Mapping:</strong> Convert framework props to DOM properties/attributes</li>
        <li><strong>Event Bridging:</strong> Convert custom events to framework callbacks</li>
        <li><strong>Lifecycle:</strong> Handle mounting, updates, unmounting</li>
        <li><strong>Refs:</strong> Expose imperative API through ref system</li>
        <li><strong>TypeScript:</strong> Provide type definitions and inference</li>
      </ul>
      
      <h4>Core Runtime Layer</h4>
      <ul>
        <li><strong>Rendering:</strong> Manage DOM structure and updates</li>
        <li><strong>Interaction:</strong> Handle user input (mouse, keyboard, touch)</li>
        <li><strong>State:</strong> Internal component state (open/closed, focused, etc.)</li>
        <li><strong>Performance:</strong> Virtualization, debouncing, optimizations</li>
        <li><strong>Accessibility:</strong> WCAG 2.1 AA compliance</li>
      </ul>
    </div>
    
    <div class="doc-section">
      <h2>Core Components Deep Dive</h2>
      
      <h3>1. Virtualizer</h3>
      <p>The Virtualizer manages efficient rendering of large lists by only creating DOM nodes for visible items plus a small buffer.</p>
      
      <h4>Algorithm</h4>
      <pre><code class="language-javascript">class Virtualizer {
  constructor(container, options) {
    this.container = container;
    this.itemHeight = options.itemHeight || 40;
    this.bufferSize = options.bufferSize || 5;
    this.items = [];
    this.visibleStart = 0;
    this.visibleEnd = 0;
  }
  
  calculateVisibleRange(scrollTop) {
    const viewportHeight = this.container.clientHeight;
    
    // Calculate which items are in viewport
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    const endIndex = Math.ceil((scrollTop + viewportHeight) / this.itemHeight);
    
    // Add buffer above and below
    this.visibleStart = Math.max(0, startIndex - this.bufferSize);
    this.visibleEnd = Math.min(this.items.length, endIndex + this.bufferSize);
    
    return {
      start: this.visibleStart,
      end: this.visibleEnd,
      items: this.items.slice(this.visibleStart, this.visibleEnd)
    };
  }
  
  render(scrollTop) {
    const { start, end, items } = this.calculateVisibleRange(scrollTop);
    
    // Calculate offset for absolute positioning
    const offsetY = start * this.itemHeight;
    
    // Render only visible items
    const html = items.map((item, index) => 
      \`<div class="option" style="transform: translateY(\${(start + index) * this.itemHeight}px)">
        \${item.label}
      </div>\`
    ).join('');
    
    // Set total height to enable scrollbar
    this.container.style.height = \`\${this.items.length * this.itemHeight}px\`;
    this.container.innerHTML = html;
  }
}
      </code></pre>
      
      <h4>Key Features</h4>
      <ul>
        <li><strong>Viewport Calculation:</strong> Determines visible items based on scroll position</li>
        <li><strong>DOM Recycling:</strong> Reuses existing DOM nodes instead of creating/destroying</li>
        <li><strong>Buffer Zone:</strong> Renders extra items to prevent white space during scroll</li>
        <li><strong>Transform Optimization:</strong> Uses <code>transform: translateY()</code> for GPU acceleration</li>
        <li><strong>Anchor Scrolling:</strong> Maintains scroll position during data updates</li>
      </ul>
      
      <h4>Performance Characteristics</h4>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Operation</th>
            <th>Time Complexity</th>
            <th>Space Complexity</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Calculate visible range</td>
            <td>O(1)</td>
            <td>O(1)</td>
          </tr>
          <tr>
            <td>Render visible items</td>
            <td>O(k) where k = buffer size</td>
            <td>O(k)</td>
          </tr>
          <tr>
            <td>Scroll update</td>
            <td>O(1) with throttling</td>
            <td>O(1)</td>
          </tr>
        </tbody>
      </table>
      
      <h3>2. Selection Manager</h3>
      <p>Tracks selected indices, handles multi-select logic, validates selections, and manages selection state.</p>
      
      <h4>State Management</h4>
      <pre><code class="language-javascript">class SelectionManager {
  constructor(mode = 'single') {
    this.mode = mode; // 'single' | 'multi'
    this.selectedIndices = mode === 'multi' ? [] : null;
    this.maxSelections = Infinity;
  }
  
  select(index, items) {
    if (this.mode === 'single') {
      // Single select: replace current selection
      const wasSameItem = this.selectedIndices === index;
      this.selectedIndices = wasSameItem ? null : index;
      
      return {
        value: this.selectedIndices !== null ? items[index] : null,
        changed: true
      };
    } else {
      // Multi select: toggle selection
      const currentIndex = this.selectedIndices.indexOf(index);
      
      if (currentIndex > -1) {
        // Deselect
        this.selectedIndices.splice(currentIndex, 1);
      } else {
        // Select (if under max limit)
        if (this.selectedIndices.length < this.maxSelections) {
          this.selectedIndices.push(index);
        } else {
          return { value: this.getSelectedItems(items), changed: false };
        }
      }
      
      return {
        value: this.getSelectedItems(items),
        changed: true
      };
    }
  }
  
  getSelectedItems(items) {
    if (this.mode === 'single') {
      return this.selectedIndices !== null ? items[this.selectedIndices] : null;
    } else {
      return this.selectedIndices.map(i => items[i]);
    }
  }
  
  isSelected(index) {
    if (this.mode === 'single') {
      return this.selectedIndices === index;
    } else {
      return this.selectedIndices.indexOf(index) > -1;
    }
  }
  
  clear() {
    this.selectedIndices = this.mode === 'multi' ? [] : null;
  }
}
      </code></pre>
      
      <h4>Features</h4>
      <ul>
        <li><strong>Mode Support:</strong> Single and multi-select with different state structures</li>
        <li><strong>Validation:</strong> Enforces <code>maxSelections</code> limit</li>
        <li><strong>Efficient Lookup:</strong> O(1) for single, O(n) for multi (where n = selections, typically small)</li>
        <li><strong>State Consistency:</strong> Guarantees valid state after every operation</li>
      </ul>
      
      <h3>3. Search Engine</h3>
      <p>Provides local filtering and remote search coordination with debouncing and fuzzy matching.</p>
      
      <h4>Implementation</h4>
      <pre><code class="language-javascript">class SearchEngine {
  constructor(options = {}) {
    this.debounceMs = options.debounceMs || 300;
    this.fuzzyMatch = options.fuzzyMatch || false;
    this.caseSensitive = options.caseSensitive || false;
    this.debounceTimer = null;
  }
  
  search(query, items, onResult) {
    // Debounce search input
    clearTimeout(this.debounceTimer);
    
    this.debounceTimer = setTimeout(() => {
      const results = this.filterItems(query, items);
      onResult(results);
    }, this.debounceMs);
  }
  
  filterItems(query, items) {
    if (!query) return items;
    
    const searchTerm = this.caseSensitive ? query : query.toLowerCase();
    
    return items.filter(item => {
      const text = this.caseSensitive ? item.label : item.label.toLowerCase();
      
      if (this.fuzzyMatch) {
        return this.fuzzyMatchString(searchTerm, text);
      } else {
        return text.includes(searchTerm);
      }
    });
  }
  
  fuzzyMatchString(pattern, text) {
    let patternIdx = 0;
    let textIdx = 0;
    
    while (patternIdx < pattern.length && textIdx < text.length) {
      if (pattern[patternIdx] === text[textIdx]) {
        patternIdx++;
      }
      textIdx++;
    }
    
    return patternIdx === pattern.length;
  }
  
  cancel() {
    clearTimeout(this.debounceTimer);
  }
}
      </code></pre>
      
      <h4>Features</h4>
      <ul>
        <li><strong>Debouncing:</strong> Prevents excessive filtering during typing</li>
        <li><strong>Fuzzy Matching:</strong> Allows partial character matches (e.g., "jsc" matches "JavaScript")</li>
        <li><strong>Case Sensitivity:</strong> Configurable case-sensitive or insensitive search</li>
        <li><strong>Remote Search:</strong> Emits events for server-side filtering</li>
        <li><strong>Cancellation:</strong> Cleans up timers on unmount</li>
      </ul>
      
      <h3>4. Accessibility Layer</h3>
      <p>Implements ARIA patterns, keyboard navigation, and screen reader announcements to ensure WCAG 2.1 AA compliance.</p>
      
      <h4>ARIA Implementation</h4>
      <pre><code class="language-javascript">class AccessibilityLayer {
  constructor(element) {
    this.element = element;
    this.setupARIA();
  }
  
  setupARIA() {
    // Set combobox role and properties
    this.element.setAttribute('role', 'combobox');
    this.element.setAttribute('aria-haspopup', 'listbox');
    this.element.setAttribute('aria-expanded', 'false');
    
    // Create live region for announcements
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';
    document.body.appendChild(this.liveRegion);
  }
  
  announce(message) {
    // Screen reader announcement
    this.liveRegion.textContent = message;
    setTimeout(() => this.liveRegion.textContent = '', 1000);
  }
  
  setExpanded(expanded) {
    this.element.setAttribute('aria-expanded', expanded);
    
    if (expanded) {
      this.announce('Options expanded');
    } else {
      this.announce('Options collapsed');
    }
  }
  
  setActiveDescendant(optionId) {
    this.element.setAttribute('aria-activedescendant', optionId);
  }
  
  announceSelection(count, mode) {
    if (mode === 'single') {
      this.announce('Option selected');
    } else {
      this.announce(\`\${count} options selected\`);
    }
  }
}
      </code></pre>
      
      <h4>Keyboard Navigation</h4>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Action</th>
            <th>Context</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Enter / Space</td>
            <td>Open dropdown or select option</td>
            <td>Any</td>
          </tr>
          <tr>
            <td>Escape</td>
            <td>Close dropdown</td>
            <td>Dropdown open</td>
          </tr>
          <tr>
            <td>Arrow Down</td>
            <td>Next option</td>
            <td>Dropdown open</td>
          </tr>
          <tr>
            <td>Arrow Up</td>
            <td>Previous option</td>
            <td>Dropdown open</td>
          </tr>
          <tr>
            <td>Home</td>
            <td>First option</td>
            <td>Dropdown open</td>
          </tr>
          <tr>
            <td>End</td>
            <td>Last option</td>
            <td>Dropdown open</td>
          </tr>
          <tr>
            <td>Type-ahead</td>
            <td>Jump to matching option</td>
            <td>Dropdown open</td>
          </tr>
        </tbody>
      </table>
      
      <h3>5. Event System</h3>
      <p>Unified event handling across all frameworks with consistent payloads and proper propagation control.</p>
      
      <h4>Event Dispatch</h4>
      <pre><code class="language-javascript">class EventSystem {
  constructor(element) {
    this.element = element;
  }
  
  dispatch(eventName, detail, options = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: options.bubbles !== false,
      composed: options.composed !== false,
      cancelable: options.cancelable || false
    });
    
    this.element.dispatchEvent(event);
    return event;
  }
  
  // Specific event dispatchers
  emitChange(value) {
    this.dispatch('select-change', { value });
  }
  
  emitSearch(query) {
    this.dispatch('search', { query });
  }
  
  emitOpen() {
    this.dispatch('open', {});
  }
  
  emitClose() {
    this.dispatch('close', {});
  }
}
      </code></pre>
      
      <h4>Event Payload Structure</h4>
      <pre><code class="language-typescript">interface SelectChangeEvent {
  detail: {
    value: T | T[] | null;     // Current selection
    previous?: T | T[] | null; // Previous selection
  };
}

interface SearchEvent {
  detail: {
    query: string;             // Current search query
  };
}
      </code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Communication Patterns</h2>
      
      <h3>Props → DOM Properties</h3>
      <p>Complex data (objects, arrays, functions) is passed via DOM properties, not attributes.</p>
      
      <pre><code class="language-javascript">// Framework adapter sets DOM property
element.items = [{ id: 1, label: 'Option 1' }];

// Core reads from DOM property
const items = this.items || [];
      </code></pre>
      
      <h3>Events → Callbacks</h3>
      <p>Core emits custom events, framework adapters convert to callbacks.</p>
      
      <pre><code class="language-javascript">// Core dispatches custom event
this.dispatchEvent(new CustomEvent('select-change', {
  detail: { value: newValue }
}));

// React adapter converts to callback
element.addEventListener('select-change', (e) => {
  onChange?.(e.detail.value);
});
      </code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Performance Optimizations</h2>
      
      <h3>Bundle Size</h3>
      <ul>
        <li><strong>Shared Core:</strong> One <code>@smilodon/core</code> package (~15KB gzipped) shared by all frameworks</li>
        <li><strong>Thin Adapters:</strong> Framework adapters are tiny (~2KB each)</li>
        <li><strong>Tree Shaking:</strong> Unused features are eliminated by bundlers</li>
        <li><strong>No Dependencies:</strong> Zero runtime dependencies</li>
      </ul>
      
      <h3>Runtime Performance</h3>
      <ul>
        <li><strong>Virtualization:</strong> O(1) rendering regardless of dataset size</li>
        <li><strong>Debouncing:</strong> Throttles search and scroll events</li>
        <li><strong>DOM Recycling:</strong> Reuses DOM nodes instead of creating/destroying</li>
        <li><strong>RAF Scheduling:</strong> Uses <code>requestAnimationFrame</code> for smooth animations</li>
        <li><strong>Event Delegation:</strong> Single event listener for all options</li>
      </ul>
      
      <h3>Memory Management</h3>
      <ul>
        <li><strong>Automatic Cleanup:</strong> Removes event listeners on unmount</li>
        <li><strong>WeakMap Caching:</strong> Automatic garbage collection for cached data</li>
        <li><strong>Constant Memory:</strong> Virtualization keeps DOM size constant</li>
      </ul>
    </div>
    
    <div class="doc-section">
      <h2>Framework Adapter Patterns</h2>
      
      <h3>React Adapter Pattern</h3>
      <ul>
        <li>Uses <code>useEffect</code> for synchronization</li>
        <li>Uses <code>useRef</code> for element references</li>
        <li>Uses <code>forwardRef</code> for imperative API</li>
        <li>TypeScript generics for type inference</li>
      </ul>
      
      <h3>Vue Adapter Pattern</h3>
      <ul>
        <li>Uses <code>watchEffect</code> for reactive synchronization</li>
        <li>Uses template refs for element access</li>
        <li>Exposes methods via <code>defineExpose</code></li>
        <li>Type inference via generics</li>
      </ul>
      
      <h3>Svelte Adapter Pattern</h3>
      <ul>
        <li>Uses reactive statements <code>$:</code> for updates</li>
        <li>Uses <code>bind:this</code> for element reference</li>
        <li>Exports methods directly</li>
        <li>TypeScript support via generics</li>
      </ul>
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

    <div class="doc-section">
      <h2>How to Measure Real Performance</h2>
      <p>Benchmarks are useful, but production tuning should be based on your real item shape, not just raw item count. A 1,000-row list with avatars, badges, and multi-line descriptions behaves very differently from 1,000 plain text rows.</p>
      <ol>
        <li>Measure first open time with representative data.</li>
        <li>Record scroll smoothness on desktop and a mid-range mobile device.</li>
        <li>Test search with empty, common, and highly selective queries.</li>
        <li>Repeat with custom renderers enabled.</li>
      </ol>
      <pre><code class="language-javascript">performance.mark('open-start');
select.open();

requestAnimationFrame(() => {
  performance.mark('open-end');
  performance.measure('select-open', 'open-start', 'open-end');
  console.log(performance.getEntriesByName('select-open')[0]);
});</code></pre>
    </div>

    <div class="doc-section">
      <h2>Common Performance Mistakes</h2>
      <ul>
        <li>Disabling virtualization for large lists without a strong reason.</li>
        <li>Using expensive custom option markup for every row.</li>
        <li>Passing unstable inline render functions that change every parent render.</li>
        <li>Using an inaccurate <code>estimatedItemHeight</code> in virtualized lists.</li>
        <li>Triggering remote searches without debounce or request cancellation.</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Pre-Ship Performance Checklist</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Area</th>
            <th>What to verify</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Open time</td>
            <td>Dropdown opens without long blocking tasks for common datasets</td>
          </tr>
          <tr>
            <td>Scrolling</td>
            <td>No blank gaps or flashing during quick wheel / touchpad movement</td>
          </tr>
          <tr>
            <td>Search</td>
            <td>Typing remains responsive and stale responses are ignored</td>
          </tr>
          <tr>
            <td>Selection feedback</td>
            <td>Selected, active, and hover states are visible immediately</td>
          </tr>
          <tr>
            <td>Custom renderers</td>
            <td>Option UI complexity does not undo virtualization gains</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="doc-section">
      <h2>Performance by Scenario</h2>
      <h3>Small static list</h3>
      <p>Focus on accessibility, clarity, and low styling overhead. Full rendering is usually fine.</p>

      <h3>Large local dataset</h3>
      <p>Enable virtualization, keep item height accurate, and avoid expensive custom rows.</p>

      <h3>Remote search</h3>
      <p>Debounce aggressively enough to protect the backend, cancel stale requests, and make loading state obvious.</p>

      <h3>Rich enterprise filter panels</h3>
      <p>Memoize items and callbacks, avoid recreating renderers every render, and measure the cost of badges, icons, and nested layouts.</p>
    </div>

    <div class="doc-section">
      <h2>Profiling Recipe</h2>
      <pre><code class="language-javascript">console.time('set-items');
select.setItems(largeDataset);
console.timeEnd('set-items');

performance.mark('dropdown-open-start');
select.open();

requestAnimationFrame(() => {
  performance.mark('dropdown-open-end');
  performance.measure(
    'dropdown-open',
    'dropdown-open-start',
    'dropdown-open-end'
  );

  console.table(performance.getEntriesByName('dropdown-open'));
});</code></pre>
      <p>Use this in development together with browser performance tools to isolate whether the bottleneck is rendering, layout, styling, or network wait time.</p>
    </div>

    <div class="doc-section">
      <h2>Optimization Order</h2>
      <ol>
        <li>Measure with realistic data.</li>
        <li>Enable virtualization when the list is large enough.</li>
        <li>Simplify row rendering before attempting micro-optimizations.</li>
        <li>Stabilize callbacks and derived lists.</li>
        <li>Only after that, optimize network behavior and background processing.</li>
      </ol>
      <p>This order prevents teams from spending time on minor gains while a larger structural issue is still present.</p>
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

    <div class="doc-section">
      <h2>How to Organize Configuration</h2>
      <p>In larger apps, configuration is easier to reason about when you group it conceptually:</p>
      <ol>
        <li><strong>Data:</strong> <code>items</code>, grouping, disabled state, selected indices</li>
        <li><strong>Interaction:</strong> mode, clearability, close behavior, search behavior</li>
        <li><strong>Scale:</strong> virtualization, infinite scroll, buffering, debouncing</li>
        <li><strong>Presentation:</strong> placeholders, renderers, classes, theme tokens</li>
      </ol>
      <p>This separation makes shared wrapper components much easier to maintain.</p>
    </div>

    <div class="doc-section">
      <h2>Practical Recipes</h2>
      <h3>Simple form field</h3>
      <pre><code class="language-tsx">&lt;NativeSelect
  items={countries}
  placeholder="Select a country"
  clearable
/&gt;</code></pre>

      <h3>Remote searchable picker</h3>
      <pre><code class="language-tsx">&lt;NativeSelect
  items={results}
  searchable
  searchDebounce={250}
  onSearch={handleSearch}
  loading={loading}
/&gt;</code></pre>

      <h3>Large dataset picker</h3>
      <pre><code class="language-tsx">&lt;NativeSelect
  items={largeDataset}
  virtualized
  estimatedItemHeight={44}
  buffer={12}
/&gt;</code></pre>
    </div>

    <div class="doc-section">
      <h2>When to Be Explicit</h2>
      <ul>
        <li>Set <code>mode</code> explicitly in shared components so consumers do not rely on defaults accidentally.</li>
        <li>Set <code>closeOnSelect</code> explicitly in multi-step selection flows.</li>
        <li>Set <code>estimatedItemHeight</code> explicitly when using virtualization.</li>
        <li>Set <code>searchDebounce</code> explicitly when real network requests are involved.</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Controlled vs Uncontrolled Configuration</h2>
      <p>Configuration decisions often become easier when you decide early how much state the parent owns.</p>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Approach</th>
            <th>Best for</th>
            <th>Tradeoff</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Controlled</td>
            <td>Forms, filters, saved state, synchronized UI</td>
            <td>More parent code, but maximum predictability</td>
          </tr>
          <tr>
            <td>Uncontrolled</td>
            <td>Simple demos, temporary tools, isolated pickers</td>
            <td>Less explicit state ownership</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="doc-section">
      <h2>Shared Wrapper Example</h2>
      <pre><code class="language-tsx">export function AppSelect({
  items,
  selectedIndices,
  onSelect,
  placeholder = 'Select an option',
  searchable = false,
  ...rest
}) {
  return (
    &lt;NativeSelect
      items={items}
      selectedIndices={selectedIndices}
      onSelect={onSelect}
      placeholder={placeholder}
      searchable={searchable}
      clearable
      {...rest}
    /&gt;
  );
}</code></pre>
      <p>Shared wrappers help teams standardize defaults, styling tokens, accessibility labels, and event normalization across the application.</p>
    </div>

    <div class="doc-section">
      <h2>Configuration Review Checklist</h2>
      <ul>
        <li>Are item values stable across filtering and sorting?</li>
        <li>Is search local or remote, and is debounce appropriate?</li>
        <li>Will this dataset eventually require virtualization?</li>
        <li>Should the field be clearable?</li>
        <li>Does the wrapper expose only the options consumers actually need?</li>
      </ul>
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

      <h3>Separator Tokens</h3>
      <pre><code class="language-css">/* Separator line (between input and arrow) */
--select-separator-width: 1px;
--select-separator-height: 50%;             /* For single-select (percentage) */
--select-multi-separator-height: auto;      /* For multi-select (fixed px or auto) */
--select-separator-display: block;
--select-separator-opacity: 0.6;
--select-separator-active-opacity: 1;
--select-separator-bg: linear-gradient(to bottom, transparent, var(--select-border), transparent);

/* Multi-select separator positioning */
--select-multi-separator-inset-block: 10px;</code></pre>

      <div class="doc-note">
        <p>💡 <strong>Tip:</strong> Multi-select uses <code>--select-multi-separator-height</code> which defaults to <code>auto</code> 
        (stretches with container). Set a fixed value like <code>40px</code> to maintain consistent separator height 
        regardless of how many items are selected.</p>
      </div>

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
  disabledOptionBehavior={{
    hoverable: false,
    focusable: false,
    selectable: false,
  }}
  showSelectedIndicator={false}
/&gt;</code></pre>

      <p><strong>Note:</strong> <code>classMap.disabled</code> controls the dimmed appearance, while <code>disabledOptionBehavior</code> controls whether a dimmed option can still be hovered, focused, or selected.</p>

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
      <h2>CSS Framework Compatibility</h2>
      <p>Smilodon is designed to let CSS frameworks own layout and utility authoring while the component keeps control semantics, tokens, and internal structure stable.</p>

      <h3>What changed in 1.5.5</h3>
      <ul>
        <li><strong>Scoped mirrored styles:</strong> mirrored document styles now stay inside the options subtree instead of the full shadow root.</li>
        <li><strong>Dark variant bridging:</strong> <code>.dark</code>, <code>.dark-mode</code>, and theme attributes are mirrored into the options subtree so utility dark variants update immediately.</li>
        <li><strong>Escaped utility selector support:</strong> Tailwind-style selectors such as <code>dark\:text-white</code> keep working when styles are mirrored.</li>
        <li><strong>Accessible custom renderers:</strong> custom option roots keep listbox semantics while nested focus targets are neutralized by default.</li>
        <li><strong>Stable state styling:</strong> hover, active, selected, and disabled classes remain available on the custom renderer root so framework utilities can style the actual rendered surface.</li>
      </ul>

      <h3>Recommended layering</h3>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Need</th>
            <th>Recommended Smilodon hook</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Layout, spacing, responsive width</td>
            <td>Framework classes on the host or wrapper</td>
          </tr>
          <tr>
            <td>Shell theming</td>
            <td>CSS variables on <code>enhanced-select</code></td>
          </tr>
          <tr>
            <td>Internal structure tweaks</td>
            <td><code>::part()</code> selectors</td>
          </tr>
          <tr>
            <td>Selected / active / disabled states</td>
            <td><code>classMap</code></td>
          </tr>
          <tr>
            <td>Rich option UI</td>
            <td><code>optionRenderer</code> and <code>groupHeaderRenderer</code></td>
          </tr>
        </tbody>
      </table>
      
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

      <div class="doc-note">
        <p><strong>Renderer note:</strong> if <code>optionRenderer</code> returns the option root element itself, style that root directly for hover and active visuals. Do not assume there is an extra wrapper child.</p>
      </div>

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
        <li><a href="#css-frameworks">CSS Framework Guide</a> - Tailwind, Bootstrap, Material UI, and scoped custom-renderer integration</li>
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

    <div class="doc-section">
      <h2>Recommended React Pattern</h2>
      <p>The React adapter works best when selection state lives in React and the select acts as a fast UI surface. Keep your item arrays stable when possible, memoize expensive derived lists, and use refs only for imperative flows such as <code>open()</code> or <code>clear()</code>.</p>
    </div>

    <div class="doc-section">
      <h2>Controlled Example with Stable Values</h2>
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react';
import { useMemo, useState } from 'react';

const users = [
  { id: 'u1', label: 'Ada Lovelace', value: 'ada' },
  { id: 'u2', label: 'Grace Hopper', value: 'grace' },
  { id: 'u3', label: 'Margaret Hamilton', value: 'margaret' }
];

export default function UserPicker() {
  const [selectedValues, setSelectedValues] = useState([]);

  const selectedIndices = useMemo(() => {
    const indexByValue = new Map(users.map((item, index) => [item.value, index]));
    return selectedValues
      .map((value) => indexByValue.get(value))
      .filter((index) => index != null);
  }, [selectedValues]);

  return (
    &lt;NativeSelect
      items={users}
      selectedIndices={selectedIndices}
      onSelect={({ items }) =&gt; setSelectedValues(items.map((item) =&gt; item.value))}
      placeholder="Choose a user"
    /&gt;
  );
}</code></pre>
      <p>This approach is useful when your form or API layer expects stable values instead of array positions.</p>
    </div>

    <div class="doc-section">
      <h2>Imperative Control with Refs</h2>
      <pre><code class="language-tsx">import { useRef } from 'react';
import { NativeSelect } from '@smilodon/react';

function ToolbarFilter() {
  const selectRef = useRef(null);

  return (
    &lt;&gt;
      &lt;div className="toolbar"&gt;
        &lt;button onClick={() =&gt; selectRef.current?.open()}&gt;Open&lt;/button&gt;
        &lt;button onClick={() =&gt; selectRef.current?.clear()}&gt;Clear&lt;/button&gt;
      &lt;/div&gt;

      &lt;NativeSelect ref={selectRef} items={items} searchable /&gt;
    &lt;/&gt;
  );
}</code></pre>
    </div>

    <div class="doc-section">
      <h2>React SSR Notes</h2>
      <ul>
        <li>Use Smilodon from client-rendered boundaries.</li>
        <li>Keep browser-only imperative work out of server components.</li>
        <li>Resolve remote data first when possible, then pass <code>items</code> into the adapter.</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>React Form Pattern</h2>
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react';
import { useMemo, useState } from 'react';

const roles = [
  { id: 'admin', label: 'Administrator', value: 'admin' },
  { id: 'editor', label: 'Editor', value: 'editor' },
  { id: 'viewer', label: 'Viewer', value: 'viewer' }
];

export function RoleField() {
  const [roleValue, setRoleValue] = useState('viewer');

  const selectedIndices = useMemo(() => {
    const index = roles.findIndex((item) => item.value === roleValue);
    return index &gt;= 0 ? [index] : [];
  }, [roleValue]);

  return (
    &lt;NativeSelect
      items={roles}
      selectedIndices={selectedIndices}
      onSelect={({ items }) =&gt; setRoleValue(items[0]?.value ?? '')}
      aria-label="Role"
    /&gt;
  );
}</code></pre>
      <p>This pattern keeps the React form model independent from transient array positions.</p>
    </div>

    <div class="doc-section">
      <h2>Remote Search Pattern</h2>
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react';
import { useRef, useState } from 'react';

export function SearchUsers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef(null);

  async function handleSearch({ query }) {
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    setLoading(true);
    try {
      const response = await fetch('/api/users?q=' + encodeURIComponent(query), {
        signal: controllerRef.current.signal,
      });
      setItems(await response.json());
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    &lt;NativeSelect
      items={items}
      searchable
      searchDebounce={250}
      loading={loading}
      onSearch={handleSearch}
      placeholder="Search users"
    /&gt;
  );
}</code></pre>
    </div>

    <div class="doc-section">
      <h2>React Performance Guidance</h2>
      <ul>
        <li>Memoize large item lists when they are derived from other state.</li>
        <li>Do not rebuild renderer functions unless their dependencies changed.</li>
        <li>Keep expensive filtering outside render when possible.</li>
        <li>Prefer stable values in form state and remap indices as needed.</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Recommended Wrapper Responsibilities</h2>
      <p>Many React teams benefit from a thin internal wrapper that handles:</p>
      <ul>
        <li>design-token defaults</li>
        <li>error and helper text layout</li>
        <li>consistent empty-state copy</li>
        <li>controlled value-to-index mapping</li>
        <li>analytics or logging hooks where needed</li>
      </ul>
    </div>
  `,

  angular: `
    <h1>Angular Integration</h1>

    <div class="doc-section">
      <h2>Status</h2>
      <p>Angular was not listed with the maintained adapters because this repository currently does not ship an active <code>@smilodon/angular</code> package.</p>
      <p>You can still use Smilodon in Angular by registering the core custom element and allowing custom elements in your Angular module or standalone component.</p>
      <div class="doc-note">
        <p><strong>Recommendation:</strong> Use Angular with <code>@smilodon/core</code> when you want the shared runtime today. If a dedicated Angular adapter is added later, the underlying element API can remain the foundation for migration.</p>
      </div>
    </div>

    <div class="doc-section">
      <h2>Install</h2>
      <pre><code class="language-bash">npm install @smilodon/core
# or
yarn add @smilodon/core
# or
pnpm add @smilodon/core</code></pre>
    </div>

    <div class="doc-section">
      <h2>How Angular integration works</h2>
      <ol>
        <li>Import <code>@smilodon/core</code> once so the browser registers <code>&lt;enhanced-select&gt;</code>.</li>
        <li>Allow custom elements with <code>CUSTOM_ELEMENTS_SCHEMA</code>.</li>
        <li>Use <code>ViewChild</code> or a template reference to get the element instance.</li>
        <li>Call runtime methods such as <code>setItems()</code>, <code>open()</code>, <code>clear()</code>, or <code>updateConfig()</code>.</li>
        <li>Listen for custom DOM events like <code>change</code>, <code>select</code>, and <code>open</code>.</li>
      </ol>
    </div>

    <div class="doc-section">
      <h2>Minimal setup</h2>
      <pre><code class="language-ts">import '@smilodon/core';</code></pre>
      <pre><code class="language-ts">import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@smilodon/core';

@Component({
  selector: 'app-root',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: &#96;
    &lt;enhanced-select id="framework-select"&gt;&lt;/enhanced-select&gt;
  &#96;,
})
export class AppComponent {}
      </code></pre>
    </div>

    <div class="doc-section">
  <h2>Bind data after view init</h2>
      <pre><code class="language-ts">import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild } from '@angular/core';
import '@smilodon/core';

@Component({
  selector: 'app-root',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: &#96;
    &lt;enhanced-select #select&gt;&lt;/enhanced-select&gt;
  &#96;,
})
export class AppComponent implements AfterViewInit {
  @ViewChild('select', { static: true })
  selectRef!: ElementRef<any>;

  ngAfterViewInit(): void {
    const select = this.selectRef.nativeElement;

    select.setItems([
      { label: 'Angular', value: 'angular' },
      { label: 'React', value: 'react' },
      { label: 'Vue', value: 'vue' },
    ]);

    select.updateConfig({
      searchable: true,
      placeholder: 'Choose a framework',
    });

    select.addEventListener('change', (event: any) => {
      console.log('Selected values:', event.detail.selectedValues);
    });
  }
}
      </code></pre>
    </div>

    <div class="doc-section">
      <h2>Template + component example</h2>
      <pre><code class="language-html">&lt;enhanced-select #frameworkSelect&gt;&lt;/enhanced-select&gt;
&lt;p&gt;Selected: {{ selectedLabel || 'Nothing selected yet' }}&lt;/p&gt;</code></pre>
      <pre><code class="language-ts">import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild } from '@angular/core';
import '@smilodon/core';

@Component({
  selector: 'app-framework-picker',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: &#96;
    &lt;enhanced-select #frameworkSelect&gt;&lt;/enhanced-select&gt;
    &lt;p&gt;Selected: {{ selectedLabel || 'Nothing selected yet' }}&lt;/p&gt;
  &#96;,
})
export class FrameworkPickerComponent implements AfterViewInit {
  @ViewChild('frameworkSelect', { static: true })
  frameworkSelect!: ElementRef<any>;

  selectedLabel = '';

  ngAfterViewInit(): void {
    const el = this.frameworkSelect.nativeElement;

    el.setItems([
      { label: 'Angular', value: 'angular' },
      { label: 'React', value: 'react' },
      { label: 'Vue', value: 'vue' },
      { label: 'Svelte', value: 'svelte' },
    ]);

    el.addEventListener('change', (event: any) => {
      const firstItem = event.detail.selectedItems?.[0];
      this.selectedLabel = firstItem?.label ?? '';
    });
  }
}
      </code></pre>
    </div>

    <div class="doc-section">
      <h2>Configuration patterns</h2>
      <p>Because Angular is talking directly to the custom element, most advanced behavior is configured at runtime:</p>
      <pre><code class="language-ts">const select = this.selectRef.nativeElement;

select.updateConfig({
  selection: {
    mode: 'multi',
    closeOnSelect: false,
    maxSelections: 5,
  },
  searchable: true,
  clearControl: {
    enabled: true,
  },
  dropdownPlacement: {
    mode: 'bottom',
  },
});</code></pre>
    </div>

    <div class="doc-section">
      <h2>Listening to events</h2>
      <p>The element emits DOM custom events. In Angular, the most reliable approach is to subscribe with <code>addEventListener()</code> after the element is available.</p>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Detail payload</th>
            <th>Use case</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>change</code></td>
            <td><code>selectedItems</code>, <code>selectedValues</code>, <code>selectedIndices</code></td>
            <td>Sync Angular component state</td>
          </tr>
          <tr>
            <td><code>select</code></td>
            <td>Single item selection metadata</td>
            <td>Per-selection side effects</td>
          </tr>
          <tr>
            <td><code>search</code></td>
            <td><code>query</code>, <code>results</code>, <code>count</code></td>
            <td>Remote search and analytics</td>
          </tr>
          <tr>
            <td><code>open</code> / <code>close</code></td>
            <td>UI lifecycle info</td>
            <td>Telemetry and UI coordination</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="doc-section">
      <h2>Styling in Angular</h2>
      <p>Since Smilodon is based on a custom element with Shadow DOM, style it with CSS custom properties on the host element:</p>
      <pre><code class="language-css">enhanced-select {
  --select-input-border-radius: 12px;
  --select-option-hover-bg: rgba(59, 130, 246, 0.08);
  --select-option-transition: none;
  --select-separator-inset-block: 8px;
}</code></pre>
      <p>This works well from Angular component styles, global styles, or design-system tokens.</p>
    </div>

    <div class="doc-section">
      <h2>Current limitations</h2>
      <ul>
        <li>No maintained <code>@smilodon/angular</code> adapter package is shipped in this monorepo.</li>
        <li>Angular forms integration is manual. Wrap the custom element in your own <code>ControlValueAccessor</code> if you need reactive forms binding.</li>
        <li>TypeScript typing for <code>ViewChild</code> references is looser unless you define your own interface for the element API.</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Recommended approach</h2>
      <p>If you are using Angular now, treat Smilodon as a stable custom element runtime: configure it programmatically, listen to emitted DOM events, and build any Angular-specific wrapper you need close to your application code.</p>
    </div>
  `,
  
  vue: `
    <h1>Vue 3 Integration</h1>
    
    <div class="doc-section">
      <h2>Installation</h2>
      <pre><code class="language-bash">npm install @smilodon/core @smilodon/vue
# or
yarn add @smilodon/core @smilodon/vue
# or
pnpm add @smilodon/core @smilodon/vue</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Basic Usage (Composition API)</h2>
      <pre><code class="language-vue">&lt;template&gt;
  &lt;EnhancedSelect
    :items="items"
    :selected-indices="selectedIndices"
    @select="handleSelect"
    placeholder="Select a fruit"
  /&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { ref } from 'vue';
import { EnhancedSelect } from '@smilodon/vue';

const selectedIndices = ref([]);
const items = [
  { id: 1, label: 'Apple', value: 'apple' },
  { id: 2, label: 'Banana', value: 'banana' },
  { id: 3, label: 'Cherry', value: 'cherry' }
];

function handleSelect({ selectedIndices: indices, selectedItems }) {
  selectedIndices.value = indices;
  console.log('Selected:', selectedItems);
}
&lt;/script&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Multi-Select with Computed</h2>
      <pre><code class="language-vue">&lt;template&gt;
  &lt;div&gt;
    &lt;EnhancedSelect
      mode="multi"
      :items="items"
      :selected-indices="selectedIndices"
      @select="handleSelect"
      :max-selections="3"
      :close-on-select="false"
    /&gt;
    
    &lt;p&gt;Selected: {{ selectedCount }} items&lt;/p&gt;
    &lt;button @click="clearSelection"&gt;Clear All&lt;/button&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { ref, computed } from 'vue';
import { EnhancedSelect } from '@smilodon/vue';

const selectedIndices = ref([]);
const items = [
  { id: 1, label: 'React', icon: '⚛️' },
  { id: 2, label: 'Vue', icon: '💚' },
  { id: 3, label: 'Svelte', icon: '🔥' },
  { id: 4, label: 'Angular', icon: '🅰️' }
];

const selectedCount = computed(() => selectedIndices.value.length);

function handleSelect({ selectedIndices: indices }) {
  selectedIndices.value = indices;
}

function clearSelection() {
  selectedIndices.value = [];
}
&lt;/script&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Searchable with Filtering</h2>
      <pre><code class="language-vue">&lt;template&gt;
  &lt;EnhancedSelect
    searchable
    :items="filteredItems"
    :selected-indices="selectedIndices"
    @select="handleSelect"
    @search="handleSearch"
    :search-debounce="300"
    placeholder="Search..."
  /&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { ref, computed } from 'vue';
import { EnhancedSelect } from '@smilodon/vue';

const searchQuery = ref('');
const selectedIndices = ref([]);
const allItems = ref([
  { id: 1, label: 'Apple', category: 'Fruit' },
  { id: 2, label: 'Banana', category: 'Fruit' },
  { id: 3, label: 'Carrot', category: 'Vegetable' },
  { id: 4, label: 'Broccoli', category: 'Vegetable' }
]);

const filteredItems = computed(() => {
  if (!searchQuery.value) return allItems.value;
  return allItems.value.filter(item =>
    item.label.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

function handleSearch({ query }) {
  searchQuery.value = query;
}

function handleSelect({ selectedIndices: indices }) {
  selectedIndices.value = indices;
}
&lt;/script&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Custom Rendering with Slots</h2>
      <pre><code class="language-vue">&lt;template&gt;
  &lt;EnhancedSelect
    :items="users"
    :selected-indices="selectedIndices"
    @select="handleSelect"
  &gt;
    &lt;template #option="{ item }"&gt;
      &lt;div class="user-option"&gt;
        &lt;img :src="item.avatar" :alt="item.name" class="avatar" /&gt;
        &lt;div&gt;
          &lt;div class="name"&gt;{{ item.name }}&lt;/div&gt;
          &lt;div class="email"&gt;{{ item.email }}&lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/template&gt;
    
    &lt;template #value="{ item }"&gt;
      &lt;div class="selected-user"&gt;
        &lt;img :src="item.avatar" class="avatar-small" /&gt;
        &lt;span&gt;{{ item.name }}&lt;/span&gt;
      &lt;/div&gt;
    &lt;/template&gt;
  &lt;/EnhancedSelect&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { ref } from 'vue';
import { EnhancedSelect } from '@smilodon/vue';

const selectedIndices = ref([]);
const users = [
  { 
    id: 1, 
    name: 'John Doe', 
    email: 'john@example.com', 
    avatar: '/john.jpg' 
  },
  { 
    id: 2, 
    name: 'Jane Smith', 
    email: 'jane@example.com', 
    avatar: '/jane.jpg' 
  }
];

function handleSelect({ selectedIndices: indices }) {
  selectedIndices.value = indices;
}
&lt;/script&gt;

&lt;style scoped&gt;
.user-option {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.avatar-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.name {
  font-weight: 600;
}

.email {
  font-size: 0.875rem;
  color: #6b7280;
}
&lt;/style&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>With Ref & Template Ref</h2>
      <pre><code class="language-vue">&lt;template&gt;
  &lt;div&gt;
    &lt;EnhancedSelect
      ref="selectRef"
      :items="items"
      :selected-indices="selectedIndices"
      @select="handleSelect"
      mode="multi"
    /&gt;
    
    &lt;button @click="clearAll"&gt;Clear All&lt;/button&gt;
    &lt;button @click="openDropdown"&gt;Open Dropdown&lt;/button&gt;
    &lt;button @click="closeDropdown"&gt;Close Dropdown&lt;/button&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { ref } from 'vue';
import { EnhancedSelect } from '@smilodon/vue';

const selectRef = ref(null);
const selectedIndices = ref([]);
const items = [...];

function handleSelect({ selectedIndices: indices }) {
  selectedIndices.value = indices;
}

function clearAll() {
  selectRef.value?.clear();
}

function openDropdown() {
  selectRef.value?.open();
}

function closeDropdown() {
  selectRef.value?.close();
}
&lt;/script&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>TypeScript Support</h2>
      <pre><code class="language-vue">&lt;script setup lang="ts"&gt;
import { ref } from 'vue';
import { EnhancedSelect, SelectItem, SelectEvent } from '@smilodon/vue';

interface User {
  id: number;
  name: string;
  email: string;
}

const selectedIndices = ref<number[]>([]);
const users: SelectItem<User>[] = [
  { 
    id: 1, 
    label: 'John', 
    value: { id: 1, name: 'John', email: 'john@example.com' } 
  },
  { 
    id: 2, 
    label: 'Jane', 
    value: { id: 2, name: 'Jane', email: 'jane@example.com' } 
  }
];

function handleSelect(event: SelectEvent<User>) {
  selectedIndices.value = event.selectedIndices;
  console.log('Selected users:', event.selectedItems);
}
&lt;/script&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Options API (Vue 2 Style)</h2>
      <pre><code class="language-vue">&lt;template&gt;
  &lt;EnhancedSelect
    :items="items"
    :selected-indices="selectedIndices"
    @select="handleSelect"
  /&gt;
&lt;/template&gt;

&lt;script&gt;
import { EnhancedSelect } from '@smilodon/vue';

export default {
  components: {
    EnhancedSelect
  },
  data() {
    return {
      selectedIndices: [],
      items: [
        { id: 1, label: 'Option 1' },
        { id: 2, label: 'Option 2' },
        { id: 3, label: 'Option 3' }
      ]
    };
  },
  methods: {
    handleSelect({ selectedIndices, selectedItems }) {
      this.selectedIndices = selectedIndices;
      console.log('Selected:', selectedItems);
    }
  }
};
&lt;/script&gt;</code></pre>
    </div>
  `,
  
  svelte: `
    <h1>Svelte Integration</h1>
    
    <div class="doc-section">
      <h2>Installation</h2>
      <pre><code class="language-bash">npm install @smilodon/core @smilodon/svelte
# or
yarn add @smilodon/core @smilodon/svelte
# or
pnpm add @smilodon/core @smilodon/svelte</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Basic Usage</h2>
      <pre><code class="language-svelte">&lt;script&gt;
  import { EnhancedSelect } from '@smilodon/svelte';
  
  let selectedIndices = [];
  const items = [
    { id: 1, label: 'Apple', value: 'apple' },
    { id: 2, label: 'Banana', value: 'banana' },
    { id: 3, label: 'Cherry', value: 'cherry' }
  ];
  
  function handleSelect(event) {
    selectedIndices = event.detail.selectedIndices;
    console.log('Selected:', event.detail.selectedItems);
  }
&lt;/script&gt;

&lt;EnhancedSelect
  {items}
  {selectedIndices}
  on:select={handleSelect}
  placeholder="Select a fruit"
/&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Multi-Select with Reactive Statements</h2>
      <pre><code class="language-svelte">&lt;script&gt;
  import { EnhancedSelect } from '@smilodon/svelte';
  
  let selectedIndices = [];
  let selectedCount = 0;
  
  const items = [
    { id: 1, label: 'React', icon: '⚛️' },
    { id: 2, label: 'Vue', icon: '💚' },
    { id: 3, label: 'Svelte', icon: '🔥' },
    { id: 4, label: 'Angular', icon: '🅰️' }
  ];
  
  $: selectedCount = selectedIndices.length;
  
  function handleSelect(event) {
    selectedIndices = event.detail.selectedIndices;
  }
  
  function clearSelection() {
    selectedIndices = [];
  }
&lt;/script&gt;

&lt;div&gt;
  &lt;EnhancedSelect
    mode="multi"
    {items}
    {selectedIndices}
    on:select={handleSelect}
    maxSelections={3}
    closeOnSelect={false}
  /&gt;
  
  &lt;p&gt;Selected: {selectedCount} items&lt;/p&gt;
  &lt;button on:click={clearSelection}&gt;Clear All&lt;/button&gt;
&lt;/div&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Searchable with Stores</h2>
      <pre><code class="language-svelte">&lt;script&gt;
  import { writable, derived } from 'svelte/store';
  import { EnhancedSelect } from '@smilodon/svelte';
  
  const searchQuery = writable('');
  const allItems = writable([
    { id: 1, label: 'Apple', category: 'Fruit' },
    { id: 2, label: 'Banana', category: 'Fruit' },
    { id: 3, label: 'Carrot', category: 'Vegetable' },
    { id: 4, label: 'Broccoli', category: 'Vegetable' }
  ]);
  
  const filteredItems = derived(
    [searchQuery, allItems],
    ([$query, $items]) => {
      if (!$query) return $items;
      return $items.filter(item =>
        item.label.toLowerCase().includes($query.toLowerCase())
      );
    }
  );
  
  let selectedIndices = [];
  
  function handleSearch(event) {
    $searchQuery = event.detail.query;
  }
  
  function handleSelect(event) {
    selectedIndices = event.detail.selectedIndices;
  }
&lt;/script&gt;

&lt;EnhancedSelect
  searchable
  items={$filteredItems}
  {selectedIndices}
  on:search={handleSearch}
  on:select={handleSelect}
  searchDebounce={300}
  placeholder="Search items..."
/&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Custom Rendering with Slots</h2>
      <pre><code class="language-svelte">&lt;script&gt;
  import { EnhancedSelect } from '@smilodon/svelte';
  
  let selectedIndices = [];
  const users = [
    { 
      id: 1, 
      name: 'John Doe', 
      email: 'john@example.com', 
      avatar: '/john.jpg' 
    },
    { 
      id: 2, 
      name: 'Jane Smith', 
      email: 'jane@example.com', 
      avatar: '/jane.jpg' 
    }
  ];
  
  function handleSelect(event) {
    selectedIndices = event.detail.selectedIndices;
  }
&lt;/script&gt;

&lt;EnhancedSelect
  items={users}
  {selectedIndices}
  on:select={handleSelect}
  let:item
  let:type
&gt;
  {#if type === 'option'}
    &lt;div class="user-option"&gt;
      &lt;img src={item.avatar} alt={item.name} class="avatar" /&gt;
      &lt;div&gt;
        &lt;div class="name"&gt;{item.name}&lt;/div&gt;
        &lt;div class="email"&gt;{item.email}&lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  {:else if type === 'value'}
    &lt;div class="selected-user"&gt;
      &lt;img src={item.avatar} class="avatar-small" /&gt;
      &lt;span&gt;{item.name}&lt;/span&gt;
    &lt;/div&gt;
  {/if}
&lt;/EnhancedSelect&gt;

&lt;style&gt;
  .user-option {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
  
  .avatar-small {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }
  
  .name {
    font-weight: 600;
  }
  
  .email {
    font-size: 0.875rem;
    color: #6b7280;
  }
&lt;/style&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>With Bindings & Methods</h2>
      <pre><code class="language-svelte">&lt;script&gt;
  import { EnhancedSelect } from '@smilodon/svelte';
  
  let selectComponent;
  let selectedIndices = [];
  const items = [...];
  
  function handleSelect(event) {
    selectedIndices = event.detail.selectedIndices;
  }
  
  function clearAll() {
    selectComponent?.clear();
  }
  
  function openDropdown() {
    selectComponent?.open();
  }
  
  function closeDropdown() {
    selectComponent?.close();
  }
&lt;/script&gt;

&lt;div&gt;
  &lt;EnhancedSelect
    bind:this={selectComponent}
    {items}
    {selectedIndices}
    mode="multi"
    on:select={handleSelect}
  /&gt;
  
  &lt;button on:click={clearAll}&gt;Clear All&lt;/button&gt;
  &lt;button on:click={openDropdown}&gt;Open&lt;/button&gt;
  &lt;button on:click={closeDropdown}&gt;Close&lt;/button&gt;
&lt;/div&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>TypeScript Support</h2>
      <pre><code class="language-svelte">&lt;script lang="ts"&gt;
  import { EnhancedSelect, type SelectItem, type SelectEvent } from '@smilodon/svelte';
  
  interface User {
    id: number;
    name: string;
    email: string;
  }
  
  let selectedIndices: number[] = [];
  const users: SelectItem<User>[] = [
    { 
      id: 1, 
      label: 'John', 
      value: { id: 1, name: 'John', email: 'john@example.com' } 
    },
    { 
      id: 2, 
      label: 'Jane', 
      value: { id: 2, name: 'Jane', email: 'jane@example.com' } 
    }
  ];
  
  function handleSelect(event: SelectEvent<User>) {
    selectedIndices = event.detail.selectedIndices;
    console.log('Selected users:', event.detail.selectedItems);
  }
&lt;/script&gt;

&lt;EnhancedSelect
  items={users}
  {selectedIndices}
  on:select={handleSelect}
/&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>SvelteKit Integration</h2>
      <pre><code class="language-svelte">&lt;script&gt;
  import { EnhancedSelect } from '@smilodon/svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  let selectedIndices = [];
  
  const pages = [
    { id: 1, label: 'Home', value: '/' },
    { id: 2, label: 'About', value: '/about' },
    { id: 3, label: 'Contact', value: '/contact' }
  ];
  
  // Navigate on selection
  function handleSelect(event) {
    const selected = event.detail.selectedItems[0];
    if (selected) {
      goto(selected.value);
    }
  }
  
  // Highlight current page
  $: currentIndex = pages.findIndex(p => p.value === $page.url.pathname);
  $: if (currentIndex >= 0) selectedIndices = [currentIndex];
&lt;/script&gt;

&lt;EnhancedSelect
  items={pages}
  {selectedIndices}
  on:select={handleSelect}
  placeholder="Navigate..."
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
      <p>Full keyboard accessibility (WCAG 2.2 AA compliant):</p>
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
            <td><code>PageUp</code> / <code>PageDown</code></td>
            <td>Jump 10 options up/down</td>
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
            <td><code>Ctrl+A</code> (multi-select)</td>
            <td>Select all options</td>
          </tr>
          <tr>
            <td><code>Type ahead</code></td>
            <td>Jump to option starting with typed letter</td>
          </tr>
        </tbody>
      </table>
      
      <h3>Multi-Select Range Selection</h3>
      <ul>
        <li><code>Shift + ↑/↓</code> - Range selection</li>
        <li><code>Ctrl/Cmd + Click</code> - Toggle individual items</li>
        <li><code>Shift + Home/End</code> - Select from current to first/last</li>
      </ul>
      
      <h3>Multi-Select Display Modes</h3>
      <p>Control badge scrolling behavior with <code>multiSelectDisplay</code> config:</p>
      <pre><code class="language-javascript">{
  multiSelectDisplay: {
    mode: 'wrap',       // 'wrap' | 'horizontal' | 'vertical'
    maxHeight: '160px', // used by vertical / horizontal modes
    overflowX: 'hidden',
    overflowY: 'hidden',
    dragScroll: true    // Enable drag-to-scroll (horizontal mode)
  }
}</code></pre>
      <p><strong>Display Modes:</strong></p>
      <ul>
        <li><strong>wrap</strong> (default) - Badges wrap naturally and grow the input shell without an internal chip scrollbar</li>
        <li><strong>horizontal</strong> - Chips stay on one row, the trigger height stays stable, and the chip row scrolls horizontally under the fixed action controls</li>
        <li><strong>vertical</strong> - Badges still wrap, but the chip area is constrained to <code>maxHeight</code> and scrolls vertically before the arrow / clear-control region</li>
      </ul>
      <p><strong>Important:</strong> do not rely on overflow variables alone. Use <code>multiSelectDisplay.mode</code> so Smilodon also switches wrapping, input sizing, scrollbar placement, reserved action-area spacing, and drag-scroll behavior.</p>

      <h3>Disabled / Dimmed Options</h3>
      <p>Options with <code>disabled: true</code> are dimmed and non-selectable by default. They also skip hover styling and keyboard activation unless you opt into a different behavior.</p>
      <pre><code class="language-javascript">select.updateConfig({
  selection: {
    disabledOptionBehavior: {
      hoverable: true,
      focusable: true,
      selectable: false,
    },
  },
});</code></pre>
      <p>Use <code>styles.disabledOption</code>, <code>classMap.disabled</code>, or the <code>--select-option-disabled-*</code> tokens to style the dimmed state.</p>

      <h3>Selected Indicator and Click-State Styling</h3>
      <p>You no longer need to target internal <code>::before</code> selectors just to hide the selected-side indicator. Use the supported controls instead:</p>
      <pre><code class="language-javascript">select.updateConfig({
  selection: {
    showSelectedIndicator: false,
  },
  styles: {
    selectedIndicator: {
      width: '4px',
      background: '#2563eb',
      right: '0',
      left: 'auto',
    },
  },
});</code></pre>
      <p>The default option pressed transform and active outline are also disabled now, so options no longer add the older click animation / border unless you set those tokens explicitly.</p>
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

    <div class="doc-section">
      <h2>Testing Strategy by Layer</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Layer</th>
            <th>What to test</th>
            <th>Typical tools</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Unit</td>
            <td>Selection logic, search behavior, event payloads</td>
            <td>Vitest, Jest</td>
          </tr>
          <tr>
            <td>Adapter contract</td>
            <td>Framework wrapper behavior matches core expectations</td>
            <td>Vitest + framework test utils</td>
          </tr>
          <tr>
            <td>Browser E2E</td>
            <td>Keyboard navigation, focus, scrolling, real DOM interaction</td>
            <td>Playwright, Cypress</td>
          </tr>
          <tr>
            <td>Accessibility</td>
            <td>ARIA, focus order, announcements, contrast</td>
            <td>axe + manual screen reader checks</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="doc-section">
      <h2>What Good Tests Assert</h2>
      <ul>
        <li>The placeholder is visible before selection.</li>
        <li>Opening the dropdown updates the correct ARIA state.</li>
        <li>Disabled items cannot be selected by mouse or keyboard.</li>
        <li><code>onSelect</code> receives the expected items and indices.</li>
        <li>Search results replace stale results correctly.</li>
        <li>Virtualized lists still reveal the intended option during navigation.</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Manual QA Checklist</h2>
      <ol>
        <li>Mouse: open, hover, select, clear.</li>
        <li>Keyboard: Enter, Space, arrows, Home/End, Escape, Tab.</li>
        <li>Search: empty state, common match, no-result state, cleared query.</li>
        <li>Theming: light mode, dark mode, and any framework utility styling.</li>
        <li>Scale: small list, medium list, and a large virtualized list.</li>
      </ol>
    </div>

    <div class="doc-section">
      <h2>Mocked Network Search Example</h2>
      <pre><code class="language-tsx">test('updates results from remote search', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => [
      { id: 1, label: 'Ada Lovelace', value: 'ada' }
    ]
  });

  render(&lt;NativeSelect searchable items={[]} onSearch={handleSearch} /&gt;);

  fireEvent.click(screen.getByRole('combobox'));
  fireEvent.change(screen.getByPlaceholderText('Search...'), {
    target: { value: 'Ada' }
  });

  expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
});</code></pre>
    </div>

    <div class="doc-section">
      <h2>Virtualization E2E Assertion Example</h2>
      <pre><code class="language-typescript">test('can navigate to a far item in a virtualized list', async ({ page }) => {
  await page.goto('/');
  await page.click('enhanced-select');

  for (let i = 0; i &lt; 25; i++) {
    await page.keyboard.press('ArrowDown');
  }

  await page.keyboard.press('Enter');
  await expect(page.locator('enhanced-select')).toContainText('Item 26');
});</code></pre>
      <p>The exact selector strategy may vary, but the goal is to validate behavior rather than implementation details.</p>
    </div>

    <div class="doc-section">
      <h2>Accessibility Review Notes</h2>
      <ul>
        <li>Automated tools catch many issues, but not all announcement problems.</li>
        <li>Manual checks with screen readers are especially important when custom renderers are involved.</li>
        <li>Keyboard-only testing should be part of every release cycle, not just accessibility audits.</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Regression Areas Worth Snapshotting</h2>
      <ul>
        <li>selected and hover states</li>
        <li>dark mode token coverage</li>
        <li>group headers and separators</li>
        <li>multi-select chip layouts</li>
        <li>custom option renderer layouts</li>
      </ul>
    </div>
  `,
  
  algorithms: `
    <h1>Algorithms</h1>
    
    <div class="doc-section">
      <h2>Virtualization Algorithm</h2>
      <p>Smilodon uses a sophisticated virtualization algorithm to render only visible items, enabling smooth 60 FPS scrolling with datasets of any size.</p>
      
      <h3>Key Concepts</h3>
      <ul>
        <li><strong>Viewport:</strong> The visible area of the dropdown (calculated from scroll position and container height)</li>
        <li><strong>Buffer:</strong> Additional items rendered above/below viewport to prevent white space during fast scrolling</li>
        <li><strong>Recycling:</strong> DOM nodes are reused as items scroll (no create/destroy thrashing)</li>
        <li><strong>Anchor Point:</strong> Maintains scroll position during updates to prevent jumping</li>
        <li><strong>Transform Optimization:</strong> Uses CSS <code>transform</code> for GPU-accelerated positioning</li>
      </ul>
      
      <h3>Algorithm Pseudocode</h3>
      <pre><code class="language-javascript">function virtualizeList(scrollTop, containerHeight, items, itemHeight, bufferSize) {
  // Step 1: Calculate viewport boundaries
  const viewportStart = scrollTop;
  const viewportEnd = scrollTop + containerHeight;
  
  // Step 2: Calculate visible item indices
  const firstVisibleIndex = Math.floor(viewportStart / itemHeight);
  const lastVisibleIndex = Math.ceil(viewportEnd / itemHeight);
  
  // Step 3: Add buffer zones
  const renderStart = Math.max(0, firstVisibleIndex - bufferSize);
  const renderEnd = Math.min(items.length, lastVisibleIndex + bufferSize);
  
  // Step 4: Calculate offset for positioning
  const offsetY = renderStart * itemHeight;
  
  // Step 5: Extract items to render
  const visibleItems = items.slice(renderStart, renderEnd);
  
  // Step 6: Return render information
  return {
    items: visibleItems,
    startIndex: renderStart,
    endIndex: renderEnd,
    offsetY: offsetY,
    totalHeight: items.length * itemHeight
  };
}

// Usage on scroll
function handleScroll(event) {
  const scrollTop = event.target.scrollTop;
  const renderInfo = virtualizeList(
    scrollTop,
    container.clientHeight,
    allItems,
    40, // itemHeight
    5   // bufferSize
  );
  
  // Render only visible items
  renderItems(renderInfo.items, renderInfo.offsetY);
}
      </code></pre>
      
      <h3>Detailed Implementation</h3>
      
      <h4>1. Viewport Calculation</h4>
      <pre><code class="language-javascript">class VirtualScroller {
  calculateViewport(scrollTop) {
    // Get viewport boundaries
    const viewportHeight = this.container.clientHeight;
    const viewportStart = scrollTop;
    const viewportEnd = scrollTop + viewportHeight;
    
    // Convert pixel positions to item indices
    const firstVisibleIndex = Math.floor(viewportStart / this.itemHeight);
    const lastVisibleIndex = Math.ceil(viewportEnd / this.itemHeight);
    
    // Clamp to valid range
    const startIndex = Math.max(0, firstVisibleIndex);
    const endIndex = Math.min(this.items.length - 1, lastVisibleIndex);
    
    return { startIndex, endIndex };
  }
}
      </code></pre>
      
      <h4>2. DOM Recycling</h4>
      <pre><code class="language-javascript">class DOMRecycler {
  constructor(maxNodes = 20) {
    this.pool = [];
    this.maxNodes = maxNodes;
  }
  
  acquire() {
    // Reuse existing node or create new one
    return this.pool.pop() || document.createElement('div');
  }
  
  release(node) {
    // Return node to pool for reuse
    if (this.pool.length < this.maxNodes) {
      // Clean up node
      node.innerHTML = '';
      node.className = '';
      node.removeAttribute('style');
      
      this.pool.push(node);
    }
  }
  
  clear() {
    this.pool = [];
  }
}
      </code></pre>
      
      <h4>3. Scroll Position Anchoring</h4>
      <pre><code class="language-javascript">class ScrollAnchor {
  constructor(container) {
    this.container = container;
    this.anchoredIndex = 0;
    this.anchoredOffset = 0;
  }
  
  capture() {
    // Save current scroll position
    const scrollTop = this.container.scrollTop;
    this.anchoredIndex = Math.floor(scrollTop / this.itemHeight);
    this.anchoredOffset = scrollTop % this.itemHeight;
  }
  
  restore() {
    // Restore scroll position after data changes
    const targetScrollTop = 
      (this.anchoredIndex * this.itemHeight) + this.anchoredOffset;
    
    this.container.scrollTop = targetScrollTop;
  }
  
  updateAndRestore(newItems) {
    // Update items while maintaining scroll position
    this.capture();
    this.items = newItems;
    this.render();
    this.restore();
  }
}
      </code></pre>
      
      <h3>Performance Characteristics</h3>
      
      <h4>Time Complexity</h4>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Operation</th>
            <th>Complexity</th>
            <th>Explanation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Calculate visible range</td>
            <td>O(1)</td>
            <td>Simple arithmetic operations</td>
          </tr>
          <tr>
            <td>Render visible items</td>
            <td>O(k)</td>
            <td>k = buffer size (constant, typically 20)</td>
          </tr>
          <tr>
            <td>Scroll event</td>
            <td>O(1)</td>
            <td>Throttled, only reorders existing DOM</td>
          </tr>
          <tr>
            <td>Search/filter</td>
            <td>O(n)</td>
            <td>Must scan all items, but remains responsive</td>
          </tr>
        </tbody>
      </table>
      
      <h4>Space Complexity</h4>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Complexity</th>
            <th>Explanation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>DOM nodes</td>
            <td>O(1)</td>
            <td>Constant ~20 nodes regardless of data size</td>
          </tr>
          <tr>
            <td>Data storage</td>
            <td>O(n)</td>
            <td>Must store all items in memory</td>
          </tr>
          <tr>
            <td>Recycler pool</td>
            <td>O(1)</td>
            <td>Fixed pool size</td>
          </tr>
        </tbody>
      </table>
      
      <h3>Benchmarks</h3>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Dataset Size</th>
            <th>Initial Render</th>
            <th>Scroll (60 FPS target)</th>
            <th>Memory (DOM only)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>100 items</td>
            <td>&lt;10ms</td>
            <td>&lt;16ms</td>
            <td>~5 DOM nodes</td>
          </tr>
          <tr>
            <td>1,000 items</td>
            <td>&lt;10ms</td>
            <td>&lt;16ms</td>
            <td>~20 DOM nodes</td>
          </tr>
          <tr>
            <td>10,000 items</td>
            <td>&lt;10ms</td>
            <td>&lt;16ms</td>
            <td>~20 DOM nodes</td>
          </tr>
          <tr>
            <td>100,000 items</td>
            <td>&lt;10ms</td>
            <td>&lt;16ms</td>
            <td>~20 DOM nodes</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Search Algorithm</h2>
      <p>Smilodon uses an optimized fuzzy search algorithm with debouncing for responsive filtering.</p>
      
      <h3>Fuzzy Match Algorithm</h3>
      <pre><code class="language-javascript">function fuzzyMatch(pattern, text, caseSensitive = false) {
  // Convert to lowercase if case-insensitive
  if (!caseSensitive) {
    pattern = pattern.toLowerCase();
    text = text.toLowerCase();
  }
  
  let patternIndex = 0;
  let textIndex = 0;
  let score = 0;
  let consecutiveMatches = 0;
  
  // Check if all pattern characters appear in order
  while (patternIndex < pattern.length && textIndex < text.length) {
    if (pattern[patternIndex] === text[textIndex]) {
      // Character matches
      patternIndex++;
      consecutiveMatches++;
      
      // Bonus points for consecutive matches
      score += 1 + consecutiveMatches;
    } else {
      // No match, reset consecutive counter
      consecutiveMatches = 0;
    }
    textIndex++;
  }
  
  // Return match result and score
  return {
    matched: patternIndex === pattern.length,
    score: score,
    // Normalize score by pattern length
    normalizedScore: score / pattern.length
  };
}

// Example usage
fuzzyMatch('jsc', 'JavaScript');      // { matched: true, score: 5 }
fuzzyMatch('jsc', 'Java');            // { matched: false, score: 2 }
fuzzyMatch('fb', 'FooBar');           // { matched: true, score: 3 }
      </code></pre>
      
      <h3>Debounced Search</h3>
      <pre><code class="language-javascript">function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Search with debouncing
class DebouncedSearch {
  constructor(searchFn, debounceMs = 300) {
    this.debouncedSearch = debounce(searchFn, debounceMs);
  }
  
  search(query) {
    // Debounced: only executes after user stops typing
    this.debouncedSearch(query);
  }
}
      </code></pre>
      
      <h3>Optimized Filtering</h3>
      <pre><code class="language-javascript">function filterItems(items, query, options = {}) {
  if (!query) return items;
  
  const results = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const text = item.label || String(item);
    
    const match = fuzzyMatch(query, text, options.caseSensitive);
    
    if (match.matched) {
      results.push({
        item: item,
        score: match.normalizedScore,
        index: i
      });
    }
  }
  
  // Sort by score (highest first)
  results.sort((a, b) => b.score - a.score);
  
  return results.map(r => r.item);
}
      </code></pre>
      
      <h3>Performance Analysis</h3>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Operation</th>
            <th>Time Complexity</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Fuzzy match single string</td>
            <td>O(m + n)</td>
            <td>m = pattern length, n = text length</td>
          </tr>
          <tr>
            <td>Filter array</td>
            <td>O(n × m)</td>
            <td>n = items, m = avg string length</td>
          </tr>
          <tr>
            <td>Sort results</td>
            <td>O(k log k)</td>
            <td>k = matched items (typically &lt;&lt; n)</td>
          </tr>
          <tr>
            <td>Debounce delay</td>
            <td>O(1)</td>
            <td>Timer management only</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Selection State Algorithm</h2>
      
      <h3>Single Select State</h3>
      <pre><code class="language-javascript">class SingleSelectState {
  constructor() {
    this.selectedIndex = null;
  }
  
  select(index) {
    // Toggle if same item clicked
    if (this.selectedIndex === index) {
      this.selectedIndex = null;
    } else {
      this.selectedIndex = index;
    }
    
    return this.selectedIndex;
  }
  
  getValue(items) {
    return this.selectedIndex !== null ? items[this.selectedIndex] : null;
  }
  
  clear() {
    this.selectedIndex = null;
  }
}
      </code></pre>
      
      <h3>Multi Select State</h3>
      <pre><code class="language-javascript">class MultiSelectState {
  constructor(maxSelections = Infinity) {
    this.selectedIndices = new Set();  // Use Set for O(1) lookups
    this.maxSelections = maxSelections;
  }
  
  toggle(index) {
    if (this.selectedIndices.has(index)) {
      // Deselect
      this.selectedIndices.delete(index);
      return true;
    } else {
      // Select (if under limit)
      if (this.selectedIndices.size < this.maxSelections) {
        this.selectedIndices.add(index);
        return true;
      }
      return false;  // Limit reached
    }
  }
  
  isSelected(index) {
    return this.selectedIndices.has(index);  // O(1) lookup
  }
  
  getValues(items) {
    return Array.from(this.selectedIndices).map(i => items[i]);
  }
  
  clear() {
    this.selectedIndices.clear();
  }
}
      </code></pre>
      
      <h3>Complexity Analysis</h3>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Operation</th>
            <th>Single Select</th>
            <th>Multi Select (Set)</th>
            <th>Multi Select (Array)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Select/toggle</td>
            <td>O(1)</td>
            <td>O(1)</td>
            <td>O(n)</td>
          </tr>
          <tr>
            <td>Check if selected</td>
            <td>O(1)</td>
            <td>O(1)</td>
            <td>O(n)</td>
          </tr>
          <tr>
            <td>Get all values</td>
            <td>O(1)</td>
            <td>O(k)</td>
            <td>O(k)</td>
          </tr>
          <tr>
            <td>Clear</td>
            <td>O(1)</td>
            <td>O(1)</td>
            <td>O(1)</td>
          </tr>
        </tbody>
      </table>
      
      <p><em>Note: k = number of selected items (typically small). Using Set provides O(1) operations vs O(n) for arrays.</em></p>
    </div>
    
    <div class="doc-section">
      <h2>Keyboard Navigation Algorithm</h2>
      
      <h3>Type-Ahead Search</h3>
      <pre><code class="language-javascript">class TypeAheadSearch {
  constructor(items, timeout = 1000) {
    this.items = items;
    this.buffer = '';
    this.timeout = timeout;
    this.timer = null;
  }
  
  handleKey(char) {
    // Add character to buffer
    this.buffer += char.toLowerCase();
    
    // Reset buffer after timeout
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.buffer = '';
    }, this.timeout);
    
    // Find first matching item
    return this.findMatch();
  }
  
  findMatch() {
    for (let i = 0; i < this.items.length; i++) {
      const text = this.items[i].label.toLowerCase();
      if (text.startsWith(this.buffer)) {
        return i;
      }
    }
    return -1;  // No match
  }
}

// Example: User types "ca" quickly → jumps to "California"
      </code></pre>
      
      <h3>Arrow Key Navigation</h3>
      <pre><code class="language-javascript">class KeyboardNavigator {
  constructor(items) {
    this.items = items;
    this.focusedIndex = -1;
  }
  
  handleKey(key) {
    switch (key) {
      case 'ArrowDown':
        // Move to next item (wrap around)
        this.focusedIndex = (this.focusedIndex + 1) % this.items.length;
        break;
        
      case 'ArrowUp':
        // Move to previous item (wrap around)
        this.focusedIndex = (this.focusedIndex - 1 + this.items.length) % this.items.length;
        break;
        
      case 'Home':
        // Jump to first item
        this.focusedIndex = 0;
        break;
        
      case 'End':
        // Jump to last item
        this.focusedIndex = this.items.length - 1;
        break;
        
      case 'PageDown':
        // Jump down 10 items
        this.focusedIndex = Math.min(this.items.length - 1, this.focusedIndex + 10);
        break;
        
      case 'PageUp':
        // Jump up 10 items
        this.focusedIndex = Math.max(0, this.focusedIndex - 10);
        break;
    }
    
    return this.focusedIndex;
  }
}
      </code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Grouping Algorithm</h2>
      
      <h3>Group Items</h3>
      <pre><code class="language-javascript">function groupItems(items, groupBy) {
  const groups = new Map();
  
  // Group items by key
  items.forEach(item => {
    const key = typeof groupBy === 'function' 
      ? groupBy(item) 
      : item[groupBy];
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    
    groups.get(key).push(item);
  });
  
  // Convert to array format with headers
  const result = [];
  groups.forEach((items, groupName) => {
    // Add group header
    result.push({
      type: 'group-header',
      label: groupName,
      groupSize: items.length
    });
    
    // Add group items
    items.forEach(item => {
      result.push({
        type: 'item',
        ...item,
        groupName: groupName
      });
    });
  });
  
  return result;
}

// Example
const users = [
  { name: 'Alice', department: 'Engineering' },
  { name: 'Bob', department: 'Sales' },
  { name: 'Carol', department: 'Engineering' },
];

groupItems(users, 'department');
// Result:
// [
//   { type: 'group-header', label: 'Engineering', groupSize: 2 },
//   { type: 'item', name: 'Alice', department: 'Engineering' },
//   { type: 'item', name: 'Carol', department: 'Engineering' },
//   { type: 'group-header', label: 'Sales', groupSize: 1 },
//   { type: 'item', name: 'Bob', department: 'Sales' },
// ]
      </code></pre>
      
      <h3>Complexity: O(n) for grouping, O(n log n) if sorting groups</h3>
    </div>
    
    <div class="doc-section">
      <h2>Performance Budget</h2>
      <p>All algorithms are designed to meet these performance targets:</p>
      
      <table class="doc-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Target</th>
            <th>Measurement</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Initial Render</td>
            <td>&lt;50ms</td>
            <td>Time to interactive</td>
          </tr>
          <tr>
            <td>Scroll (60 FPS)</td>
            <td>&lt;16ms per frame</td>
            <td>RequestAnimationFrame timing</td>
          </tr>
          <tr>
            <td>Search response</td>
            <td>&lt;100ms perceived</td>
            <td>Debounce delay + filter time</td>
          </tr>
          <tr>
            <td>Selection change</td>
            <td>&lt;16ms</td>
            <td>Click to visual feedback</td>
          </tr>
          <tr>
            <td>Memory (DOM)</td>
            <td>&lt;500KB</td>
            <td>Constant regardless of data size</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  
  paradigms: `
    <h1>Design Paradigms</h1>
    
    <div class="doc-section">
      <h2>Core Principles</h2>
      <p>Smilodon is built on five foundational principles that guide every architectural and implementation decision.</p>
      
      <h3>1. Performance First</h3>
      <p>Every decision prioritizes runtime performance and user experience. No feature ships without meeting strict performance budgets.</p>
      
      <h4>Performance Budgets</h4>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Budget</th>
            <th>Enforcement</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Bundle Size (core)</td>
            <td>&lt;15KB gzipped</td>
            <td>CI fails if exceeded</td>
          </tr>
          <tr>
            <td>Initial Render</td>
            <td>&lt;50ms</td>
            <td>Automated performance tests</td>
          </tr>
          <tr>
            <td>Scroll (60 FPS)</td>
            <td>&lt;16ms per frame</td>
            <td>Frame timing monitoring</td>
          </tr>
          <tr>
            <td>Memory (10K items)</td>
            <td>&lt;500KB DOM</td>
            <td>Memory profiling in CI</td>
          </tr>
        </tbody>
      </table>
      
      <h4>Optimization Techniques</h4>
      <ul>
        <li><strong>Virtualization:</strong> Render only visible items, O(1) complexity</li>
        <li><strong>Debouncing:</strong> Throttle expensive operations (search, scroll)</li>
        <li><strong>DOM Recycling:</strong> Reuse nodes instead of create/destroy</li>
        <li><strong>RAF Scheduling:</strong> Defer non-critical work with requestAnimationFrame</li>
        <li><strong>Event Delegation:</strong> One listener for all options</li>
        <li><strong>CSS Transform:</strong> GPU-accelerated positioning</li>
        <li><strong>Lazy Loading:</strong> Load features only when needed</li>
      </ul>
      
      <h4>Example: Performance-First Architecture</h4>
      <pre><code class="language-javascript">// Bad: Creates DOM nodes for all items
function renderAll(items) {
  return items.map(item => 
    createElement('div', {}, item.label)
  );
}

// Good: Virtualization with constant DOM size
function renderVirtual(items, viewport) {
  const visibleItems = getVisibleItems(items, viewport);
  return visibleItems.map(item => 
    recycleNode(item)  // Reuse existing DOM nodes
  );
}

// Bad: No debouncing, runs on every keystroke
input.addEventListener('input', (e) => {
  filterItems(allItems, e.target.value);  // Expensive!
});

// Good: Debounced search
input.addEventListener('input', debounce((e) => {
  filterItems(allItems, e.target.value);
}, 300));
      </code></pre>
      
      <h3>2. Framework Agnostic Core</h3>
      <p>One Web Component powers all framework adapters. This ensures consistent behavior, reduces maintenance burden, and minimizes bundle size.</p>
      
      <h4>Why Web Components?</h4>
      <ul>
        <li><strong>Universal Compatibility:</strong> Works in any framework or vanilla JS</li>
        <li><strong>Single Source of Truth:</strong> One implementation, zero behavior drift</li>
        <li><strong>Smaller Bundles:</strong> Shared core = no duplicate code across frameworks</li>
        <li><strong>Future-Proof:</strong> Based on web standards, not framework APIs</li>
        <li><strong>Shadow DOM:</strong> Style encapsulation prevents CSS conflicts</li>
      </ul>
      
      <h4>Architecture Diagram</h4>
      <pre><code class="language-plaintext">
┌────────────────────────────────────────────────┐
│  Application Logic (Framework-Specific)        │
│  - State management                             │
│  - Data fetching                                │
│  - Business logic                               │
└──────────────┬─────────────────────────────────┘
               │ Props & Callbacks
               ▼
┌────────────────────────────────────────────────┐
│  Framework Adapter (~2KB each)                  │
│  @smilodon/react  |  @smilodon/vue             │
│  @smilodon/svelte |  @smilodon/solid           │
│  - Props mapping                                │
│  - Event bridging                               │
│  - Lifecycle hooks                              │
└──────────────┬─────────────────────────────────┘
               │ DOM Properties & Events
               ▼
┌────────────────────────────────────────────────┐
│  Universal Core (~15KB) @smilodon/core         │
│  <enhanced-select> Web Component               │
│  - All rendering logic                          │
│  - All user interactions                        │
│  - All accessibility                            │
│  - All performance optimizations                │
└────────────────────────────────────────────────┘
      </code></pre>
      
      <h4>Bundle Size Comparison</h4>
      <pre><code class="language-plaintext">Traditional Approach (separate implementations):
  React Select:  30KB
  Vue Select:    28KB
  Svelte Select: 25KB
  Total:         83KB (if using all)

Smilodon Approach (shared core):
  Core:          15KB (shared)
  React Adapter:  2KB
  Vue Adapter:    2KB
  Svelte Adapter: 2KB
  Total:         21KB (if using all)

Savings: 62KB (75% smaller)
      </code></pre>
      
      <h3>3. Progressive Enhancement</h3>
      <p>Basic functionality works everywhere. Advanced features activate when supported.</p>
      
      <h4>Feature Detection</h4>
      <pre><code class="language-javascript">class ProgressiveFeatures {
  constructor() {
    // Detect available features
    this.features = {
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      customElements: 'customElements' in window,
      shadowDOM: 'attachShadow' in Element.prototype,
      cssCustomProperties: CSS.supports('--test', '0'),
    };
  }
  
  enableVirtualization() {
    if (this.features.intersectionObserver) {
      // Use IntersectionObserver for efficient scrolling
      return new VirtualizerV2();
    } else {
      // Fallback to scroll events
      return new VirtualizerV1();
    }
  }
  
  enableAnimations() {
    if (this.features.cssCustomProperties) {
      // Use modern CSS animations
      return 'css-animations';
    } else {
      // Fallback to JS animations
      return 'js-animations';
    }
  }
}
      </code></pre>
      
      <h4>Graceful Degradation</h4>
      <ul>
        <li><strong>No JavaScript:</strong> Falls back to native <code>&lt;select&gt;</code></li>
        <li><strong>No Shadow DOM:</strong> Uses light DOM with scoped styles</li>
        <li><strong>No IntersectionObserver:</strong> Falls back to scroll events</li>
        <li><strong>Old Browsers:</strong> Polyfills loaded conditionally</li>
      </ul>
      
      <pre><code class="language-html">&lt;!-- Progressive enhancement example --&gt;
&lt;enhanced-select&gt;
  &lt;!-- Fallback for no JavaScript --&gt;
  &lt;select&gt;
    &lt;option value="1"&gt;Option 1&lt;/option&gt;
    &lt;option value="2"&gt;Option 2&lt;/option&gt;
  &lt;/select&gt;
&lt;/enhanced-select&gt;

&lt;script&gt;
  // Feature detection
  if ('customElements' in window) {
    // Enhanced version available
    import('@smilodon/core');
  } else {
    // Native select already rendered
    console.log('Using native select');
  }
&lt;/script&gt;
      </code></pre>
      
      <h3>4. Accessibility by Default</h3>
      <p>ARIA patterns, keyboard navigation, and screen reader support are built-in, not add-ons. WCAG 2.1 AA compliance is mandatory for all features.</p>
      
      <h4>WCAG 2.1 AA Compliance</h4>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Criterion</th>
            <th>Level</th>
            <th>Implementation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1.1.1 Non-text Content</td>
            <td>A</td>
            <td>Alt text for icons, ARIA labels</td>
          </tr>
          <tr>
            <td>1.3.1 Info & Relationships</td>
            <td>A</td>
            <td>ARIA roles, semantic HTML</td>
          </tr>
          <tr>
            <td>1.4.3 Contrast</td>
            <td>AA</td>
            <td>4.5:1 text, 3:1 UI components</td>
          </tr>
          <tr>
            <td>2.1.1 Keyboard</td>
            <td>A</td>
            <td>Full keyboard navigation</td>
          </tr>
          <tr>
            <td>2.4.3 Focus Order</td>
            <td>A</td>
            <td>Logical tab order</td>
          </tr>
          <tr>
            <td>2.4.7 Focus Visible</td>
            <td>AA</td>
            <td>Clear focus indicators</td>
          </tr>
          <tr>
            <td>4.1.2 Name, Role, Value</td>
            <td>A</td>
            <td>ARIA attributes, live regions</td>
          </tr>
          <tr>
            <td>4.1.3 Status Messages</td>
            <td>AA</td>
            <td>Polite announcements</td>
          </tr>
        </tbody>
      </table>
      
      <h4>Accessibility Implementation</h4>
      <pre><code class="language-javascript">class AccessibilityCore {
  setupARIA() {
    // Combobox pattern
    this.root.setAttribute('role', 'combobox');
    this.root.setAttribute('aria-haspopup', 'listbox');
    this.root.setAttribute('aria-expanded', 'false');
    this.root.setAttribute('aria-controls', 'options-list');
    
    // Listbox
    this.list.setAttribute('role', 'listbox');
    this.list.setAttribute('aria-label', 'Available options');
    
    // Options
    this.options.forEach((option, index) => {
      option.setAttribute('role', 'option');
      option.setAttribute('id', \`option-\${index}\`);
      option.setAttribute('aria-selected', 'false');
    });
  }
  
  announceToScreenReader(message) {
    // Live region for announcements
    this.liveRegion.textContent = message;
    setTimeout(() => this.liveRegion.textContent = '', 1000);
  }
  
  handleKeyboard(event) {
    const actions = {
      'Enter': () => this.selectFocused(),
      'Space': () => this.selectFocused(),
      'Escape': () => this.close(),
      'ArrowDown': () => this.focusNext(),
      'ArrowUp': () => this.focusPrevious(),
      'Home': () => this.focusFirst(),
      'End': () => this.focusLast(),
    };
    
    const action = actions[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  }
}
      </code></pre>
      
      <h4>Screen Reader Testing</h4>
      <p>Tested with:</p>
      <ul>
        <li><strong>NVDA</strong> (Windows, Firefox/Chrome)</li>
        <li><strong>JAWS</strong> (Windows, Chrome/Edge)</li>
        <li><strong>VoiceOver</strong> (macOS, Safari)</li>
        <li><strong>TalkBack</strong> (Android, Chrome)</li>
      </ul>
      
      <h3>5. Customization without Complexity</h3>
      <p>Powerful styling options through CSS custom properties and shadow parts, without JavaScript configuration hell.</p>
      
      <h4>Three-Tier Styling System</h4>
      
      <ol>
        <li><strong>CSS Custom Properties:</strong> Theme tokens for colors, spacing, typography</li>
        <li><strong>Shadow Parts:</strong> Target specific elements with <code>::part()</code></li>
        <li><strong>Slots:</strong> Replace entire sections with custom HTML</li>
      </ol>
      
      <h4>CSS Custom Properties (Easiest)</h4>
      <pre><code class="language-css">/* Simple theming with custom properties */
enhanced-select {
  --smilodon-primary-color: #3b82f6;
  --smilodon-border-radius: 8px;
  --smilodon-font-size: 16px;
  --smilodon-option-padding: 12px;
}

/* Dark mode */
.dark enhanced-select {
  --smilodon-bg-color: #1f2937;
  --smilodon-text-color: #f9fafb;
  --smilodon-border-color: #374151;
}
      </code></pre>
      
      <h4>Shadow Parts (Advanced)</h4>
      <pre><code class="language-css">/* Target specific elements */
enhanced-select::part(trigger) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

enhanced-select::part(option):hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(4px);
  transition: all 0.2s ease;
}

enhanced-select::part(chip) {
  background: #3b82f6;
  border-radius: 16px;
  padding: 4px 12px;
}
      </code></pre>
      
      <h4>Slots (Most Powerful)</h4>
      <pre><code class="language-html">&lt;enhanced-select&gt;
  &lt;!-- Custom option rendering --&gt;
  &lt;template slot="option" let-item="item"&gt;
    &lt;div class="custom-option"&gt;
      &lt;img src="{item.avatar}" alt="" /&gt;
      &lt;div&gt;
        &lt;div class="name"&gt;{item.name}&lt;/div&gt;
        &lt;div class="email"&gt;{item.email}&lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  &lt;/template&gt;
  
  &lt;!-- Custom empty state --&gt;
  &lt;div slot="empty"&gt;
    &lt;p&gt;No results found&lt;/p&gt;
    &lt;button&gt;Create new&lt;/button&gt;
  &lt;/div&gt;
&lt;/enhanced-select&gt;
      </code></pre>
      
      <h4>Comparison with Configuration-Heavy Approaches</h4>
      <pre><code class="language-jsx">// Bad: Configuration hell
&lt;OtherSelect
  options={options}
  styles={{
    control: (base) => ({ ...base, borderRadius: 8 }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#f0f0f0' : 'white',
      padding: '12px',
    }),
    multiValue: (base) => ({ ...base, borderRadius: 16 }),
    // 50+ more style functions...
  }}
  components={{
    Option: CustomOption,
    MultiValue: CustomChip,
    // 20+ more component overrides...
  }}
/&gt;

// Good: Simple CSS
&lt;EnhancedSelect items={options} /&gt;

&lt;style&gt;
  enhanced-select {
    --smilodon-border-radius: 8px;
    --smilodon-option-padding: 12px;
  }
  
  enhanced-select::part(option):hover {
    background: #f0f0f0;
  }
  
  enhanced-select::part(chip) {
    border-radius: 16px;
  }
&lt;/style&gt;
      </code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Design Patterns</h2>
      
      <h3>Observer Pattern</h3>
      <p>Used for state changes and event notifications.</p>
      
      <pre><code class="language-javascript">class ObservableState {
  constructor() {
    this.observers = [];
    this.state = {};
  }
  
  subscribe(observer) {
    this.observers.push(observer);
    return () => {
      this.observers = this.observers.filter(o => o !== observer);
    };
  }
  
  notify(change) {
    this.observers.forEach(observer => observer(change));
  }
  
  setState(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    
    if (oldValue !== value) {
      this.notify({ key, oldValue, newValue: value });
    }
  }
}
      </code></pre>
      
      <h3>Strategy Pattern</h3>
      <p>Used for swappable algorithms (search, filtering, rendering).</p>
      
      <pre><code class="language-javascript">// Different search strategies
class ExactMatchStrategy {
  match(query, text) {
    return text.includes(query);
  }
}

class FuzzyMatchStrategy {
  match(query, text) {
    return fuzzyMatch(query, text).matched;
  }
}

class SearchEngine {
  constructor(strategy = new ExactMatchStrategy()) {
    this.strategy = strategy;
  }
  
  setStrategy(strategy) {
    this.strategy = strategy;
  }
  
  search(query, items) {
    return items.filter(item => 
      this.strategy.match(query, item.label)
    );
  }
}
      </code></pre>
      
      <h3>Factory Pattern</h3>
      <p>Used for creating framework-specific adapters.</p>
      
      <pre><code class="language-javascript">class AdapterFactory {
  static create(framework) {
    switch (framework) {
      case 'react':
        return new ReactAdapter();
      case 'vue':
        return new VueAdapter();
      case 'svelte':
        return new SvelteAdapter();
      default:
        return new VanillaAdapter();
    }
  }
}
      </code></pre>
      
      <h3>Adapter Pattern</h3>
      <p>Core pattern: Framework adapters translate between framework APIs and core Web Component.</p>
      
      <pre><code class="language-javascript">// React Adapter
class ReactAdapter {
  adapt(Component) {
    return forwardRef((props, ref) => {
      const elementRef = useRef();
      
      // Sync props to DOM properties
      useEffect(() => {
        Object.entries(props).forEach(([key, value]) => {
          if (elementRef.current && !isEventHandler(key)) {
            elementRef.current[key] = value;
          }
        });
      }, [props]);
      
      // Expose imperative API
      useImperativeHandle(ref, () => ({
        open: () => elementRef.current?.open(),
        close: () => elementRef.current?.close(),
        focus: () => elementRef.current?.focus(),
      }));
      
      return <Component ref={elementRef} />;
    });
  }
}
      </code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Architectural Decisions & Tradeoffs</h2>
      
      <h3>Decision: Web Components over Pure JavaScript</h3>
      <ul>
        <li><strong>✓ Pro:</strong> Framework-agnostic, standards-based</li>
        <li><strong>✓ Pro:</strong> Shadow DOM provides style encapsulation</li>
        <li><strong>✓ Pro:</strong> Smaller bundle size (shared runtime)</li>
        <li><strong>✗ Con:</strong> Requires polyfills for IE11</li>
        <li><strong>✗ Con:</strong> Shadow DOM CSS limitations (piercing)</li>
        <li><strong>Decision:</strong> Worth it for long-term maintainability</li>
      </ul>
      
      <h3>Decision: Virtualization Always On (for large lists)</h3>
      <ul>
        <li><strong>✓ Pro:</strong> Constant performance regardless of size</li>
        <li><strong>✓ Pro:</strong> Handles 100K+ items easily</li>
        <li><strong>✗ Con:</strong> Slight complexity for small lists</li>
        <li><strong>✗ Con:</strong> Requires fixed item heights (ideally)</li>
        <li><strong>Decision:</strong> Auto-enable at threshold (100 items)</li>
      </ul>
      
      <h3>Decision: CSS Custom Properties over JS Configuration</h3>
      <ul>
        <li><strong>✓ Pro:</strong> Standard CSS, no learning curve</li>
        <li><strong>✓ Pro:</strong> Supports CSS features (media queries, transitions)</li>
        <li><strong>✓ Pro:</strong> Better performance (no JS execution)</li>
        <li><strong>✗ Con:</strong> Less discoverable than IDE autocomplete</li>
        <li><strong>Decision:</strong> Documentation quality is key</li>
      </ul>
      
      <h3>Decision: Events over Callbacks</h3>
      <ul>
        <li><strong>✓ Pro:</strong> Standard DOM API</li>
        <li><strong>✓ Pro:</strong> Supports event bubbling</li>
        <li><strong>✓ Pro:</strong> Framework adapters handle conversion</li>
        <li><strong>✗ Con:</strong> Slightly more verbose in vanilla JS</li>
        <li><strong>Decision:</strong> Core uses events, adapters provide callbacks</li>
      </ul>
    </div>
    
    <div class="doc-section">
      <h2>Comparison with Alternative Approaches</h2>
      
      <h3>vs. Framework-Specific Libraries</h3>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Aspect</th>
            <th>Smilodon</th>
            <th>Framework-Specific</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Bundle Size</td>
            <td>15KB core + 2KB adapter</td>
            <td>25-30KB per framework</td>
          </tr>
          <tr>
            <td>Consistency</td>
            <td>Identical across frameworks</td>
            <td>Behavior differs</td>
          </tr>
          <tr>
            <td>Maintenance</td>
            <td>One codebase</td>
            <td>Multiple codebases</td>
          </tr>
          <tr>
            <td>Learning Curve</td>
            <td>Learn once, use everywhere</td>
            <td>Learn per framework</td>
          </tr>
        </tbody>
      </table>
      
      <h3>vs. Headless UI Libraries</h3>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Aspect</th>
            <th>Smilodon</th>
            <th>Headless UI</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Styling</td>
            <td>Styled with customization</td>
            <td>Unstyled, full control</td>
          </tr>
          <tr>
            <td>Setup Time</td>
            <td>Works immediately</td>
            <td>Requires styling work</td>
          </tr>
          <tr>
            <td>Flexibility</td>
            <td>High (CSS + parts + slots)</td>
            <td>Maximum (no opinions)</td>
          </tr>
          <tr>
            <td>Bundle Size</td>
            <td>15KB (includes styles)</td>
            <td>5-10KB (logic only)</td>
          </tr>
        </tbody>
      </table>
      
      <h3>vs. Native <code>&lt;select&gt;</code></h3>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Aspect</th>
            <th>Smilodon</th>
            <th>Native Select</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Styling Control</td>
            <td>Full control</td>
            <td>Limited</td>
          </tr>
          <tr>
            <td>Multi-select UX</td>
            <td>Chips/badges</td>
            <td>Ctrl+Click (poor UX)</td>
          </tr>
          <tr>
            <td>Search</td>
            <td>Built-in with filtering</td>
            <td>Type-ahead only</td>
          </tr>
          <tr>
            <td>Large Lists</td>
            <td>Virtualized (fast)</td>
            <td>Slow rendering</td>
          </tr>
          <tr>
            <td>Custom Rendering</td>
            <td>Yes (slots, render props)</td>
            <td>No</td>
          </tr>
          <tr>
            <td>Performance</td>
            <td>Optimized</td>
            <td>Native</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  
  'single-select': `
    <h1>Single Select Mode</h1>
    
    <div class="doc-section">
      <h2>Overview</h2>
      <p>Single select mode allows users to choose exactly one option from the list. This is the default mode and most common use case for select components.</p>
      <p>It is the right fit for classic form fields such as country, assignee, category, or status pickers. Because only one item can be active at a time, it also tends to be the easiest mode to reason about for validation, submit payloads, and keyboard behavior.</p>
    </div>
    
    <div class="doc-section">
      <h2>Basic Usage</h2>
      
      <h3>React</h3>
      <pre><code class="language-tsx">import { EnhancedSelect } from '@smilodon/react';
import { useState } from 'react';

function SingleSelectExample() {
  const [selectedIndex, setSelectedIndex] = useState(null);
  
  const items = [
    { id: 1, label: 'Apple', value: 'apple' },
    { id: 2, label: 'Banana', value: 'banana' },
    { id: 3, label: 'Cherry', value: 'cherry' }
  ];
  
  return (
    <EnhancedSelect
      mode="single"  // or omit (single is default)
      items={items}
      selectedIndices={selectedIndex !== null ? [selectedIndex] : []}
      onSelect={({ selectedIndices, selectedItems }) => {
        setSelectedIndex(selectedIndices[0]);
        console.log('Selected:', selectedItems[0]);
      }}
      placeholder="Select a fruit"
    />
  );
}</code></pre>

      <h3>Vue</h3>
      <pre><code class="language-vue">&lt;template&gt;
  &lt;EnhancedSelect
    mode="single"
    :items="items"
    :selected-indices="selectedIndex !== null ? [selectedIndex] : []"
    @select="handleSelect"
    placeholder="Select a fruit"
  /&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { ref } from 'vue';
import { EnhancedSelect } from '@smilodon/vue';

const selectedIndex = ref(null);
const items = [
  { id: 1, label: 'Apple', value: 'apple' },
  { id: 2, label: 'Banana', value: 'banana' },
  { id: 3, label: 'Cherry', value: 'cherry' }
];

function handleSelect({ selectedIndices, selectedItems }) {
  selectedIndex.value = selectedIndices[0];
  console.log('Selected:', selectedItems[0]);
}
&lt;/script&gt;</code></pre>

      <h3>Vanilla JavaScript</h3>
      <pre><code class="language-javascript">const select = document.querySelector('enhanced-select');

select.mode = 'single';
select.items = [
  { id: 1, label: 'Apple', value: 'apple' },
  { id: 2, label: 'Banana', value: 'banana' },
  { id: 3, label: 'Cherry', value: 'cherry' }
];

select.addEventListener('select', (e) => {
  const selected = e.detail.selectedItems[0];
  console.log('Selected:', selected);
});</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Behavior</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Behavior</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Select Option</td>
            <td>Replaces previous selection</td>
          </tr>
          <tr>
            <td>Dropdown Behavior</td>
            <td>Closes automatically after selection</td>
          </tr>
          <tr>
            <td>Clear Button</td>
            <td>Removes current selection (if <code>clearable={true}</code>)</td>
          </tr>
          <tr>
            <td>Keyboard Selection</td>
            <td>Enter/Space to select focused option</td>
          </tr>
          <tr>
            <td>Null Selection</td>
            <td>Placeholder shown when nothing selected</td>
          </tr>
        </tbody>
      </table>
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
            <td><code>mode</code></td>
            <td>string</td>
            <td>"single"</td>
            <td>Set to "single" for single-select mode</td>
          </tr>
          <tr>
            <td><code>closeOnSelect</code></td>
            <td>boolean</td>
            <td>true</td>
            <td>Close dropdown after selection</td>
          </tr>
          <tr>
            <td><code>clearable</code></td>
            <td>boolean</td>
            <td>false</td>
            <td>Show clear button to remove selection</td>
          </tr>
          <tr>
            <td><code>disabled</code></td>
            <td>boolean</td>
            <td>false</td>
            <td>Disable the select</td>
          </tr>
          <tr>
            <td><code>placeholder</code></td>
            <td>string</td>
            <td>""</td>
            <td>Text shown when nothing selected</td>
          </tr>
          <tr>
            <td><code>allowDeselect</code></td>
            <td>boolean</td>
            <td>false</td>
            <td>Allow clicking selected item to deselect</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Keep Dropdown Open</h2>
      <pre><code class="language-tsx">// Keep dropdown open after selection
<EnhancedSelect
  mode="single"
  items={items}
  closeOnSelect={false}
  onSelect={handleSelect}
/></code></pre>
    </div>
    
    <div class="doc-section">
      <h2>With Clear Button</h2>
      <pre><code class="language-tsx">import { EnhancedSelect } from '@smilodon/react';
import { useState } from 'react';

function ClearableSelect() {
  const [selectedIndex, setSelectedIndex] = useState(null);

  return (
    <div>
      <EnhancedSelect
        items={items}
        selectedIndices={selectedIndex !== null ? [selectedIndex] : []}
        onSelect={({ selectedIndices }) => setSelectedIndex(selectedIndices[0])}
        clearable
        onClear={() => {
          setSelectedIndex(null);
          console.log('Selection cleared');
        }}
      />
      
      <button onClick={() => setSelectedIndex(null)}>
        Clear Programmatically
      </button>
    </div>
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Searchable Single Select</h2>
      <pre><code class="language-tsx">import { EnhancedSelect } from '@smilodon/react';
import { useState } from 'react';

function SearchableSingleSelect() {
  const [items, setItems] = useState(allItems);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleSearch = ({ query }) => {
    if (!query) {
      setItems(allItems);
      return;
    }
    
    const filtered = allItems.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );
    setItems(filtered);
  };

  return (
    <EnhancedSelect
      mode="single"
      searchable
      items={items}
      selectedIndices={selectedIndex !== null ? [selectedIndex] : []}
      onSelect={({ selectedIndices }) => setSelectedIndex(selectedIndices[0])}
      onSearch={handleSearch}
      searchPlaceholder="Search options..."
    />
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Controlled vs Uncontrolled</h2>
      
      <h3>Controlled (Recommended)</h3>
      <pre><code class="language-tsx">// Parent manages selection state
function ControlledSelect() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <EnhancedSelect
      items={items}
      selectedIndices={[selectedIndex]}
      onSelect={({ selectedIndices }) => setSelectedIndex(selectedIndices[0])}
    />
  );
}</code></pre>

      <h3>Uncontrolled</h3>
      <pre><code class="language-tsx">// Component manages its own state
function UncontrolledSelect() {
  return (
    <EnhancedSelect
      items={items}
      defaultSelectedIndices={[0]}
      onSelect={({ selectedIndices, selectedItems }) => {
        console.log('Selected:', selectedItems[0]);
      }}
    />
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>With Form Integration</h2>
      <pre><code class="language-tsx">import { EnhancedSelect } from '@smilodon/react';
import { useState } from 'react';

function FormWithSelect() {
  const [formData, setFormData] = useState({
    country: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="country">Country:</label>
      <EnhancedSelect
        id="country"
        items={countries}
        selectedIndices={formData.country !== null ? [formData.country] : []}
        onSelect={({ selectedIndices }) => 
          setFormData({ ...formData, country: selectedIndices[0] })
        }
        placeholder="Select your country"
        required
      />
      
      <button type="submit">Submit</button>
    </form>
  );
}</code></pre>
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
            <td><code>Enter / Space</code></td>
            <td>Open dropdown or select focused option</td>
          </tr>
          <tr>
            <td><code>↓ / ↑</code></td>
            <td>Navigate through options</td>
          </tr>
          <tr>
            <td><code>Home / End</code></td>
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
      <h2>Accessibility</h2>
      <ul>
        <li><strong>ARIA Role:</strong> <code>combobox</code> with <code>listbox</code> popup</li>
        <li><strong>ARIA Props:</strong> <code>aria-expanded</code>, <code>aria-activedescendant</code>, <code>aria-label</code></li>
        <li><strong>Keyboard Support:</strong> Full keyboard navigation</li>
        <li><strong>Screen Readers:</strong> Selected value announced</li>
        <li><strong>Focus Management:</strong> Proper focus order and visible focus indicators</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Recommended Usage Patterns</h2>
      <ul>
        <li>Store stable item values in your form state whenever possible.</li>
        <li>Use controlled mode for forms, filters, and any workflow with external reset buttons.</li>
        <li>Use <code>allowDeselect</code> only when an explicit "no value" state makes sense.</li>
        <li>Keep <code>closeOnSelect</code> enabled unless users need to compare options immediately after choosing one.</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Troubleshooting</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Issue</th>
            <th>Likely cause</th>
            <th>Fix</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Selection disappears after filtering</td>
            <td>Selection tied only to current array position</td>
            <td>Persist a stable value and remap indices after filtering</td>
          </tr>
          <tr>
            <td>Cannot clear the field</td>
            <td><code>clearable</code> disabled or no external reset path</td>
            <td>Enable <code>clearable</code> or call <code>clear()</code> programmatically</td>
          </tr>
          <tr>
            <td>Unexpected deselection</td>
            <td><code>allowDeselect</code> enabled</td>
            <td>Disable it unless optional deselection is intentional</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="doc-section">
      <h2>Selection Lifecycle</h2>
      <ol>
        <li>User opens the dropdown.</li>
        <li>An option becomes active through pointer or keyboard navigation.</li>
        <li>Selecting a new option replaces the current selection.</li>
        <li>The input display updates and the dropdown usually closes.</li>
        <li>The parent state or form model receives the new value.</li>
      </ol>
      <p>This simple lifecycle is why single-select is usually the easiest mode to introduce first when a team is migrating from another library.</p>
    </div>

    <div class="doc-section">
      <h2>Stable Value Mapping Recipe</h2>
      <pre><code class="language-tsx">const [selectedValue, setSelectedValue] = useState('banana');

const selectedIndices = useMemo(() => {
  const index = items.findIndex((item) => item.value === selectedValue);
  return index &gt;= 0 ? [index] : [];
}, [items, selectedValue]);

&lt;EnhancedSelect
  items={items}
  selectedIndices={selectedIndices}
  onSelect={({ selectedItems }) =&gt; {
    setSelectedValue(selectedItems[0]?.value ?? null);
  }}
/&gt;</code></pre>
      <p>This pattern is more resilient than storing raw indices when the list can be filtered or re-ordered.</p>
    </div>

    <div class="doc-section">
      <h2>Validation Example</h2>
      <pre><code class="language-tsx">function RequiredStatusField() {
  const [statusValue, setStatusValue] = useState(null);
  const [showError, setShowError] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    if (!statusValue) {
      setShowError(true);
      return;
    }
  }

  return (
    &lt;form onSubmit={handleSubmit}&gt;
      &lt;EnhancedSelect
        items={statuses}
        onSelect={({ selectedItems }) =&gt; {
          setStatusValue(selectedItems[0]?.value ?? null);
          setShowError(false);
        }}
        placeholder="Select a status"
      /&gt;
      {showError ? &lt;p className="error"&gt;Status is required&lt;/p&gt; : null}
    &lt;/form&gt;
  );
}</code></pre>
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

    <div class="doc-section">
      <h2>How Virtualization Works</h2>
      <p>Instead of rendering the entire dataset, Smilodon renders a sliding window of rows around the visible viewport. As the user scrolls, rows entering view are rendered and rows leaving view are recycled. This keeps DOM size small and layout work predictable even with very large datasets.</p>
      <ul>
        <li><strong>Viewport rows:</strong> what the user can currently see</li>
        <li><strong>Buffer rows:</strong> extra rows above and below the viewport to avoid flashing</li>
        <li><strong>Estimated item height:</strong> used for scroll math and total spacer height</li>
        <li><strong>DOM reuse:</strong> avoids creating and destroying large numbers of nodes repeatedly</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Tuning Guide</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Symptom</th>
            <th>Likely cause</th>
            <th>Adjustment</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Scroll jumpiness</td>
            <td>Item height estimate is off</td>
            <td>Measure real option height and update <code>estimatedItemHeight</code></td>
          </tr>
          <tr>
            <td>Blank gap on fast scroll</td>
            <td>Buffer is too small</td>
            <td>Increase <code>buffer</code></td>
          </tr>
          <tr>
            <td>Still heavy on low-end devices</td>
            <td>Option renderer is too complex</td>
            <td>Simplify row DOM and reduce nested layout work</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="doc-section">
      <h2>When Not to Force It</h2>
      <p>For small static lists, full rendering is often simpler and equally fast. Virtualization becomes valuable when row count, renderer complexity, or device constraints make full DOM rendering expensive.</p>
    </div>

    <div class="doc-section">
      <h2>Virtualization + Remote Data</h2>
      <p>Virtualization and remote data solve different problems. Virtualization reduces DOM cost for currently loaded data. Remote loading reduces how much data you keep in memory at once. Large production systems often use both together.</p>
      <ul>
        <li>Use virtualization when loaded pages are still large.</li>
        <li>Use remote paging when the full result set is too large to fetch upfront.</li>
        <li>Use both when data is both large and visually complex.</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Variable Height Warning</h2>
      <p>Virtualization works best when item height is consistent or at least predictable. If custom renderers make rows vary significantly in height, scrolling calculations may become less accurate.</p>
      <p>When that happens, choose one of these strategies:</p>
      <ul>
        <li>normalize row layout to a shared height</li>
        <li>increase the height estimate conservatively</li>
        <li>reduce visual complexity in the list view and move extra details elsewhere</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Debugging Checklist</h2>
      <ul>
        <li>Confirm <code>estimatedItemHeight</code> matches actual rendered height.</li>
        <li>Check whether custom option markup creates unexpected extra spacing.</li>
        <li>Increase <code>buffer</code> if you see flashing during fast scrolls.</li>
        <li>Profile whether the real bottleneck is rendering or network response time.</li>
      </ul>
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

    <div class="doc-section">
      <h2>Recommended Backend Shape</h2>
      <p>Infinite scroll is easiest to implement when the API returns both new items and pagination metadata.</p>
      <pre><code class="language-json">{
  "items": [{ "label": "Ada", "value": "ada" }],
  "page": 3,
  "pageSize": 50,
  "hasMore": true,
  "total": 4312
}</code></pre>
      <p>The most important field is <code>hasMore</code>. It should reliably tell the client whether to keep loading.</p>
    </div>

    <div class="doc-section">
      <h2>UX Recommendations</h2>
      <ul>
        <li>Show a loading state in the dropdown so users know the list is still progressing.</li>
        <li>Guard against duplicate loads when the threshold is reached repeatedly.</li>
        <li>Reset paging when the search query changes significantly.</li>
        <li>Cache loaded pages when reopening the dropdown improves the workflow.</li>
        <li>Pair infinite scroll with virtualization when total result counts can become large.</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Error and Retry Pattern</h2>
      <pre><code class="language-tsx">async function loadMore() {
  try {
    await fetchNextPage();
    setLoadError(null);
  } catch (error) {
    setLoadError('Could not load more results');
  }
}

return (
  &lt;&gt;
    &lt;NativeSelect
      items={items}
      onLoadMore={loadMore}
      hasMore={hasMore}
      loading={loading}
    /&gt;
    {loadError ? &lt;button onClick={loadMore}&gt;Retry&lt;/button&gt; : null}
  &lt;/&gt;
);</code></pre>
    </div>

    <div class="doc-section">
      <h2>Search + Pagination Reset</h2>
      <pre><code class="language-tsx">async function handleSearch({ query }) {
  setPage(1);
  setHasMore(true);
  setItems([]);
  setSearchQuery(query);
  await loadFirstPageForQuery(query);
}</code></pre>
      <p>Whenever the query meaningfully changes, reset the paging state. Otherwise users can end up with mixed results from previous queries.</p>
    </div>

    <div class="doc-section">
      <h2>Duplicate Request Protection</h2>
      <pre><code class="language-tsx">const loadingRef = useRef(false);

async function loadMore() {
  if (loadingRef.current || !hasMore) return;
  loadingRef.current = true;

  try {
    await fetchNextPage();
  } finally {
    loadingRef.current = false;
  }
}</code></pre>
      <p>This pattern helps when rapid scrolling reaches the threshold multiple times before state updates settle.</p>
    </div>

    <div class="doc-section">
      <h2>When Infinite Scroll Is a Bad Fit</h2>
      <ul>
        <li>Users need a clear sense of total result count and exact position.</li>
        <li>Users frequently jump to specific pages or alphabet ranges.</li>
        <li>The backend cannot provide stable page boundaries.</li>
      </ul>
      <p>In those cases, a dedicated search experience or explicit pagination may be a better UX.</p>
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
      <p>All group headers share the same base padding. Use the separator tokens to add space or dividers before later groups without changing the title padding of those later headers.</p>
      
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
  --select-group-header-separator-margin-top: 8px;
  --select-group-header-separator-padding-top: 14px;
  --select-group-header-separator-border-top: 1px solid #e5e7eb;
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
      <h2>Separator Tokens</h2>
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
            <td><code>--select-separator-width</code></td>
            <td>1px</td>
            <td>Separator line width</td>
          </tr>
          <tr>
            <td><code>--select-separator-height</code></td>
            <td>50%</td>
            <td>Separator height for single-select (percentage)</td>
          </tr>
          <tr>
            <td><code>--select-multi-separator-height</code></td>
            <td>auto</td>
            <td>Separator height for multi-select (fixed px or auto)</td>
          </tr>
          <tr>
            <td><code>--select-separator-display</code></td>
            <td>block</td>
            <td>Separator display property (block/none)</td>
          </tr>
          <tr>
            <td><code>--select-separator-opacity</code></td>
            <td>0.6</td>
            <td>Separator opacity</td>
          </tr>
          <tr>
            <td><code>--select-multi-separator-inset-block</code></td>
            <td>10px</td>
            <td>Top/bottom inset for multi-select separator</td>
          </tr>
        </tbody>
      </table>
      
      <div class="doc-note">
        <p>💡 <strong>Multi-Select Separator:</strong> Use <code>--select-multi-separator-height</code> to control 
        the separator height independently in multi-select mode. Set to a fixed pixel value like <code>40px</code> 
        to maintain consistent height when many items are selected, or keep as <code>auto</code> (default) to stretch 
        with the container.</p>
      </div>
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
          <tr>
            <td><code>--select-badge-remove-icon-size</code></td>
            <td>10px</td>
            <td>Remove icon width/height</td>
          </tr>
          <tr>
            <td><code>--select-badge-remove-icon-color</code></td>
            <td>currentColor</td>
            <td>Remove icon color</td>
          </tr>
          <tr>
            <td><code>--select-badge-remove-icon-transform</code></td>
            <td>none</td>
            <td>Remove icon transform</td>
          </tr>
        </tbody>
      </table>

      <h3>Custom chip remove icon</h3>
      <p>You can replace the default <code>×</code> icon with text or inline SVG markup:</p>
      <pre><code class="language-javascript">select.updateConfig({
  selection: {
    removeButtonIcon: '&lt;svg viewBox="0 0 16 16" fill="none"&gt;&lt;path d="M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" /&gt;&lt;/svg&gt;'
  }
});</code></pre>
      <p>To style the icon separately from the circular remove button, use <code>::part(chip-remove-icon)</code>, <code>styles.badgeRemoveIcon</code>, or the <code>--select-badge-remove-icon-*</code> tokens.</p>
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
      <h2>Overview</h2>
      <p>Shadow Parts provide direct access to internal Shadow DOM elements for styling. Use <code>::part()</code> to style specific components without piercing the shadow boundary.</p>
    </div>
    
    <div class="doc-section">
      <h2>Available Parts</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Part</th>
            <th>Description</th>
            <th>Context</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>trigger</code></td>
            <td>Main button/input area that opens dropdown</td>
            <td>Always visible</td>
          </tr>
          <tr>
            <td><code>input</code></td>
            <td>Selected value display area</td>
            <td>Inside trigger</td>
          </tr>
          <tr>
            <td><code>placeholder</code></td>
            <td>Placeholder text element</td>
            <td>When no selection</td>
          </tr>
          <tr>
            <td><code>clear-button</code></td>
            <td>Clear selection button</td>
            <td>When clearable</td>
          </tr>
          <tr>
            <td><code>arrow</code></td>
            <td>Dropdown indicator icon</td>
            <td>Right side of trigger</td>
          </tr>
          <tr>
            <td><code>dropdown</code></td>
            <td>Dropdown container</td>
            <td>When open</td>
          </tr>
          <tr>
            <td><code>search-input</code></td>
            <td>Search input field</td>
            <td>When searchable</td>
          </tr>
          <tr>
            <td><code>options-list</code></td>
            <td>Options container (ul)</td>
            <td>Inside dropdown</td>
          </tr>
          <tr>
            <td><code>option</code></td>
            <td>Individual option</td>
            <td>Inside options-list</td>
          </tr>
          <tr>
            <td><code>chip</code></td>
            <td>Selected chip in multi-select</td>
            <td>Multi-select mode</td>
          </tr>
          <tr>
            <td><code>chip-remove</code></td>
            <td>Remove button on chip</td>
            <td>Inside chip</td>
          </tr>
          <tr>
            <td><code>group-header</code></td>
            <td>Group header in grouped mode</td>
            <td>Grouped options</td>
          </tr>
          <tr>
            <td><code>loading-indicator</code></td>
            <td>Loading spinner</td>
            <td>When loading</td>
          </tr>
          <tr>
            <td><code>empty-message</code></td>
            <td>No results message</td>
            <td>When no items</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="doc-section">
      <h2>Basic Usage Examples</h2>
      
      <h3>Styling the Trigger</h3>
      <pre><code class="language-css">enhanced-select::part(trigger) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px 20px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 200ms ease-out;
}

enhanced-select::part(trigger):hover {
  transform: translateY(-2px);
}</code></pre>

      <h3>Styling Options</h3>
      <pre><code class="language-css">enhanced-select::part(option) {
  padding: 12px 16px;
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 150ms ease-out;
}

enhanced-select::part(option):hover {
  background-color: rgba(59, 130, 246, 0.1);
  transform: translateX(4px);
}

enhanced-select::part(option)[data-selected="true"] {
  background-color: #3b82f6;
  color: white;
  font-weight: 600;
}</code></pre>

      <h3>Styling Chips (Multi-Select)</h3>
      <pre><code class="language-css">enhanced-select::part(chip) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

enhanced-select::part(chip-remove) {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: background 150ms;
}

enhanced-select::part(chip-remove):hover {
  background: rgba(255, 255, 255, 0.5);
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Advanced Styling Patterns</h2>
      
      <h3>Dropdown with Glassmorphism</h3>
      <pre><code class="language-css">enhanced-select::part(dropdown) {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border-radius: 16px;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  enhanced-select::part(dropdown) {
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
}</code></pre>

      <h3>Material Design Elevation</h3>
      <pre><code class="language-css">enhanced-select::part(trigger) {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

enhanced-select::part(trigger):hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

enhanced-select::part(trigger):active {
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}

enhanced-select::part(dropdown) {
  box-shadow: 0 8px 16px rgba(0,0,0,0.1),
              0 4px 8px rgba(0,0,0,0.08);
  border-radius: 4px;
}</code></pre>

      <h3>Neumorphism Style</h3>
      <pre><code class="language-css">enhanced-select::part(trigger) {
  background: #e0e5ec;
  box-shadow: 9px 9px 16px rgba(163, 177, 198, 0.6),
              -9px -9px 16px rgba(255, 255, 255, 0.5);
  border: none;
  border-radius: 12px;
}

enhanced-select::part(trigger):active {
  box-shadow: inset 9px 9px 16px rgba(163, 177, 198, 0.6),
              inset -9px -9px 16px rgba(255, 255, 255, 0.5);
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>State-Based Styling</h2>
      <pre><code class="language-css">/* Open state */
enhanced-select[data-open="true"]::part(trigger) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

enhanced-select[data-open="true"]::part(arrow) {
  transform: rotate(180deg);
}

/* Disabled state */
enhanced-select[disabled]::part(trigger) {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f3f4f6;
}

/* Focus state */
enhanced-select:focus-within::part(trigger) {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Error state */
enhanced-select[data-error="true"]::part(trigger) {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Combining with CSS Custom Properties</h2>
      <pre><code class="language-css">enhanced-select {
  --select-primary-color: #3b82f6;
  --select-trigger-radius: 12px;
  --select-option-padding: 12px 16px;
}

enhanced-select::part(trigger) {
  border-radius: var(--select-trigger-radius);
  border: 2px solid var(--select-primary-color);
}

enhanced-select::part(option) {
  padding: var(--select-option-padding);
}

enhanced-select::part(option):hover {
  background-color: var(--select-primary-color);
  color: white;
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Responsive Styling</h2>
      <pre><code class="language-css">/* Mobile */
@media (max-width: 640px) {
  enhanced-select::part(trigger) {
    font-size: 16px; /* Prevent zoom on iOS */
    padding: 14px;
  }
  
  enhanced-select::part(dropdown) {
    max-height: 60vh;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 16px 16px 0 0;
  }
  
  enhanced-select::part(option) {
    padding: 16px;
    font-size: 16px;
  }
}

/* Tablet and up */
@media (min-width: 768px) {
  enhanced-select::part(dropdown) {
    min-width: 300px;
    max-height: 400px;
  }
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Animation with Parts</h2>
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
}

enhanced-select::part(option) {
  animation: fadeIn 150ms ease-out backwards;
}

enhanced-select::part(option):nth-child(1) { animation-delay: 0ms; }
enhanced-select::part(option):nth-child(2) { animation-delay: 30ms; }
enhanced-select::part(option):nth-child(3) { animation-delay: 60ms; }

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
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

    <div class="doc-section">
      <h2>When to Use Each Method</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Use case</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>open()</code></td>
            <td>Toolbar actions, guided flows, keyboard shortcuts</td>
            <td>Best when user intent is already clear</td>
          </tr>
          <tr>
            <td><code>close()</code></td>
            <td>Dismiss after workflow completion or route changes</td>
            <td>Useful when surrounding UI context changes</td>
          </tr>
          <tr>
            <td><code>clear()</code></td>
            <td>Reset filters or clear form state</td>
            <td>Prefer syncing your controlled state at the same time</td>
          </tr>
          <tr>
            <td><code>setItems()</code></td>
            <td>Replace dataset after fetch or transformation</td>
            <td>Use grouped APIs for grouped content</td>
          </tr>
          <tr>
            <td><code>focus()</code></td>
            <td>Accessibility flows and error recovery</td>
            <td>Helpful when moving users to the next required field</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="doc-section">
      <h2>Safe Initialization Order</h2>
      <pre><code class="language-javascript">const select = document.querySelector('enhanced-select');

select.setItems(items);
select.updateConfig({ searchable: true, clearable: true });
select.open();</code></pre>
      <p>Set data first, then apply behavior, then trigger visible UI actions. This avoids confusing intermediate states during startup.</p>
    </div>

    <div class="doc-section">
      <h2>Method Usage Guidelines</h2>
      <ul>
        <li>Prefer declarative props for normal application flows.</li>
        <li>Use methods when the action is truly imperative: focusing an invalid field, opening from a keyboard shortcut, or clearing from a toolbar action.</li>
        <li>Keep parent state in sync when calling methods that affect visible selection.</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Workflow Example</h2>
      <pre><code class="language-tsx">function FilterBar() {
  const selectRef = useRef(null);

  return (
    &lt;div&gt;
      &lt;button onClick={() =&gt; selectRef.current?.focus()}&gt;Focus field&lt;/button&gt;
      &lt;button onClick={() =&gt; selectRef.current?.open()}&gt;Open filter&lt;/button&gt;
      &lt;button onClick={() =&gt; selectRef.current?.clear()}&gt;Reset filter&lt;/button&gt;

      &lt;NativeSelect ref={selectRef} items={items} searchable /&gt;
    &lt;/div&gt;
  );
}</code></pre>
    </div>

    <div class="doc-section">
      <h2>Imperative Safety Notes</h2>
      <p>If you call <code>setItems()</code>, <code>clear()</code>, or <code>updateConfig()</code> from outside the normal render flow, keep the rest of your application state synchronized. Desynchronization usually causes confusing bugs that look like rendering errors but are really state ownership problems.</p>
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

    <div class="doc-section">
      <h2>Recommended Item Modeling</h2>
      <p>In production apps, item types usually need both UI and business metadata. A practical pattern is to define a shared item type and reuse it across renderers, submit handlers, and API mapping code.</p>
      <pre><code class="language-typescript">type UserOption = {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  team?: string;
  avatarUrl?: string;
};</code></pre>
    </div>

    <div class="doc-section">
      <h2>Helpful Type Patterns</h2>
      <ul>
        <li>Keep <code>value</code> stable for persistence and form submissions.</li>
        <li>Add renderer metadata only when it is actually used.</li>
        <li>Model disabled states directly on items when business rules determine selectability.</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Typing Event Handlers</h2>
      <pre><code class="language-typescript">function handleSelect(event: { indices: number[]; items: UserOption[] }) {
  console.log(event.items[0]?.value);
}

function handleSearch(event: { query: string }) {
  console.log(event.query);
}</code></pre>
    </div>

    <div class="doc-section">
      <h2>Grouped Type Pattern</h2>
      <pre><code class="language-typescript">type TeamOption = {
  id: string;
  label: string;
  value: string;
  department: 'Engineering' | 'Design' | 'Operations';
};

type OptionGroup = {
  label: string;
  options: TeamOption[];
};</code></pre>
      <p>Keeping grouped data typed explicitly makes custom headers and grouped rendering easier to reason about.</p>
    </div>

    <div class="doc-section">
      <h2>Adapter Typing Advice</h2>
      <ul>
        <li>Keep a single canonical item type per select use case.</li>
        <li>Avoid overly generic <code>any</code>-based item models in shared components.</li>
        <li>Use utility functions to convert business entities into select items when the original objects are too large or unstable.</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Mapping Domain Types</h2>
      <pre><code class="language-typescript">type User = {
  id: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive';
};

function toUserOption(user: User): UserOption {
  return {
    id: user.id,
    label: user.firstName + ' ' + user.lastName,
    value: user.id,
    disabled: user.status === 'inactive',
  };
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

    <div class="doc-section">
      <h2>Migration Checklist</h2>
      <ol>
        <li>Map your old option objects to Smilodon <code>items</code>.</li>
        <li>Replace old change handlers with <code>onSelect</code> or DOM event listeners.</li>
        <li>Move styling into CSS variables, <code>::part()</code>, or renderer hooks.</li>
        <li>Retest keyboard behavior, clear flows, placeholders, and disabled states.</li>
        <li>Enable virtualization before shipping large datasets.</li>
      </ol>
    </div>

    <div class="doc-section">
      <h2>Incremental Migration Strategy</h2>
      <p>Do not migrate every select in one step unless the app is very small. Start with a simple single-select field, standardize your item mapping function, confirm styling tokens, and then move on to more advanced cases such as remote search, grouped lists, or multi-select.</p>
    </div>

    <div class="doc-section">
      <h2>Migration Phases</h2>
      <ol>
        <li><strong>Discovery:</strong> catalog existing select variants, custom styles, and special behaviors.</li>
        <li><strong>Foundation:</strong> create a shared item mapper and a shared wrapper component.</li>
        <li><strong>Parity:</strong> migrate simple single-select fields and verify forms, validation, and keyboard behavior.</li>
        <li><strong>Advanced adoption:</strong> migrate grouped, searchable, remote, and multi-select workflows.</li>
        <li><strong>Cleanup:</strong> remove old helper utilities, duplicate styling, and deprecated field wrappers.</li>
      </ol>
    </div>

    <div class="doc-section">
      <h2>Parity Checklist</h2>
      <ul>
        <li>placeholder text matches expectations</li>
        <li>disabled behavior matches old workflows</li>
        <li>clear button behavior is acceptable</li>
        <li>selected values serialize correctly in forms</li>
        <li>custom styling covers hover, focus, and selected states</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Migration Example: Native HTML Select</h2>
      <pre><code class="language-tsx">// Before
&lt;select value={status} onChange={(e) =&gt; setStatus(e.target.value)}&gt;
  &lt;option value="todo"&gt;Todo&lt;/option&gt;
  &lt;option value="doing"&gt;Doing&lt;/option&gt;
  &lt;option value="done"&gt;Done&lt;/option&gt;
&lt;/select&gt;

// After
&lt;NativeSelect
  items={statusItems}
  selectedIndices={selectedIndices}
  onSelect={({ items }) =&gt; setStatus(items[0]?.value ?? '')}
/&gt;</code></pre>
      <p>This is often the easiest migration path to validate before moving on to more customized legacy selects.</p>
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

    <div class="doc-section">
      <h2>Mitigation Strategies</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Limitation</th>
            <th>Mitigation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>SSR / browser-only runtime</td>
            <td>Mount from client boundaries and avoid server-only execution paths</td>
          </tr>
          <tr>
            <td>Legacy browser constraints</td>
            <td>Target modern browsers or provide an app-specific fallback</td>
          </tr>
          <tr>
            <td>Variable-height custom rows</td>
            <td>Test virtualization carefully and use a realistic height estimate</td>
          </tr>
          <tr>
            <td>Remote latency</td>
            <td>Use debounce, loading states, and request cancellation</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="doc-section">
      <h2>How to Evaluate a Limitation</h2>
      <p>Ask whether the limitation affects correctness, accessibility, performance, or only convenience. Many teams do not need every advanced capability on day one. It is often enough to adopt Smilodon for its shared runtime, then address edge constraints at the adapter or application layer.</p>
    </div>

    <div class="doc-section">
      <h2>Limitations That Commonly Matter Most</h2>
      <ul>
        <li><strong>SSR boundaries:</strong> important for Next.js, Nuxt, and similar environments.</li>
        <li><strong>Variable-height virtualized rows:</strong> important when custom options become visually dense.</li>
        <li><strong>Mobile interaction expectations:</strong> important for touch-heavy enterprise and consumer flows.</li>
        <li><strong>Legacy browser support:</strong> important only when product requirements still include outdated platforms.</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Adoption Decision Guide</h2>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Question</th>
            <th>If yes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Do you need modern browser support only?</td>
            <td>Smilodon is usually a strong fit immediately.</td>
          </tr>
          <tr>
            <td>Do you require heavy SSR rendering of the field itself?</td>
            <td>Plan a client-only boundary or wrapper strategy.</td>
          </tr>
          <tr>
            <td>Do you need extremely custom variable-height option cards?</td>
            <td>Test virtualization carefully before standardizing.</td>
          </tr>
          <tr>
            <td>Do you rely on legacy browsers?</td>
            <td>Define a fallback path before rollout.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="doc-section">
      <h2>Practical Takeaway</h2>
      <p>Most teams will not be blocked by these limitations. The important part is to identify whether any of them intersect with your product requirements before committing to a broad rollout. In many cases, a thin wrapper or a clear browser support policy is enough.</p>
    </div>
  `,
  
  solid: `
    <h1>SolidJS Integration</h1>
    
    <div class="doc-section">
      <h2>Installation</h2>
      <pre><code class="language-bash">npm install @smilodon/core @smilodon/solid
# or
yarn add @smilodon/core @smilodon/solid
# or
pnpm add @smilodon/core @smilodon/solid</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Basic Usage</h2>
      <pre><code class="language-tsx">import { EnhancedSelect } from '@smilodon/solid';
import { createSignal } from 'solid-js';

function App() {
  const [selectedIndices, setSelectedIndices] = createSignal<number[]>([]);
  const items = [
    { id: 1, label: 'Apple', value: 'apple' },
    { id: 2, label: 'Banana', value: 'banana' },
    { id: 3, label: 'Cherry', value: 'cherry' }
  ];
  
  return (
    <EnhancedSelect
      items={items}
      selectedIndices={selectedIndices()}
      onSelect={({ selectedIndices: indices, selectedItems }) => {
        setSelectedIndices(indices);
        console.log('Selected:', selectedItems);
      }}
      placeholder="Select a fruit"
    />
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Multi-Select with Signals</h2>
      <pre><code class="language-tsx">import { EnhancedSelect } from '@smilodon/solid';
import { createSignal, createMemo } from 'solid-js';

function MultiSelectExample() {
  const [selectedIndices, setSelectedIndices] = createSignal<number[]>([]);
  const selectedCount = createMemo(() => selectedIndices().length);
  
  const items = [
    { id: 1, label: 'React', icon: '⚛️' },
    { id: 2, label: 'Solid', icon: '🔷' },
    { id: 3, label: 'Vue', icon: '💚' },
    { id: 4, label: 'Svelte', icon: '🔥' }
  ];

  const handleSelect = ({ selectedIndices: indices }) => {
    setSelectedIndices(indices);
  };
  
  const clearAll = () => setSelectedIndices([]);

  return (
    <div>
      <EnhancedSelect
        mode="multi"
        items={items}
        selectedIndices={selectedIndices()}
        onSelect={handleSelect}
        maxSelections={3}
        closeOnSelect={false}
      />
      
      <p>Selected: {selectedCount()} items</p>
      <button onClick={clearAll}>Clear All</button>
    </div>
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Searchable with Resources</h2>
      <pre><code class="language-tsx">import { EnhancedSelect } from '@smilodon/solid';
import { createSignal, createResource } from 'solid-js';

async function fetchUsers(query: string) {
  const response = await fetch(\`/api/users?q=\${query}\`);
  return response.json();
}

function SearchExample() {
  const [searchQuery, setSearchQuery] = createSignal('');
  const [selectedIndices, setSelectedIndices] = createSignal([]);
  
  const [users] = createResource(searchQuery, fetchUsers);

  return (
    <EnhancedSelect
      searchable
      items={users() || []}
      selectedIndices={selectedIndices()}
      onSearch={({ query }) => setSearchQuery(query)}
      onSelect={({ selectedIndices: indices }) => setSelectedIndices(indices)}
      searchDebounce={300}
      placeholder="Search users..."
      loading={users.loading}
    />
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>With Ref & Methods</h2>
      <pre><code class="language-tsx">import { EnhancedSelect } from '@smilodon/solid';
import { createSignal } from 'solid-js';

function RefExample() {
  let selectRef: any;
  const [selectedIndices, setSelectedIndices] = createSignal([]);

  const handleClearAll = () => {
    selectRef?.clear();
  };

  const handleOpen = () => {
    selectRef?.open();
  };

  return (
    <div>
      <EnhancedSelect
        ref={selectRef}
        items={items}
        mode="multi"
        selectedIndices={selectedIndices()}
        onSelect={({ selectedIndices: indices }) => setSelectedIndices(indices)}
      />
      
      <button onClick={handleClearAll}>Clear All</button>
      <button onClick={handleOpen}>Open Dropdown</button>
    </div>
  );
}</code></pre>
    </div>
  `,
  
  vanilla: `
    <h1>Vanilla JS Integration</h1>
    
    <div class="doc-section">
      <h2>Installation</h2>
      <pre><code class="language-bash">npm install @smilodon/core
# or
yarn add @smilodon/core
# or via CDN
&lt;script type="module" src="https://cdn.jsdelivr.net/npm/@smilodon/core/+esm"&gt;&lt;/script&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>CDN Usage (No Build Step)</h2>
      <pre><code class="language-html">&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
  &lt;title&gt;Smilodon Example&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;enhanced-select id="mySelect"&gt;&lt;/enhanced-select&gt;

  &lt;script type="module"&gt;
    import { EnhancedSelect } from 'https://cdn.jsdelivr.net/npm/@smilodon/core/+esm';
    
    const select = document.getElementById('mySelect');
    
    select.items = [
      { id: 1, label: 'Apple', value: 'apple' },
      { id: 2, label: 'Banana', value: 'banana' },
      { id: 3, label: 'Cherry', value: 'cherry' }
    ];
    
    select.addEventListener('select', (e) => {
      console.log('Selected:', e.detail.selectedItems);
    });
  &lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>ES Module Usage</h2>
      <pre><code class="language-javascript">import { EnhancedSelect } from '@smilodon/core';

// Create select element
const select = document.createElement('enhanced-select');

// Configure
select.items = [
  { id: 1, label: 'React', value: 'react' },
  { id: 2, label: 'Vue', value: 'vue' },
  { id: 3, label: 'Svelte', value: 'svelte' }
];

select.placeholder = 'Select a framework';
select.selectedIndices = [];

// Add event listeners
select.addEventListener('select', (e) => {
  console.log('Selected:', e.detail.selectedItems);
});

// Add to DOM
document.body.appendChild(select);</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Multi-Select Mode</h2>
      <pre><code class="language-javascript">const select = document.querySelector('enhanced-select');

select.mode = 'multi';
select.items = items;
select.maxSelections = 5;
select.closeOnSelect = false;

select.addEventListener('select', (e) => {
  const { selectedIndices, selectedItems } = e.detail;
  console.log(\`Selected \${selectedIndices.length} items:\`, selectedItems);
});</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Searchable with Remote Data</h2>
      <pre><code class="language-javascript">const select = document.querySelector('enhanced-select');
select.searchable = true;
select.searchDebounce = 300;

let abortController = null;

select.addEventListener('search', async (e) => {
  if (abortController) abortController.abort();
  
  abortController = new AbortController();
  
  try {
    const response = await fetch(\`/api/search?q=\${e.detail.query}\`, {
      signal: abortController.signal
    });
    select.items = await response.json();
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Search failed:', error);
    }
  }
});</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Programmatic Methods</h2>
      <pre><code class="language-javascript">const select = document.querySelector('enhanced-select');

// Open/close dropdown
select.open();
select.close();

// Clear selection
select.clear();

// Set selection programmatically
select.selectedIndices = [0, 2, 4];

// Update items
select.items = newItems;

// Focus
select.focus();</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Virtualization for Large Lists</h2>
      <pre><code class="language-javascript">const items = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  label: \`Option \${i + 1}\`
}));

select.items = items;
select.virtualized = true;
select.estimatedItemHeight = 40;
select.buffer = 5;</code></pre>
    </div>

    <div class="doc-section">
      <h2>Recommended Vanilla Pattern</h2>
      <p>The vanilla runtime is a strong fit for server-rendered pages, design systems, microsites, and apps that want direct browser APIs. A simple pattern works well:</p>
      <ol>
        <li>Register the element once.</li>
        <li>Query the element after it exists in the DOM.</li>
        <li>Call <code>setItems()</code> or assign <code>items</code>.</li>
        <li>Use <code>updateConfig()</code> for grouped behavior changes.</li>
        <li>Listen to DOM events like <code>select</code> and <code>search</code>.</li>
      </ol>
    </div>

    <div class="doc-section">
      <h2>Grouped Example</h2>
      <pre><code class="language-javascript">const select = document.querySelector('enhanced-select');

select.setGroupedItems([
  {
    label: 'Frontend',
    options: [
      { label: 'React', value: 'react' },
      { label: 'Vue', value: 'vue' }
    ]
  },
  {
    label: 'Backend',
    options: [
      { label: 'Node.js', value: 'node' },
      { label: 'Go', value: 'go' }
    ]
  }
]);

select.updateConfig({ searchable: true });</code></pre>
    </div>

    <div class="doc-section">
      <h2>Styling in Plain CSS</h2>
      <pre><code class="language-css">enhanced-select.project-filter {
  --select-input-border: 1px solid #d1d5db;
  --select-input-border-radius: 12px;
  --select-option-hover-bg: rgba(37, 99, 235, 0.08);
  --select-option-selected-bg: #2563eb;
  --select-option-selected-color: #ffffff;
}</code></pre>
      <p>This approach keeps styling normal and predictable without requiring a framework wrapper.</p>
    </div>

    <div class="doc-section">
      <h2>Lifecycle and Cleanup</h2>
      <p>When you integrate Smilodon in vanilla JavaScript, you are responsible for normal DOM lifecycle concerns:</p>
      <ul>
        <li>attach event listeners after the element exists</li>
        <li>remove long-lived listeners if the element is destroyed manually</li>
        <li>replace data through <code>setItems()</code> or <code>items</code> assignment rather than rebuilding the element unnecessarily</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Form Submission Example</h2>
      <pre><code class="language-javascript">const select = document.querySelector('#country-select');
const form = document.querySelector('#profile-form');
const hiddenInput = document.querySelector('#country-value');

select.addEventListener('select', (event) => {
  hiddenInput.value = event.detail.selectedItems?.[0]?.value ?? '';
});

form.addEventListener('submit', (event) => {
  if (!hiddenInput.value) {
    event.preventDefault();
    alert('Please select a country');
  }
});</code></pre>
      <p>This pattern works well when you want standard form serialization without a framework.</p>
    </div>

    <div class="doc-section">
      <h2>Production Advice for Plain Browser Apps</h2>
      <ul>
        <li>Prefer stable item values over display labels for persistence.</li>
        <li>Keep fetch and search logic outside the element itself.</li>
        <li>Use CSS variables first before reaching for heavy DOM customization.</li>
        <li>Test keyboard and screen-reader behavior even in non-framework apps.</li>
      </ul>
    </div>
  `,
  
  'react-native': `
    <h1>React Native Integration</h1>
    
    <div class="doc-section">
      <h2>Installation</h2>
      <pre><code class="language-bash">npm install @smilodon/core @smilodon/react-native
# or
yarn add @smilodon/core @smilodon/react-native</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Basic Usage</h2>
      <pre><code class="language-tsx">import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { NativeSelect } from '@smilodon/react-native';

function App() {
  const [selectedIndices, setSelectedIndices] = useState([]);
  
  const items = [
    { id: 1, label: 'Apple', value: 'apple' },
    { id: 2, label: 'Banana', value: 'banana' },
    { id: 3, label: 'Cherry', value: 'cherry' }
  ];
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select a fruit:</Text>
      <NativeSelect
        items={items}
        selectedIndices={selectedIndices}
        onSelect={({ selectedIndices, selectedItems }) => {
          setSelectedIndices(selectedIndices);
          console.log('Selected:', selectedItems);
        }}
        placeholder="Select a fruit"
        style={styles.select}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600'
  },
  select: {
    width: '100%'
  }
});</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Platform-Specific Rendering</h2>
      <p>Smilodon automatically uses native picker components:</p>
      
      <h3>iOS</h3>
      <ul>
        <li>Native UIPickerView</li>
        <li>Modal presentation</li>
        <li>Haptic feedback</li>
        <li>VoiceOver support</li>
      </ul>
      
      <h3>Android</h3>
      <ul>
        <li>Native Spinner/BottomSheet</li>
        <li>Material Design styling</li>
        <li>Ripple effects</li>
        <li>TalkBack support</li>
      </ul>
      
      <h3>React Native Web</h3>
      <ul>
        <li>Full web component with search</li>
        <li>Keyboard navigation</li>
        <li>Virtualization</li>
      </ul>
    </div>
    
    <div class="doc-section">
      <h2>Multi-Select Mode</h2>
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react-native';
import { useState } from 'react';
import { View, Text, Button } from 'react-native';

function MultiSelectExample() {
  const [selectedIndices, setSelectedIndices] = useState([]);
  
  const frameworks = [
    { id: 1, label: 'React Native', value: 'rn' },
    { id: 2, label: 'Flutter', value: 'flutter' },
    { id: 3, label: 'Ionic', value: 'ionic' }
  ];
  
  return (
    <View>
      <NativeSelect
        mode="multi"
        items={frameworks}
        selectedIndices={selectedIndices}
        onSelect={({ selectedIndices }) => setSelectedIndices(selectedIndices)}
        maxSelections={2}
      />
      
      <Text style={{ marginTop: 10 }}>
        Selected: {selectedIndices.length} items
      </Text>
      
      <Button title="Clear All" onPress={() => setSelectedIndices([])} />
    </View>
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Custom Styling</h2>
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react-native';
import { StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
  select: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
      },
      android: {
        elevation: 4
      }
    })
  }
});

function StyledSelect() {
  return (
    <NativeSelect
      items={items}
      style={styles.select}
    />
  );
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Accessibility</h2>
      <pre><code class="language-tsx">import { NativeSelect } from '@smilodon/react-native';

function AccessibleSelect() {
  return (
    <NativeSelect
      items={items}
      accessible={true}
      accessibilityLabel="Select a category"
      accessibilityHint="Double tap to open picker"
      accessibilityRole="button"
    />
  );
}</code></pre>
    </div>

    <div class="doc-section">
      <h2>How to Approach React Native Usage</h2>
      <p>The React Native adapter is most useful when you want selection logic and data shapes to stay aligned across web and native surfaces. Keep business state in React, pass stable values through your form model, and let the adapter provide the platform-appropriate presentation.</p>
    </div>

    <div class="doc-section">
      <h2>Recommended Mobile Defaults</h2>
      <ul>
        <li>Keep labels concise and easy to scan on narrow screens.</li>
        <li>Prefer remote paging over huge initial payloads.</li>
        <li>Test with VoiceOver and TalkBack, not just visual inspection.</li>
        <li>Use clear placeholder and label text so the field intent is obvious.</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Form State Example</h2>
      <pre><code class="language-tsx">const [formState, setFormState] = useState({ categoryValues: [] });

&lt;NativeSelect
  mode="multi"
  items={categories}
  selectedIndices={selectedIndices}
  onSelect={({ selectedItems }) =&gt; {
    setFormState({
      categoryValues: selectedItems.map((item) =&gt; item.value)
    });
  }}
/&gt;</code></pre>
      <p>Persist values rather than display labels so your app state remains stable even if UI copy changes later.</p>
    </div>

    <div class="doc-section">
      <h2>Async Data Example</h2>
      <pre><code class="language-tsx">function CategoryPicker() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (active) {
        setItems(data);
        setLoading(false);
      }
    }

    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  return &lt;NativeSelect items={items} loading={loading} placeholder="Select category" /&gt;;
}</code></pre>
    </div>

    <div class="doc-section">
      <h2>Mobile UX Checklist</h2>
      <ul>
        <li>Keep option labels short enough to scan quickly.</li>
        <li>Do not overload the picker with non-essential metadata.</li>
        <li>Use clear labels and helper text because available space is limited.</li>
        <li>Test both portrait and landscape layouts when the picker is central to the workflow.</li>
      </ul>
    </div>

    <div class="doc-section">
      <h2>Cross-Platform State Strategy</h2>
      <p>If your web and React Native apps share business logic, keep a shared item mapping layer and store stable values rather than indices. That makes it much easier to keep selection behavior aligned across platforms.</p>
    </div>
  `,
  
  'dark-mode': `
    <h1>Dark Mode</h1>
    
    <div class="doc-section">
      <h2>Automatic Detection</h2>
      <p>Smilodon automatically adapts to system dark mode preference using CSS media queries:</p>
      
      <pre><code class="language-css">@media (prefers-color-scheme: dark) {
  enhanced-select {
    /* Core Colors */
    --select-bg-color: #1f2937;
    --select-text-color: #f9fafb;
    --select-border-color: #374151;
    --select-primary-color: #60a5fa;
    
    /* Dropdown */
    --select-dropdown-bg: #111827;
    --select-dropdown-shadow: 0 10px 20px rgba(0,0,0,0.5);
    
    /* Options */
    --select-option-hover-bg: #374151;
    --select-option-selected-bg: #1e3a8a;
    --select-option-selected-color: #93c5fd;
    
    /* Badges/Chips */
    --select-badge-bg: #1e40af;
    --select-badge-color: #dbeafe;
    
    /* Input */
    --select-placeholder-color: #6b7280;
  }
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Manual Toggle Implementation</h2>
      <p>Implement your own dark mode toggle with full control:</p>
      
      <h3>React Example</h3>
      <pre><code class="language-tsx">import { useState, useEffect } from 'react';
import { EnhancedSelect } from '@smilodon/react';

function App() {
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  
  return (
    <div>
      <button onClick={() => setIsDark(!isDark)}>
        Toggle Dark Mode
      </button>
      
      <EnhancedSelect items={items} />
    </div>
  );
}</code></pre>

      <pre><code class="language-css">[data-theme="dark"] enhanced-select {
  --select-bg-color: #1f2937;
  --select-text-color: #f9fafb;
  --select-border-color: #374151;
  --select-primary-color: #60a5fa;
  --select-dropdown-bg: #111827;
}

[data-theme="light"] enhanced-select {
  --select-bg-color: #ffffff;
  --select-text-color: #1f2937;
  --select-border-color: #d1d5db;
  --select-primary-color: #3b82f6;
  --select-dropdown-bg: #ffffff;
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Class-Based Toggle</h2>
      <pre><code class="language-javascript">// Vanilla JS
function toggleDarkMode() {
  document.body.classList.toggle('dark');
}</code></pre>

      <pre><code class="language-css">body.dark enhanced-select {
  --select-bg-color: #1f2937;
  --select-text-color: #f9fafb;
  --select-border-color: #374151;
  --select-primary-color: #60a5fa;
  --select-dropdown-bg: #111827;
  --select-option-hover-bg: #374151;
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Complete Dark Mode Theming</h2>
      <pre><code class="language-css">/* Light Mode (Default) */
:root {
  --select-bg: #ffffff;
  --select-text: #1f2937;
  --select-border: #d1d5db;
  --select-primary: #3b82f6;
  --select-dropdown-bg: #ffffff;
  --select-option-hover: #f3f4f6;
  --select-option-selected: #dbeafe;
  --select-badge-bg: #3b82f6;
  --select-badge-text: #ffffff;
  --select-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  :root {
    --select-bg: #1f2937;
    --select-text: #f9fafb;
    --select-border: #374151;
    --select-primary: #60a5fa;
    --select-dropdown-bg: #111827;
    --select-option-hover: #374151;
    --select-option-selected: #1e3a8a;
    --select-badge-bg: #1e40af;
    --select-badge-text: #dbeafe;
    --select-shadow: 0 4px 6px rgba(0,0,0,0.5);
  }
}

enhanced-select {
  --select-bg-color: var(--select-bg);
  --select-text-color: var(--select-text);
  --select-border-color: var(--select-border);
  --select-primary-color: var(--select-primary);
  --select-dropdown-bg: var(--select-dropdown-bg);
  --select-option-hover-bg: var(--select-option-hover);
  --select-option-selected-bg: var(--select-option-selected);
  --select-badge-bg: var(--select-badge-bg);
  --select-badge-color: var(--select-badge-text);
  --select-shadow: var(--select-shadow);
}</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Persistent Dark Mode with LocalStorage</h2>
      <pre><code class="language-javascript">// Save user preference
function setTheme(isDark) {
  const theme = isDark ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// Load preference on page load
function loadTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
}

// Initialize
loadTheme();

// Listen for system preference changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    setTheme(e.matches);
  }
});</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Framework Integration Examples</h2>
      
      <h3>Vue 3 with Composition API</h3>
      <pre><code class="language-vue">&lt;template&gt;
  &lt;div&gt;
    &lt;button @click="toggleDark"&gt;Toggle Dark Mode&lt;/button&gt;
    &lt;EnhancedSelect :items="items" /&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { ref, watchEffect } from 'vue';
import { EnhancedSelect } from '@smilodon/vue';

const isDark = ref(false);

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
});

function toggleDark() {
  isDark.value = !isDark.value;
}
&lt;/script&gt;</code></pre>

      <h3>Svelte with Stores</h3>
      <pre><code class="language-svelte">&lt;script&gt;
  import { writable } from 'svelte/store';
  import { EnhancedSelect } from '@smilodon/svelte';
  
  const isDark = writable(false);
  
  $: {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', $isDark ? 'dark' : 'light');
    }
  }
&lt;/script&gt;

&lt;button on:click={() => $isDark = !$isDark}&gt;
  Toggle Dark Mode
&lt;/button&gt;

&lt;EnhancedSelect items={items} /&gt;</code></pre>
    </div>
    
    <div class="doc-section">
      <h2>Smooth Transitions Between Themes</h2>
      <pre><code class="language-css">enhanced-select {
  transition: background-color 200ms ease-out,
              border-color 200ms ease-out,
              color 200ms ease-out;
}

enhanced-select::part(dropdown) {
  transition: background-color 200ms ease-out,
              box-shadow 200ms ease-out;
}

enhanced-select::part(option) {
  transition: background-color 150ms ease-out,
              color 150ms ease-out;
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
