import React, { StrictMode, createRef } from "react";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EnhancedSelect,
  resetSelectConfig,
  type DataRequestCompletion,
  type LoadMoreDataRequest,
  type SearchDataRequest,
  type SelectInstanceConfig,
} from "@smilodon/core";
import { Select, type SelectHandle, type SelectItem } from "../src/index";

type SearchCallback = (
  query: string,
  results?: Array<{ value: string | number; label: string }>,
  count?: number,
  request?: SearchDataRequest,
) => void;

const createSearchSpy = () =>
  vi.fn((..._args: Parameters<SearchCallback>) => {});

describe("React acknowledged data-loading facade", () => {
  beforeAll(() => {
    if (!customElements.get("enhanced-select")) {
      customElements.define("enhanced-select", EnhancedSelect);
    }
  });

  beforeEach(() => {
    resetSelectConfig();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("keeps legacy callback arguments and loading behavior unchanged", async () => {
    const onSearch = createSearchSpy();
    const { container } = render(
      <Select searchable loading onSearch={onSearch} aria-busy={false} />,
    );
    const host = container.querySelector("enhanced-select") as EnhancedSelect;

    await waitFor(() => expect(host.getAttribute("aria-busy")).toBe("false"));
    expect(host.shadowRoot?.querySelector('[role="listbox"]')?.getAttribute("aria-busy"))
      .toBeNull();

    const legacyEvent = new CustomEvent("search", {
      detail: { query: "kiwi", results: [], count: 0 },
    });
    act(() => host.dispatchEvent(legacyEvent));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch.mock.calls[0]).toEqual(["kiwi", [], 0]);
    expect(onSearch.mock.calls[0]).toHaveLength(3);
  });

  it("preserves the legacy grouped-item input and imperative setItems replacement", async () => {
    const ref = createRef<SelectHandle>();
    const groups = [{
      label: "Fruit",
      options: [{ value: "apple", label: "Apple" }],
    }];
    const replacement: SelectItem[] = [
      { value: "pear", label: "Pear" },
      { value: "plum", label: "Plum" },
    ];
    const { container } = render(<Select ref={ref} groupedItems={groups} />);
    const host = container.querySelector("enhanced-select") as EnhancedSelect;

    await waitFor(() => {
      expect((host as any)._state.groupedItems).toEqual(groups);
    });
    expect(ref.current?.getDataLoadingState()).toMatchObject({
      status: "idle",
      activeRequest: null,
    });

    act(() => ref.current!.setItems(replacement));
    expect(host.loadedItems).toEqual(replacement);
    expect((host as any)._state.groupedItems).toEqual([]);
    expect(ref.current?.getDataLoadingState().activeRequest).toBeNull();
  });

  it("preserves the legacy load-more page argument without request metadata", async () => {
    const onSearch = createSearchSpy();
    const onLoadMore = vi.fn();
    const { container } = render(
      <Select searchable onSearch={onSearch} onLoadMore={onLoadMore} />,
    );
    const host = container.querySelector("enhanced-select") as EnhancedSelect;
    const input = host.shadowRoot?.querySelector<HTMLInputElement>("input");
    expect(input).toBeTruthy();

    act(() => {
      input!.value = "pear";
      input!.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    });
    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    onLoadMore.mockClear();

    act(() => {
      host.dispatchEvent(new CustomEvent("loadMore", { detail: { page: 2 } }));
    });
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(onLoadMore.mock.calls[0]).toEqual([2]);
  });

  it("installs listeners and config before opening one Strict Mode initial request", async () => {
    const ref = createRef<SelectHandle>();
    const order: string[] = [];
    const reactSearch = vi.fn(
      (query: string, _results?: SelectItem[], _count?: number, request?: SearchDataRequest) => {
        order.push("react");
        expect(query).toBe("");
        expect(request?.fetchLimit).toBe(7);
      },
    );
    const config: SelectInstanceConfig = {
      dataLoading: {
        protocol: "acknowledged",
        searchMode: "remote",
        fetchLimit: 7,
      },
      callbacks: {
        onSearch: (query: string, request?: SearchDataRequest) => {
          order.push("core");
          expect(query).toBe("");
          expect(request?.fetchLimit).toBe(7);
        },
      },
    };

    const { container } = render(
      <StrictMode>
        <Select ref={ref} config={config} searchable onSearch={reactSearch} />
      </StrictMode>,
    );
    const host = container.querySelector("enhanced-select") as EnhancedSelect;
    const eventRequests: SearchDataRequest[] = [];
    host.addEventListener("search", (event) => {
      const request = (event as CustomEvent<{ request?: SearchDataRequest }>).detail.request;
      if (request) eventRequests.push(request);
    });

    await waitFor(() => expect(reactSearch).toHaveBeenCalledTimes(1));
    expect(order).toEqual(["react", "core"]);
    expect(eventRequests).toHaveLength(1);
    expect(reactSearch.mock.calls[0]).toHaveLength(4);
    expect(reactSearch.mock.calls[0][3]).toMatchObject({
      kind: "search",
      query: "",
      fetchLimit: 7,
      position: { mode: "page", page: 1 },
    });
    expect(eventRequests[0]).toEqual(reactSearch.mock.calls[0][3]);
    expect(ref.current?.getDataLoadingState().activeRequest?.requestId).toBe(
      reactSearch.mock.calls[0][3]?.requestId,
    );
    expect(host.getDataLoadingState().busy).toBe(true);
  });

  it("forwards completion and projection through the ref without changing request identity", async () => {
    const ref = createRef<SelectHandle>();
    const onSearch = createSearchSpy();
    const onDataProjection = vi.fn();
    const { container } = render(
      <Select
        ref={ref}
        searchable
        onSearch={onSearch}
        onDataProjection={onDataProjection}
        config={{
          dataLoading: { protocol: "acknowledged", searchMode: "remote" },
        }}
      />,
    );
    const host = container.querySelector("enhanced-select") as EnhancedSelect;

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    const request = onSearch.mock.calls[0][3]!;
    const completion: DataRequestCompletion = {
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: "succeeded",
      items: [{ value: "kiwi", label: "Kiwi" }],
      hasMore: true,
    };

    expect(
      ref.current!.completeDataRequest({
        requestId: request.requestId,
        queryGeneration: request.queryGeneration,
        status: "empty",
      } as never),
    ).toBe("invalid");
    expect(ref.current!.getDataLoadingState().activeRequest?.requestId).toBe(
      request.requestId,
    );

    let result: ReturnType<SelectHandle["completeDataRequest"]> | undefined;
    act(() => {
      result = ref.current!.completeDataRequest(completion);
    });
    expect(result).toBe("accepted");

    await waitFor(() => expect(onDataProjection).toHaveBeenCalledTimes(1));
    expect(onDataProjection.mock.calls[0][0]).toMatchObject({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      attempt: 1,
      status: "complete",
    });
    expect(host.loadedItems).toEqual([
      { value: "kiwi", label: "Kiwi" },
    ]);
    expect(ref.current?.getDataLoadingState().busy).toBe(false);

    const snapshot = ref.current!.getDataLoadingState();
    (snapshot.nextEligiblePosition as { mode: "page"; page: number }).page = 999;
    expect(ref.current!.getDataLoadingState().nextEligiblePosition).not.toEqual({
      mode: "page",
      page: 999,
    });
    expect(ref.current!.completeDataRequest(completion)).toBe("unknown-request");
  });

  it("forwards failed and recovered projection notifications without reaccepting completion", async () => {
    const ref = createRef<SelectHandle>();
    const onSearch = createSearchSpy();
    const onDataProjection = vi.fn();
    const onDataRequestCancel = vi.fn();
    const { container } = render(
      <Select
        ref={ref}
        searchable
        onSearch={onSearch}
        onDataProjection={onDataProjection}
        onDataRequestCancel={onDataRequestCancel}
        config={{
          dataLoading: { protocol: "acknowledged", searchMode: "remote" },
        }}
      />,
    );
    const host = container.querySelector("enhanced-select") as EnhancedSelect;

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    const request = onSearch.mock.calls[0][3]!;
    (host as any)._failNextAcknowledgedProjectionForTest("before-publish");

    let completionResult: ReturnType<SelectHandle["completeDataRequest"]> | undefined;
    act(() => {
      completionResult = ref.current!.completeDataRequest({
        requestId: request.requestId,
        queryGeneration: request.queryGeneration,
        status: "exhausted",
        items: [{ value: "pear", label: "Pear" }],
        hasMore: false,
      });
    });
    expect(completionResult).toBe("accepted");
    await waitFor(() => expect(onDataProjection).toHaveBeenCalledTimes(1));
    expect(onDataProjection.mock.calls[0][0]).toMatchObject({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      attempt: 1,
      status: "failed",
    });
    expect(ref.current?.getDataLoadingState()).toMatchObject({
      busy: true,
      projectionPending: true,
    });

    await act(async () => {
      await (host as any)._retryAcknowledgedProjectionForTest();
    });
    await waitFor(() => expect(onDataProjection).toHaveBeenCalledTimes(2));
    expect(onDataProjection.mock.calls[1][0]).toMatchObject({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      attempt: 2,
      status: "complete",
    });
    expect(host.loadedItems).toEqual([{ value: "pear", label: "Pear" }]);
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onDataRequestCancel).not.toHaveBeenCalled();
    expect(ref.current?.getDataLoadingState()).toMatchObject({
      busy: false,
      projectionPending: false,
    });
    expect(ref.current!.completeDataRequest({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: "exhausted",
      items: [{ value: "pear", label: "Pear" }],
      hasMore: false,
    })).toBe("unknown-request");
  });

  it("uses React pageSize as the acknowledged fetch-limit fallback", async () => {
    const onSearch = createSearchSpy();
    render(
      <Select
        searchable
        pageSize={7}
        onSearch={onSearch}
        config={{
          dataLoading: { protocol: "acknowledged", searchMode: "remote" },
        }}
      />,
    );

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    expect(onSearch.mock.calls[0][3]).toMatchObject({
      kind: "search",
      fetchLimit: 7,
      position: { mode: "page", page: 1 },
    });
  });

  it("forwards cursor load-more identity and the core-derived fetch limit", async () => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const order: string[] = [];
    const eventRequests: LoadMoreDataRequest[] = [];
    const onLoadMore = vi.fn((_page: number, _request?: LoadMoreDataRequest) => {
      order.push("react");
    });
    const { container } = render(
      <Select
        items={[{ value: "one", label: "One" }]}
        infiniteScroll
        pageSize={13}
        onLoadMore={onLoadMore}
        config={{
          callbacks: {
            onLoadMore: (_page, request) => {
              order.push("core");
              expect(request).toBeDefined();
            },
          },
          dataLoading: {
            protocol: "acknowledged",
            paginationMode: "cursor",
          },
        }}
      />,
    );
    const host = container.querySelector("enhanced-select") as EnhancedSelect;
    host.addEventListener("loadMore", (event) => {
      order.push("event");
      const request = (event as CustomEvent<{ request?: LoadMoreDataRequest }>).detail.request;
      if (request) eventRequests.push(request);
    });
    const loadMoreButton = () =>
      host.shadowRoot?.querySelector<HTMLButtonElement>(".load-more-button");

    await waitFor(() => expect(loadMoreButton()).toBeTruthy());
    act(() => loadMoreButton()!.click());

    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1));
    const [page, request] = onLoadMore.mock.calls[0];
    expect(page).toBe(1);
    expect(request).toMatchObject({
      kind: "loadMore",
      fetchLimit: 13,
      position: { mode: "cursor", ordinal: 1 },
    });
    expect(eventRequests).toHaveLength(1);
    expect(eventRequests[0]).toEqual(request);
    expect(order).toEqual(["event", "react", "core"]);
  });

  it("rejects an out-of-date search completion after a newer query", async () => {
    const ref = createRef<SelectHandle>();
    const onSearch = createSearchSpy();
    const { container } = render(
      <Select
        ref={ref}
        searchable
        onSearch={onSearch}
        config={{
          dataLoading: { protocol: "acknowledged", searchMode: "remote" },
        }}
      />,
    );
    const host = container.querySelector("enhanced-select") as EnhancedSelect;

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    const oldRequest = onSearch.mock.calls[0][3]!;
    const input = host.shadowRoot?.querySelector<HTMLInputElement>("input");
    expect(input).toBeTruthy();
    act(() => {
      input!.value = "pear";
      input!.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    });

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(2));
    const currentRequest = onSearch.mock.calls[1][3]!;
    expect(currentRequest.query).toBe("pear");
    expect(currentRequest.queryGeneration).toBeGreaterThan(oldRequest.queryGeneration);
    expect(
      ref.current!.completeDataRequest({
        requestId: oldRequest.requestId,
        queryGeneration: oldRequest.queryGeneration,
        status: "succeeded",
        items: [{ value: "stale", label: "Stale" }],
        hasMore: true,
      }),
    ).toBe("stale");
    expect(ref.current!.getDataLoadingState().activeRequest?.requestId).toBe(
      currentRequest.requestId,
    );
    expect(host.loadedItems).toEqual([]);
  });

  it("reconciles imperative acknowledged opt-in before the first request", async () => {
    const ref = createRef<SelectHandle>();
    const onSearch = createSearchSpy();
    const { container } = render(<Select ref={ref} searchable onSearch={onSearch} />);
    const host = container.querySelector("enhanced-select") as EnhancedSelect;

    await waitFor(() => expect(host.isConnected).toBe(true));
    act(() => {
      ref.current!.updateConfig({
        dataLoading: { protocol: "acknowledged", searchMode: "remote" },
      });
    });

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    expect(onSearch.mock.calls[0][3]).toMatchObject({
      kind: "search",
      query: "",
      position: { mode: "page", page: 1 },
    });
  });

  it("keeps external busy separate from the core snapshot and clears it independently", async () => {
    const ref = createRef<SelectHandle>();
    const config: SelectInstanceConfig = {
      dataLoading: { protocol: "acknowledged", searchMode: "local" },
    };
    const view = render(
      <Select ref={ref} config={config} loading aria-busy={false} />,
    );
    const host = view.container.querySelector("enhanced-select") as EnhancedSelect;
    const listbox = () => host.shadowRoot?.querySelector('[role="listbox"]');

    await waitFor(() => expect(host.getAttribute("aria-busy")).toBe("true"));
    expect(ref.current!.getDataLoadingState().busy).toBe(false);
    expect(listbox()?.getAttribute("aria-busy")).toBe("true");

    view.rerender(
      <Select ref={ref} config={config} loading={false} aria-busy={false} />,
    );
    await waitFor(() => expect(listbox()?.getAttribute("aria-busy")).toBeNull());
    expect(ref.current!.getDataLoadingState().busy).toBe(false);
    expect(host.getAttribute("aria-busy")).toBe("false");
  });

  it("composes external loading with core busy and preserves independent consumer state", async () => {
    const ref = createRef<SelectHandle>();
    const onSearch = createSearchSpy();
    const config: SelectInstanceConfig = {
      dataLoading: { protocol: "acknowledged", searchMode: "remote" },
    };
    const view = render(
      <Select
        ref={ref}
        config={config}
        searchable
        loading
        aria-busy={false}
        onSearch={onSearch}
      />,
    );
    const host = view.container.querySelector("enhanced-select") as EnhancedSelect;

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    const activeRequest = ref.current!.getDataLoadingState().activeRequest!;
    expect(host.getAttribute("aria-busy")).toBe("true");
    expect(host.shadowRoot?.querySelector('[role="listbox"]')?.getAttribute("aria-busy"))
      .toBe("true");

    view.rerender(
      <Select
        ref={ref}
        config={config}
        searchable
        loading={false}
        aria-busy={true}
        onSearch={onSearch}
      />,
    );
    expect(host.getAttribute("aria-busy")).toBe("true");
    expect(ref.current!.getDataLoadingState().activeRequest?.requestId).toBe(
      activeRequest.requestId,
    );

    const completion: DataRequestCompletion = {
      requestId: activeRequest.requestId,
      queryGeneration: activeRequest.queryGeneration,
      status: "succeeded",
      items: [],
      hasMore: true,
    };
    act(() => ref.current!.completeDataRequest(completion));
    await waitFor(() => expect(ref.current!.getDataLoadingState().busy).toBe(false));
    expect(host.shadowRoot?.querySelector('[role="listbox"]')?.getAttribute("aria-busy"))
      .toBe("true");

    view.rerender(
      <Select
        ref={ref}
        config={config}
        searchable
        loading={false}
        aria-busy={false}
        onSearch={onSearch}
      />,
    );
    await waitFor(() => {
      expect(host.getAttribute("aria-busy")).toBe("false");
      expect(host.shadowRoot?.querySelector('[role="listbox"]')?.getAttribute("aria-busy"))
        .toBeNull();
    });
  });

  it("rejects an invalid initial acknowledged config without legacy fallback or request dispatch", async () => {
    const onSearch = createSearchSpy();
    const onDataLoadingConfigError = vi.fn();
    const { container } = render(
      <Select
        searchable
        onSearch={onSearch}
        onDataLoadingConfigError={onDataLoadingConfigError}
        config={{
          dataLoading: {
            protocol: "acknowledged",
            searchMode: "not-a-mode",
          } as never,
        }}
      />,
    );
    const host = container.querySelector("enhanced-select") as EnhancedSelect;

    await waitFor(() => expect(onDataLoadingConfigError).toHaveBeenCalledTimes(1));
    expect(onSearch).not.toHaveBeenCalled();
    expect(host.getDataLoadingState().activeRequest).toBeNull();
  });

  it("preserves the prior accepted acknowledged config after an invalid prop update", async () => {
    const ref = createRef<SelectHandle>();
    const onSearch = createSearchSpy();
    const onDataLoadingConfigError = vi.fn();
    const validConfig: SelectInstanceConfig = {
      dataLoading: { protocol: "acknowledged", searchMode: "remote" },
    };
    const view = render(
      <Select
        ref={ref}
        config={validConfig}
        searchable
        onSearch={onSearch}
        onDataLoadingConfigError={onDataLoadingConfigError}
      />,
    );
    const host = view.container.querySelector("enhanced-select") as EnhancedSelect;

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    const requestId = onSearch.mock.calls[0][3]!.requestId;
    const invalidConfig = {
      placeholder: "Unrelated valid update",
      dataLoading: {
        protocol: "acknowledged",
        searchMode: "invalid",
      },
    } as unknown as SelectInstanceConfig;
    view.rerender(
      <Select
        ref={ref}
        config={invalidConfig}
        searchable
        onSearch={onSearch}
        onDataLoadingConfigError={onDataLoadingConfigError}
      />,
    );

    await waitFor(() => expect(onDataLoadingConfigError).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      expect(host.shadowRoot?.querySelector(".select-input")?.getAttribute("placeholder")).toBe(
        "Unrelated valid update",
      );
    });
    view.rerender(
      <Select
        ref={ref}
        config={invalidConfig}
        searchable
        onSearch={onSearch}
        onDataLoadingConfigError={onDataLoadingConfigError}
      />,
    );
    expect(ref.current!.getDataLoadingState().activeRequest?.requestId).toBe(requestId);
    expect(host.getDataLoadingState().activeRequest?.requestId).toBe(requestId);
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onDataLoadingConfigError).toHaveBeenCalledTimes(1);
  });

  it("uses the latest React callback after a callback-only rerender", async () => {
    const first = createSearchSpy();
    const latest = createSearchSpy();
    const config: SelectInstanceConfig = {
      dataLoading: { protocol: "acknowledged", searchMode: "local" },
    };
    const view = render(<Select config={config} onSearch={first} />);
    const host = view.container.querySelector("enhanced-select") as EnhancedSelect;
    await waitFor(() => expect(host.getDataLoadingState().connected).toBe(true));

    view.rerender(<Select config={config} onSearch={latest} />);
    act(() => {
      host.dispatchEvent(
        new CustomEvent("search", {
          detail: { query: "pear", results: [], count: 0 },
        }),
      );
    });

    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
    expect(latest.mock.calls[0]).toEqual(["pear", [], 0]);
  });

  it("removes adapter listeners on unmount", async () => {
    const onSearch = createSearchSpy();
    const { container, unmount } = render(
      <Select
        searchable
        onSearch={onSearch}
        config={{
          dataLoading: { protocol: "acknowledged", searchMode: "local" },
        }}
      />,
    );
    const host = container.querySelector("enhanced-select") as EnhancedSelect;

    await waitFor(() => expect(host.getDataLoadingState().connected).toBe(true));
    unmount();
    act(() => {
      host.dispatchEvent(
        new CustomEvent("search", {
          detail: { query: "after-unmount", results: [], count: 0 },
        }),
      );
    });

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("forwards core request-cancellation notifications to the React callback", async () => {
    const onSearch = createSearchSpy();
    const onDataRequestCancel = vi.fn();
    const { container } = render(
      <Select
        searchable
        onSearch={onSearch}
        onDataRequestCancel={onDataRequestCancel}
        config={{
          dataLoading: { protocol: "acknowledged", searchMode: "remote" },
        }}
      />,
    );
    const host = container.querySelector("enhanced-select") as EnhancedSelect;
    const order: string[] = [];
    let cancellationEvent: Event | undefined;

    // DOM connectivity alone does not prove the asynchronously loaded React
    // facade has installed its listeners. The first acknowledged search is an
    // observable readiness signal and gives us a real request to supersede.
    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    const originalRequest = onSearch.mock.calls[0][3]!;
    host.addEventListener(
      "dataRequestCancel",
      (event) => {
        cancellationEvent = event;
        order.push("cancel-event");
      },
      { capture: true },
    );
    onDataRequestCancel.mockImplementation(() => order.push("react-cancel"));
    onSearch.mockImplementation((query) => order.push(`search:${query}`));

    const input = host.shadowRoot?.querySelector<HTMLInputElement>("input");
    expect(input).toBeTruthy();
    act(() => {
      input!.value = "pear";
      input!.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    });

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(2));
    const replacementRequest = onSearch.mock.calls[1][3]!;
    expect(onDataRequestCancel).toHaveBeenCalledTimes(1);
    expect(cancellationEvent).toBeTruthy();
    const cancellation = (cancellationEvent as CustomEvent).detail;
    expect(cancellation).toMatchObject({
      requestId: originalRequest.requestId,
      queryGeneration: originalRequest.queryGeneration,
      reason: "query-changed",
    });
    expect(onDataRequestCancel).toHaveBeenCalledWith(cancellation);
    expect(replacementRequest.requestId).not.toBe(originalRequest.requestId);
    expect(replacementRequest.queryGeneration).toBeGreaterThan(
      originalRequest.queryGeneration,
    );
    expect(order).toEqual(["cancel-event", "react-cancel", "search:pear"]);
  });
});
