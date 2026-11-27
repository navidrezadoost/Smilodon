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
const issue82ActiveClassScenario = query.get('scenario') === 'issue-82-active-class';
const issue107Scenario = query.get('scenario') === 'issue-107';
const issue112Scenario = query.get('scenario') === 'issue-112';
const issue119Scenario = query.get('scenario') === 'issue-119-custom-arrow';
const issue121Scenario = query.get('scenario') === 'issue-121-tooltip';
const busyBucketScenario = query.get('scenario') === 'busy-bucket';
const busyBucketWithoutIcon = busyBucketScenario && query.get('busy-icon') === 'none';
const issue82Items: SelectItem[] = [
  { value: 'one', label: 'First' },
  { value: 'two', label: 'Dana Pharmaceutical Group' },
  { value: 'three', label: 'Third' },
  { value: 'tehran', label: 'Tehran Darou' },
];
const issue82ClassMap = {
  selected: 'issue82-selected',
  active: 'issue82-active',
  disabled: 'issue82-disabled',
};
const issue107InitialItems: SelectItem[] = Array.from({ length: 6 }, (_, index) => ({
  value: `issue107-${index + 1}`,
  label: `Issue 107 option ${index + 1}`,
  metadata: { ordinal: index + 1 },
}));
const issue112InitialItems: SelectItem[] = Array.from({ length: 6 }, (_, index) => ({
  value: `issue112-${index + 1}`,
  label: `Issue 112 option ${index + 1}`,
}));
const issue121Items: SelectItem[] = [
  { value: 'issue121-long', label: 'International Pharmaceutical Distribution Company — Central Branch' },
  { value: 'issue121-short', label: 'Short' },
];
const initialProtocol = query.get('protocol') === 'legacy' ? 'legacy' : 'acknowledged';
const initialSearchMode = query.get('mode') === 'hybrid' ? 'hybrid' : 'remote';

const initialOptions: FixtureOptions = {
  config: issue82ActiveClassScenario || issue121Scenario ? {} : {
    dataLoading: {
      protocol: initialProtocol,
      searchMode: initialSearchMode,
      paginationMode: 'cursor',
      fetchLimit: 3,
    },
    ...(busyBucketScenario ? {
      busyBucket: {
        enabled: true,
        showSpinner: !busyBucketWithoutIcon,
        showMessage: true,
        message: 'Loading page…',
        minDisplayTime: 1000,
        contentMode: query.get('busy-mode') === 'replace' ? 'replace' : 'append',
      },
    } : {}),
  },
  value: issue82ActiveClassScenario || query.has('uncontrolled') ? null : issue121Scenario ? 'issue121-long' : 'apple',
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
        items={issue82ActiveClassScenario ? issue82Items : issue121Scenario ? issue121Items : items}
        value={options.value === null ? undefined : options.value}
        searchable
        infiniteScroll
        pageSize={2}
        placeholder={options.placeholder}
        config={options.config}
        className="react-certification-select"
        style={issue121Scenario ? { width: '210px' } : undefined}
        loading={options.loading}
        aria-busy={options.consumerBusy}
        classMap={issue82ActiveClassScenario ? issue82ClassMap : undefined}
        customRenderer={issue82ActiveClassScenario ? (item) => <span>{item.label}</span> : undefined}
        loadingIcon={busyBucketScenario && !busyBucketWithoutIcon
          ? <span data-testid="busy-icon-child">●</span>
          : undefined}
        loadingContent={busyBucketScenario ? (
          <div data-testid="busy-content-child">
            <strong>Loading another page</strong>
            <span>More options are on the way.</span>
          </div>
        ) : undefined}
        arrowIcon={issue119Scenario ? (
          <svg
            data-testid="issue119-custom-chevron"
            viewBox="0 0 16 16"
            width="16"
            height="16"
          >
            <path d="M4 6L8 10L12 6" />
          </svg>
        ) : undefined}
        onOpen={issue119Scenario ? () => record('open') : undefined}
        onClose={issue119Scenario ? () => record('close') : undefined}
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

function Issue107CertificationApp() {
  const [selected, setSelected] = useState<string[]>([]);
  const [cosmeticRevision, setCosmeticRevision] = useState(0);
  const handleRef = useRef<SelectHandle>(null);
  const freshEquivalentItems = issue107InitialItems.map((item) => ({
    ...item,
    metadata: item.metadata && typeof item.metadata === 'object'
      ? { ...item.metadata }
      : item.metadata,
  }));

  useEffect(() => {
    selectHandle = handleRef.current;
    return () => { selectHandle = null; };
  }, []);

  return (
    <section aria-label="React data ownership test fixture">
      <button id="issue107-rerender" onClick={() => setCosmeticRevision((revision) => revision + 1)}>
        Rerender presentation {cosmeticRevision}
      </button>
      <output id="issue107-selected">{selected.join(',')}</output>
      <Select
        ref={handleRef}
        items={freshEquivalentItems}
        value={selected}
        multiple
        searchable
        infiniteScroll
        pageSize={6}
        multiSelectDisplay={{
          mode: 'horizontal',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollToLatestChip: true,
          scrollToLatestChipBehavior: 'auto',
        }}
        removeButtonIcon={<span aria-hidden="true">×</span>}
        config={{
          dataLoading: {
            protocol: 'acknowledged',
            searchMode: 'remote',
            paginationMode: 'page',
            fetchLimit: 6,
          },
        }}
        style={{ width: '250px' }}
        onSearch={(searchQuery, results, count, request) =>
          record('search', { searchQuery, results, count, request: request ?? null })
        }
        onLoadMore={(page, request) => record('loadMore', { page, request: request ?? null })}
        onChange={(value) => setSelected(Array.isArray(value) ? value.map(String) : [String(value)])}
        onDataProjection={(detail) => record('projection', { detail })}
      />
    </section>
  );
}

function Issue112CertificationApp() {
  const [selected, setSelected] = useState<string[]>(['issue112-1']);
  const [presentationRevision, setPresentationRevision] = useState(0);
  const handleRef = useRef<SelectHandle>(null);
  const freshEquivalentItems = issue112InitialItems.map((item) => ({ ...item }));

  useEffect(() => {
    selectHandle = handleRef.current;
    return () => { selectHandle = null; };
  }, []);

  return (
    <section aria-label="React acknowledged renderer cache fixture">
      <button id="issue112-rerender" onClick={() => setPresentationRevision((revision) => revision + 1)}>
        Rerender source props {presentationRevision}
      </button>
      <output id="issue112-selected">{selected.join(',')}</output>
      <Select
        ref={handleRef}
        items={freshEquivalentItems}
        multiple
        value={selected}
        infiniteScroll
        pageSize={6}
        customRenderer={(item) => (
          <span data-testid={`issue112-custom-${item.value}`}>Custom {item.label}</span>
        )}
        config={{
          dataLoading: {
            protocol: 'acknowledged',
            searchMode: 'remote',
            paginationMode: 'page',
            fetchLimit: 6,
          },
        }}
        onSearch={(searchQuery, results, count, request) =>
          record('search', { searchQuery, results, count, request: request ?? null })
        }
        onLoadMore={(page, request) => record('loadMore', { page, request: request ?? null })}
        onChange={(value) => setSelected(Array.isArray(value) ? value.map(String) : [String(value)])}
        onDataProjection={(detail) => record('projection', { detail })}
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
      {issue112Scenario
        ? <Issue112CertificationApp />
        : issue107Scenario
          ? <Issue107CertificationApp />
          : <CertificationApp />}
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
