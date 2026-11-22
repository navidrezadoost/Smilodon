import { describe, expect, it } from 'vitest';
import { DataRequestCoordinator, type DataCoordinatorAction, type DataRequest } from '../../src/data-loading/request-coordinator';

function requests(actions: readonly DataCoordinatorAction[]): DataRequest[] {
  return actions.flatMap((action) => action.type === 'request' ? [action.request] : []);
}

function makeCoordinator(minSearchCharacters = 3, initialItems: readonly unknown[] = ['seed']): DataRequestCoordinator {
  return new DataRequestCoordinator({
    config: {
      dataLoading: {
        protocol: 'acknowledged',
        searchMode: 'remote',
        paginationMode: 'page',
        firstPage: 1,
        fetchLimit: 6,
        minSearchCharacters,
      },
      infiniteScroll: { initialPage: 1, pageSize: 6 },
    },
    initialItems,
    hasMore: true,
  });
}

function succeed(
  coordinator: DataRequestCoordinator,
  request: DataRequest,
  items: unknown[],
  hasMore = true,
  nextCursor?: string | number,
): void {
  expect(coordinator.markNotificationsDispatched(request.requestId)).toBe(true);
  expect(coordinator.completeDataRequest({
    requestId: request.requestId,
    queryGeneration: request.queryGeneration,
    status: 'succeeded',
    items,
    hasMore,
    ...(request.position.mode === 'cursor' ? { nextCursor } : {}),
  })).toBe('accepted');
}

describe('acknowledged minimum search characters', () => {
  it('does not dispatch an initial empty query or short query and counts trimmed code points', () => {
    const coordinator = makeCoordinator();
    expect(requests(coordinator.connect())).toHaveLength(0);
    expect(coordinator.getSnapshot()).toMatchObject({ busy: false, items: ['seed'], hasMore: true });
    expect(requests(coordinator.setQuery('a'))).toHaveLength(0);
    expect(requests(coordinator.setQuery('  ab  '))).toHaveLength(0);
    const eligible = requests(coordinator.setQuery('  سلام  '));
    expect(eligible).toHaveLength(1);
    expect(eligible[0]).toMatchObject({ kind: 'search', query: '  سلام  ', normalizedQuery: 'سلام' });

    const unicode = makeCoordinator(2);
    unicode.connect();
    expect(requests(unicode.setQuery('😀'))).toHaveLength(0);
    expect(requests(unicode.setQuery('😀a'))).toHaveLength(1);
  });

  it('preserves browse pagination while filtered search is active and restores it when query falls below threshold', () => {
    const coordinator = makeCoordinator();
    coordinator.connect();
    const browsePage2 = requests(coordinator.requestLoadMore())[0];
    expect(browsePage2).toMatchObject({ query: '', normalizedQuery: '' });
    expect(browsePage2).toMatchObject({ kind: 'loadMore', position: { mode: 'page', page: 2 } });
    succeed(coordinator, browsePage2, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);

    const filtered = requests(coordinator.setQuery('abc'))[0];
    expect(filtered).toMatchObject({ kind: 'search', position: { mode: 'page', page: 1 } });
    succeed(coordinator, filtered, ['match-1', 'match-2'], true);
    const filteredPage2 = requests(coordinator.requestLoadMore())[0];
    expect(filteredPage2).toMatchObject({ kind: 'loadMore', position: { mode: 'page', page: 2 }, normalizedQuery: 'abc' });
    succeed(coordinator, filteredPage2, ['match-1', 'match-2', 'match-3'], true);

    const actions = coordinator.setQuery('ab');
    expect(actions.some((action) => action.type === 'cancel')).toBe(false);
    expect(requests(actions)).toHaveLength(0);
    expect(coordinator.getSnapshot()).toMatchObject({
      busy: false,
      items: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      hasMore: true,
      nextEligiblePosition: { mode: 'page', page: 3 },
    });
    expect(requests(coordinator.requestLoadMore())[0]).toMatchObject({
      kind: 'loadMore', position: { mode: 'page', page: 3 },
    });
  });

  it('keeps an in-flight unfiltered page valid while the user types below threshold', () => {
    const coordinator = makeCoordinator();
    coordinator.connect();
    const browsePage2 = requests(coordinator.requestLoadMore())[0];
    expect(requests(coordinator.setQuery('a'))).toHaveLength(0);
    expect(requests(coordinator.setQuery('ab'))).toHaveLength(0);
    expect(coordinator.getSnapshot().activeRequest?.requestId).toBe(browsePage2.requestId);
    succeed(coordinator, browsePage2, ['seed', 'page-2']);
    expect(coordinator.getSnapshot()).toMatchObject({
      busy: false,
      items: ['seed', 'page-2'],
      nextEligiblePosition: { mode: 'page', page: 3 },
    });
  });

  it('cancels qualifying searches on ineligibility and rejects late responses', () => {
    const coordinator = makeCoordinator();
    coordinator.connect();
    const active = requests(coordinator.setQuery('abc'))[0];
    const actions = coordinator.setQuery('ab');
    expect(actions).toContainEqual(expect.objectContaining({
      type: 'cancel',
      notification: expect.objectContaining({ requestId: active.requestId, reason: 'query-changed' }),
    }));
    expect(requests(actions)).toHaveLength(0);
    expect(coordinator.completeDataRequest({
      requestId: active.requestId,
      queryGeneration: active.queryGeneration,
      status: 'succeeded',
      items: ['stale'],
      hasMore: true,
    })).toBe('stale');
  });

  it('reconciles runtime threshold updates and rejects invalid values atomically', () => {
    const coordinator = makeCoordinator(3);
    coordinator.connect();
    const search = requests(coordinator.setQuery('abc'))[0];
    expect(coordinator.updateConfig({ dataLoading: { minSearchCharacters: 5 } }).status).toBe('accepted');
    expect(coordinator.getSnapshot().activeRequest).toBeNull();
    expect(coordinator.updateConfig({ dataLoading: { minSearchCharacters: 2 } }).status).toBe('accepted');
    expect(coordinator.getSnapshot().activeRequest).toMatchObject({ kind: 'search', normalizedQuery: 'abc' });
    const before = coordinator.getSnapshot();
    expect(coordinator.updateConfig({ dataLoading: { minSearchCharacters: -1 } }).status).toBe('invalid');
    expect(coordinator.getSnapshot()).toEqual(before);
    expect(search).toBeTruthy();
  });

  it('keeps browse and filtered cursor continuations independent in hybrid mode', () => {
    const coordinator = new DataRequestCoordinator({
      config: {
        dataLoading: {
          protocol: 'acknowledged',
          searchMode: 'hybrid',
          paginationMode: 'cursor',
          fetchLimit: 2,
          minSearchCharacters: 3,
        },
      },
      initialItems: ['preloaded'],
      hasMore: true,
    });
    expect(requests(coordinator.connect())).toHaveLength(0);
    const browseFirst = requests(coordinator.requestLoadMore())[0];
    expect(browseFirst).toMatchObject({ kind: 'loadMore', position: { mode: 'cursor', ordinal: 1 } });
    succeed(coordinator, browseFirst, ['preloaded', 'browse-1'], true, 'browse-cursor-1');

    const search = requests(coordinator.setQuery('abc'))[0];
    expect(search).toMatchObject({ kind: 'search', mode: 'hybrid', position: { mode: 'cursor', ordinal: 1 } });
    succeed(coordinator, search, ['filtered-1'], true, 'filtered-cursor-1');
    const filteredMore = requests(coordinator.requestLoadMore())[0];
    expect(filteredMore).toMatchObject({
      kind: 'loadMore',
      position: { mode: 'cursor', cursor: 'filtered-cursor-1', ordinal: 2 },
    });
    succeed(coordinator, filteredMore, ['filtered-1', 'filtered-2'], true, 'filtered-cursor-2');

    expect(requests(coordinator.setQuery('ab'))).toHaveLength(0);
    expect(coordinator.getSnapshot()).toMatchObject({
      items: ['preloaded', 'browse-1'],
      hasMore: true,
      nextEligiblePosition: { mode: 'cursor', cursor: 'browse-cursor-1', ordinal: 2 },
    });
    expect(requests(coordinator.requestLoadMore())[0]).toMatchObject({
      kind: 'loadMore',
      position: { mode: 'cursor', cursor: 'browse-cursor-1', ordinal: 2 },
    });
  });

  it('keeps snapshots, generations, and page positions separate across rapid mode transitions', () => {
    const coordinator = makeCoordinator();
    coordinator.connect();
    const browsePage2 = requests(coordinator.requestLoadMore())[0];
    succeed(coordinator, browsePage2, Array.from({ length: 12 }, (_, index) => `browse-${index + 1}`));

    const firstSearch = requests(coordinator.setQuery('abc'))[0];
    expect(firstSearch).toMatchObject({ kind: 'search', query: 'abc', position: { mode: 'page', page: 1 } });
    succeed(coordinator, firstSearch, ['filtered-1'], true);
    expect(requests(coordinator.setQuery('ab'))).toHaveLength(0);
    expect(coordinator.getSnapshot()).toMatchObject({
      items: Array.from({ length: 12 }, (_, index) => `browse-${index + 1}`),
      nextEligiblePosition: { mode: 'page', page: 3 },
    });

    const browsePage3 = requests(coordinator.requestLoadMore())[0];
    expect(browsePage3).toMatchObject({ kind: 'loadMore', query: '', normalizedQuery: '', position: { mode: 'page', page: 3 } });
    succeed(coordinator, browsePage3, Array.from({ length: 18 }, (_, index) => `browse-${index + 1}`));

    const secondSearch = requests(coordinator.setQuery('abcd'))[0];
    expect(secondSearch.queryGeneration).toBeGreaterThan(firstSearch.queryGeneration);
    expect(secondSearch).toMatchObject({ kind: 'search', query: 'abcd', position: { mode: 'page', page: 1 } });
    succeed(coordinator, secondSearch, ['filtered-next'], true);
    expect(requests(coordinator.setQuery('a'))).toHaveLength(0);
    expect(coordinator.getSnapshot()).toMatchObject({
      items: Array.from({ length: 18 }, (_, index) => `browse-${index + 1}`),
      nextEligiblePosition: { mode: 'page', page: 4 },
    });
  });
});
