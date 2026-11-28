import React, { StrictMode, createContext, useContext, useEffect, useId, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Select, type SelectItem } from '@smilodon/react';

const IconContext = createContext('missing');
const items: SelectItem[] = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
  { value: 'three', label: 'Three' },
];
const lifecycle = { mounted: 0, cleaned: 0 };
const events: string[] = [];
let selectedValues: string[] = ['one'];
let setSelection: ((next: string[]) => void) | null = null;
let iconRevision: ((next: number) => void) | null = null;
let root: Root | null = null;

function RemoveIcon({ revision }: { revision: number }) {
  const context = useContext(IconContext);
  const instance = useId();
  useEffect(() => {
    lifecycle.mounted += 1;
    return () => { lifecycle.cleaned += 1; };
  }, []);
  return (
    <svg
      data-testid="custom-remove-icon"
      data-context={context}
      data-revision={revision}
      data-instance={instance}
      aria-hidden="true"
      viewBox="0 0 16 16"
    >
      <path d="M2 2 L14 14" />
    </svg>
  );
}

function App() {
  const [selection, setSelectionState] = useState(['one']);
  const [revision, setRevision] = useState(1);
  const [iconMode, setIconMode] = useState<'node' | 'string' | 'default'>('node');
  selectedValues = selection;
  setSelection = setSelectionState;
  iconRevision = setRevision;

  return (
    <IconContext.Provider value="preserved-context">
      <button id="reselect" type="button" onClick={() => setSelectionState(['one'])}>Reselect</button>
      <button id="update-icon" type="button" onClick={() => setRevision(2)}>Update icon</button>
      <button id="use-string-icon" type="button" onClick={() => setIconMode('string')}>Use string icon</button>
      <button id="use-default-icon" type="button" onClick={() => setIconMode('default')}>Use default icon</button>
      <button id="use-react-icon" type="button" onClick={() => setIconMode('node')}>Use React icon</button>
      <Select
        items={items}
        multiple
        value={selection}
        removeButtonIcon={iconMode === 'node' ? <RemoveIcon revision={revision} /> : iconMode === 'string' ? '!' : undefined}
        onChange={(value) => {
          events.push('change');
          setSelectionState(Array.isArray(value) ? value.map(String) : []);
        }}
        onSelect={() => events.push('select')}
      />
    </IconContext.Provider>
  );
}

function render() {
  const container = document.getElementById('react-remove-icon-root');
  if (!container) throw new Error('React remove icon root is missing');
  root = createRoot(container);
  root.render(<StrictMode><App /></StrictMode>);
}

declare global {
  interface Window {
    __issue97?: {
      events: string[];
      clearEvents: () => void;
      lifecycle: typeof lifecycle;
      selection: () => string[];
      host: () => HTMLElement | null;
      setSelection: (next: string[]) => void;
      updateIcon: (revision: number) => void;
      refreshItems: () => void;
      unmount: () => void;
    };
  }
}

window.__issue97 = {
  events,
  clearEvents: () => { events.length = 0; },
  lifecycle,
  selection: () => selectedValues,
  host: () => document.querySelector('enhanced-select'),
  setSelection: (next) => setSelection?.(next),
  updateIcon: (revision) => iconRevision?.(revision),
  refreshItems: () => {
    const host = document.querySelector('enhanced-select') as any;
    void host?.setItems([...items]);
  },
  unmount: () => {
    root?.unmount();
    root = null;
  },
};

render();
