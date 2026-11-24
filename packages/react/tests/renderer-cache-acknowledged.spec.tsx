import React, { StrictMode, createRef, useEffect, useState } from "react";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetSelectConfig,
  type EnhancedSelect,
  type LoadMoreDataRequest,
  type SearchDataRequest,
} from "@smilodon/core";
import { Select, type SelectHandle, type SelectItem } from "../src/index";

function makeItems(count: number, group?: (index: number) => string): SelectItem[] {
  return Array.from({ length: count }, (_, offset) => {
    const index = offset + 1;
    return {
      value: `item-${index}`,
      label: `Item ${index}`,
      ...(group ? { group: group(index) } : {}),
    };
  });
}

function TrackedOption({
  item,
  onUnmount,
}: {
  item: SelectItem;
  onUnmount: (value: string) => void;
}) {
  useEffect(() => () => onUnmount(String(item.value)), [item.value, onUnmount]);
  return <span data-testid={`tracked-option-${item.value}`}>Custom {item.label}</span>;
}

describe("React renderer cache with acknowledged pagination", () => {
  beforeEach(() => {
    resetSelectConfig();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("retains all accepted custom option roots through controlled multi-select changes and equivalent source props", async () => {
    const ref = createRef<SelectHandle>();
    const onSearch = vi.fn((
      _query: string,
      _results?: SelectItem[],
      _count?: number,
      _request?: SearchDataRequest,
    ) => {});
    const onLoadMore = vi.fn((_page: number, _request?: LoadMoreDataRequest) => {});
    const onChange = vi.fn();
    const initialItems = makeItems(6);
    const ControlledSelect = ({ source }: { source: SelectItem[] }) => {
      const [value, setValue] = useState<string[]>(["item-1"]);
      return (
        <Select
          ref={ref}
          items={source}
          multiple
          value={value}
          customRenderer={(item) => (
            <span data-testid={`custom-option-${item.value}`}>Custom {item.label}</span>
          )}
          infiniteScroll
          pageSize={6}
          onSearch={onSearch}
          onLoadMore={onLoadMore}
          onChange={(next) => {
            onChange(next);
            setValue(Array.isArray(next) ? next.map(String) : [String(next)]);
          }}
          config={{
            dataLoading: { protocol: "acknowledged", searchMode: "remote", fetchLimit: 6 },
          }}
        />
      );
    };
    const view = render(
      <StrictMode><ControlledSelect source={initialItems} /></StrictMode>,
    );
    const host = view.container.querySelector("enhanced-select") as EnhancedSelect;

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    const initialRequest = onSearch.mock.calls[0][3]!;
    act(() => ref.current!.completeDataRequest({
      requestId: initialRequest.requestId,
      queryGeneration: initialRequest.queryGeneration,
      status: "succeeded",
      items: makeItems(6),
      hasMore: true,
    }));

    const accepted = (count: number) => {
      expect(host.loadedItems).toHaveLength(count);
      for (let index = 1; index <= count; index += 1) {
        expect(host.shadowRoot?.querySelector(`[data-testid="custom-option-item-${index}"]`)
          ?.textContent).toBe(`Custom Item ${index}`);
      }
    };
    await waitFor(() => accepted(6));

    for (const count of [12, 18]) {
      const loadMoreButton = host.shadowRoot?.querySelector<HTMLButtonElement>(".load-more-button");
      await waitFor(() => expect(loadMoreButton).toBeTruthy());
      act(() => loadMoreButton!.click());
      await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(count / 6 - 1));
      const request = onLoadMore.mock.calls.at(-1)?.[1];
      expect(request).toBeTruthy();
      const completion = {
        requestId: request!.requestId,
        queryGeneration: request!.queryGeneration,
        items: makeItems(count),
      };
      if (count === 18) {
        act(() => ref.current!.completeDataRequest({
          ...completion,
          status: "exhausted",
          hasMore: false,
        }));
      } else {
        act(() => ref.current!.completeDataRequest({
          ...completion,
          status: "succeeded",
          hasMore: true,
        }));
      }
      await waitFor(() => accepted(count));
    }

    const laterPageOption = host.shadowRoot?.querySelector<HTMLElement>('[data-value="item-8"]');
    expect(laterPageOption).toBeTruthy();
    act(() => laterPageOption!.click());
    await waitFor(() => expect(host.getSelectedValues()).toEqual(["item-1", "item-8"]));

    const equivalentFreshItems = initialItems.map((item) => ({ ...item }));
    await act(async () => {
      view.rerender(
        <StrictMode><ControlledSelect source={equivalentFreshItems} /></StrictMode>,
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(host.getSelectedValues()).toEqual(["item-1", "item-8"]);
    accepted(18);
  });

  it("retains later grouped options and headers through controlled multi-select rerenders", async () => {
    const ref = createRef<SelectHandle>();
    const onSearch = vi.fn((
      _query: string,
      _results?: SelectItem[],
      _count?: number,
      _request?: SearchDataRequest,
    ) => {});
    const onLoadMore = vi.fn((_page: number, _request?: LoadMoreDataRequest) => {});
    const groupFor = (index: number) => `Group ${Math.ceil(index / 6)}`;
    const firstGroup = [{ label: "Group 1", options: makeItems(6, groupFor) }];
    const ControlledSelect = ({ groups }: { groups: typeof firstGroup }) => {
      const [value, setValue] = useState<string[]>(["item-1"]);
      return (
        <Select
          ref={ref}
          groupedItems={groups}
          multiple
          value={value}
          customRenderer={(item) => (
            <span data-testid={`custom-option-${item.value}`}>Custom {item.label}</span>
          )}
          groupHeaderRenderer={(group) => (
            <span data-testid={`custom-header-${group.label}`}>{group.label}</span>
          )}
          infiniteScroll
          pageSize={6}
          onSearch={onSearch}
          onLoadMore={onLoadMore}
          onChange={(next) => setValue(Array.isArray(next) ? next.map(String) : [String(next)])}
          config={{
            dataLoading: { protocol: "acknowledged", searchMode: "remote", fetchLimit: 6 },
          }}
        />
      );
    };
    const view = render(<ControlledSelect groups={firstGroup} />);
    const host = view.container.querySelector("enhanced-select") as EnhancedSelect;

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    const initialRequest = onSearch.mock.calls[0][3]!;
    act(() => ref.current!.completeDataRequest({
      requestId: initialRequest.requestId,
      queryGeneration: initialRequest.queryGeneration,
      status: "succeeded",
      items: makeItems(6, groupFor),
      hasMore: true,
    }));

    for (const count of [6, 12, 18]) {
      if (count > 6) {
        const button = host.shadowRoot?.querySelector<HTMLButtonElement>(".load-more-button");
        await waitFor(() => expect(button).toBeTruthy());
        act(() => button!.click());
        await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(count / 6 - 1));
        const request = onLoadMore.mock.calls.at(-1)?.[1]!;
        const completion = {
          requestId: request.requestId,
          queryGeneration: request.queryGeneration,
          items: makeItems(count, groupFor),
        };
        if (count === 18) {
          act(() => ref.current!.completeDataRequest({
            ...completion,
            status: "exhausted",
            hasMore: false,
          }));
        } else {
          act(() => ref.current!.completeDataRequest({
            ...completion,
            status: "succeeded",
            hasMore: true,
          }));
        }
      }
      await waitFor(() => {
        expect(host.loadedItems).toHaveLength(count);
        for (let index = 1; index <= count; index += 1) {
          expect(host.shadowRoot?.querySelector(`[data-testid="custom-option-item-${index}"]`)
            ?.textContent).toBe(`Custom Item ${index}`);
        }
        for (let group = 1; group <= count / 6; group += 1) {
          expect(host.shadowRoot?.querySelector(`[data-testid="custom-header-Group ${group}"]`)
            ?.textContent).toBe(`Group ${group}`);
        }
      });
    }

    const pageTwoOption = host.shadowRoot?.querySelector<HTMLElement>('[data-value="item-8"]');
    expect(pageTwoOption).toBeTruthy();
    act(() => pageTwoOption!.click());
    await waitFor(() => expect(host.getSelectedValues()).toEqual(["item-1", "item-8"]));

    const equivalentFirstGroup = [{
      label: "Group 1",
      options: firstGroup[0].options.map((item) => ({ ...item })),
    }];
    await act(async () => {
      view.rerender(<ControlledSelect groups={equivalentFirstGroup} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(host.getSelectedValues()).toEqual(["item-1", "item-8"]);
    expect(host.loadedItems).toHaveLength(18);
    for (let index = 1; index <= 18; index += 1) {
      expect(host.shadowRoot?.querySelector(`[data-testid="custom-option-item-${index}"]`)
        ?.textContent).toBe(`Custom Item ${index}`);
    }
    for (let group = 1; group <= 3; group += 1) {
      expect(host.shadowRoot?.querySelector(`[data-testid="custom-header-Group ${group}"]`)
        ?.textContent).toBe(`Group ${group}`);
    }
  });

  it("disposes roots detached by genuine dataset shrink and component unmount", async () => {
    const ref = createRef<SelectHandle>();
    const onSearch = vi.fn((
      _query: string,
      _results?: SelectItem[],
      _count?: number,
      _request?: SearchDataRequest,
    ) => {});
    const onLoadMore = vi.fn((_page: number, _request?: LoadMoreDataRequest) => {});
    const disposed = new Map<string, number>();
    const markDisposed = (value: string) => {
      disposed.set(value, (disposed.get(value) ?? 0) + 1);
    };
    const initialItems = makeItems(6);
    const renderSelect = (source: SelectItem[]) => (
      <Select
        ref={ref}
        items={source}
        customRenderer={(item) => <TrackedOption item={item} onUnmount={markDisposed} />}
        infiniteScroll
        pageSize={6}
        onSearch={onSearch}
        onLoadMore={onLoadMore}
        config={{
          dataLoading: { protocol: "acknowledged", searchMode: "remote", fetchLimit: 6 },
        }}
      />
    );
    const view = render(renderSelect(initialItems));
    const host = view.container.querySelector("enhanced-select") as EnhancedSelect;
    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    const initialRequest = onSearch.mock.calls[0][3]!;
    act(() => ref.current!.completeDataRequest({
      requestId: initialRequest.requestId,
      queryGeneration: initialRequest.queryGeneration,
      status: "succeeded",
      items: makeItems(6),
      hasMore: true,
    }));
    let loadMoreButton: HTMLButtonElement | null | undefined;
    await waitFor(() => {
      loadMoreButton = host.shadowRoot?.querySelector<HTMLButtonElement>(".load-more-button");
      expect(loadMoreButton).toBeTruthy();
    });
    act(() => loadMoreButton!.click());
    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1));
    const nextRequest = onLoadMore.mock.calls[0][1]!;
    act(() => ref.current!.completeDataRequest({
      requestId: nextRequest.requestId,
      queryGeneration: nextRequest.queryGeneration,
      status: "exhausted",
      items: makeItems(12),
      hasMore: false,
    }));
    await waitFor(() => expect(host.loadedItems).toHaveLength(12));
    await waitFor(() => expect(host.shadowRoot?.querySelector('[data-testid="tracked-option-item-12"]')
      ?.textContent).toBe("Custom Item 12"));

    view.rerender(renderSelect(makeItems(3).map((item) => ({ ...item, label: `Replacement ${item.label}` }))));
    await waitFor(() => expect(host.loadedItems).toHaveLength(3));
    await waitFor(() => {
      expect(host.shadowRoot?.querySelector('[data-testid="tracked-option-item-1"]')?.textContent)
        .toBe("Custom Replacement Item 1");
      expect(host.shadowRoot?.querySelector('[data-testid="tracked-option-item-3"]')?.textContent)
        .toBe("Custom Replacement Item 3");
    });
    await waitFor(() => {
      for (let index = 4; index <= 12; index += 1) {
        expect(disposed.get(`item-${index}`)).toBe(1);
      }
    });
    expect(host.shadowRoot?.querySelector('[data-testid="tracked-option-item-12"]')).toBeNull();

    view.unmount();
    await waitFor(() => {
      for (let index = 1; index <= 3; index += 1) {
        expect(disposed.get(`item-${index}`)).toBe(1);
      }
    });
  });

  it("disposes renderer roots when the React renderer is removed", async () => {
    const disposed = new Map<string, number>();
    const markDisposed = (value: string) => {
      disposed.set(value, (disposed.get(value) ?? 0) + 1);
    };
    const items = makeItems(2);
    const { container, rerender } = render(
      <Select
        items={items}
        customRenderer={(item) => <TrackedOption item={item} onUnmount={markDisposed} />}
      />,
    );
    const host = container.querySelector("enhanced-select") as EnhancedSelect;
    await waitFor(() => expect(host.shadowRoot?.querySelector('[data-testid="tracked-option-item-2"]'))
      .toBeTruthy());

    rerender(<Select items={items} />);
    await waitFor(() => {
      expect(disposed.get("item-1")).toBe(1);
      expect(disposed.get("item-2")).toBe(1);
    });
    expect(host.shadowRoot?.querySelector('[data-testid^="tracked-option-"]')).toBeNull();
  });
});
