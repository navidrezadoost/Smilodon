import React, { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  Select,
  type SelectHandle,
  type SelectItem,
} from '@smilodon/react';
import type {
  DataRequestCompletion,
  DataRequestCompletionResult,
  DataLoadingStateSnapshot,
  SelectInstanceConfig,
} from '@smilodon/core';

type FixtureOptions = {
  config: SelectInstanceConfig;
  value: string | null;
  loading: boolean;
  consumerBusy: boolean | undefined;
  placeholder: string;
};

type FixtureEvent = {
  type: string;
  [key: string]: unknown;
};

type FixtureApi = {
  events: FixtureEvent[];
  clearEvents: () => void;
  host: () => HTMLElement | null;
  open: () => void;
  state: () => DataLoadingStateSnapshot | null;
  selectedValues: () => Array<string | number>;
  update: (patch: Partial<FixtureOptions>) => void;
  complete: (completion: DataRequestCompletion) => DataRequestCompletionResult | null;
  dispatchSearch: (query: string) => void;
  unmount: () => void;
  remount: () => void;
};

declare global {
  interface Window {
    __smilodonReactCertification?: FixtureApi;
  }
}

const items: SelectItem[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

const query = new URLSearchParams(window.location.search);
const initialProtocol = query.get('protocol') === 'legacy' ? 'legacy' : 'acknowledged';
const initialSearchMode = query.get('mode') === 'hybrid' ? 'hybrid' : 'remote';

const initialOptions: FixtureOptions = {
  config: {
    dataLoading: {
      protocol: initialProtocol,
      searchMode: initialSearchMode,
      paginationMode: 'cursor',
      fetchLimit: 3,
    },
  },
  value: query.has('uncontrolled') ? null : 'apple',
  loading: false,
  consumerBusy: false,
  placeholder: 'Choose a fruit',
};

const events: FixtureEvent[] = [];
let updateOptions: ((patch: Partial<FixtureOptions>) => void) | null = null;
let selectHandle: SelectHandle | null = null;
let root: Root | null = null;

function record(type: string, details: Record<string, unknown> = {}) {
  events.push({ type, ...details });
}

function CertificationApp() {
  const [options, setOptions] = useState(initialOptions);
  const handleRef = useRef<SelectHandle>(null);

  useEffect(() => {
    selectHandle = handleRef.current;
    updateOptions = (patch) => setOptions((current) => ({ ...current, ...patch }));
    return () => {
      if (updateOptions) updateOptions = null;
      selectHandle = null;
    };
  }, []);

  return (
    <section aria-label="React adapter test fixture">
      <output id="controlled-value">{options.value ?? 'uncontrolled'}</output>
      <Select
        ref={handleRef}
        items={items}
        value={options.value === null ? undefined : options.value}
        searchable
        infiniteScroll
        pageSize={2}
        placeholder={options.placeholder}
        config={options.config}
        className="react-certification-select"
        loading={options.loading}
        aria-busy={options.consumerBusy}
        onSearch={(searchQuery, results, count, request) =>
          record('search', { searchQuery, results, count, request: request ?? null })
        }
        onLoadMore={(page, request) => record('loadMore', { page, request: request ?? null })}
        onChange={(value, selectedItems) => {
          record('change', { value, selectedItems });
          setOptions((current) => ({
            ...current,
            value: Array.isArray(value) ? String(value[0] ?? '') : String(value),
          }));
        }}
        onDataRequestCancel={(detail) => record('cancel', { detail })}
        onDataProjection={(detail) => record('projection', { detail })}
        onDataLoadingConfigError={(detail) => record('configError', { detail })}
      />
    </section>
  );
}

function renderFixture() {
  const container = document.getElementById('react-cert-root');
  if (!container) throw new Error('React certification root is missing');
  root = createRoot(container);
  root.render(
    <StrictMode>
      <CertificationApp />
    </StrictMode>,
  );
}

const api: FixtureApi = {
  events,
  clearEvents: () => { events.length = 0; },
  host: () => document.querySelector('enhanced-select'),
  open: () => selectHandle?.open(),
  state: () => selectHandle?.getDataLoadingState() ?? null,
  selectedValues: () => selectHandle?.getSelectedValues() ?? [],
  update: (patch) => updateOptions?.(patch),
  complete: (completion) => selectHandle?.completeDataRequest(completion) ?? null,
  dispatchSearch: (searchQuery) => {
    const input = api.host()?.shadowRoot?.querySelector<HTMLInputElement>('input');
    if (!input) throw new Error('React select search input is unavailable');
    input.value = searchQuery;
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  },
  unmount: () => {
    root?.unmount();
    root = null;
  },
  remount: () => {
    if (root) throw new Error('React certification fixture is already mounted');
    renderFixture();
  },
};

window.__smilodonReactCertification = api;

document.addEventListener('search', (event) => {
  const detail = (event as CustomEvent<Record<string, unknown>>).detail;
  record('searchEvent', { detail });
}, true);
document.addEventListener('loadMore', (event) => {
  const detail = (event as CustomEvent<Record<string, unknown>>).detail;
  record('loadMoreEvent', { detail });
}, true);

renderFixture();
