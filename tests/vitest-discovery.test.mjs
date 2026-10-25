import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { test } from 'node:test';
import { createVitest } from 'vitest/node';

const root = process.cwd();

test('core Vitest config discovers core suites and excludes Playwright suites', async () => {
  const vitest = await createVitest('test', {
    config: path.resolve(root, 'packages/core/vitest.config.ts'),
    root,
    run: false,
    watch: false,
  });

  try {
    const discovered = await vitest.globTestFiles();
    const files = discovered
      .map(([, file]) => path.relative(root, file).split(path.sep).join('/'))
      .sort();

    assert.ok(files.length > 0, 'Vitest should discover core unit and integration suites');
    assert.ok(files.includes('packages/core/tests/stress.spec.ts'));
    assert.ok(files.includes('packages/core/tests/enhanced-select-virtualization-integration.spec.ts'));
    assert.ok(files.includes('packages/core/tests/public-config-integration.spec.ts'));
    assert.ok(
      files.every((file) => file.startsWith('packages/core/tests/')),
      `Vitest discovered files outside the core test boundary:\n${files.filter((file) => !file.startsWith('packages/core/tests/')).join('\n')}`,
    );
    assert.ok(!files.some((file) => file.startsWith('tests/performance/')));
    assert.ok(!files.some((file) => file.startsWith('tests/e2e/')));
    assert.ok(!files.some((file) => file.startsWith('tests/contracts/')));
  } finally {
    await vitest.close();
  }
});

test('data-loading suites are discovered by their DOM-free Node config', async () => {
  const vitest = await createVitest('test', {
    config: path.resolve(root, 'packages/core/vitest.data-loading.config.ts'),
    root,
    run: false,
    watch: false,
  });

  try {
    const discovered = await vitest.globTestFiles();
    const files = discovered
      .map(([, file]) => path.relative(root, file).split(path.sep).join('/'))
      .sort();

    assert.deepEqual(files, [
      'packages/core/tests/data-loading/public-config.spec.ts',
      'packages/core/tests/data-loading/request-coordinator.spec.ts',
    ]);
  } finally {
    await vitest.close();
  }
});

test('Playwright config independently discovers the browser performance benchmark', () => {
  const result = spawnSync(process.execPath, [
    path.resolve(root, 'node_modules/playwright/cli.js'),
    'test',
    '--config',
    path.resolve(root, 'tests/performance/playwright.config.ts'),
    '--list',
  ], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30_000,
  });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;

  assert.equal(result.status, 0, `Playwright discovery failed:\n${output}`);
  assert.match(output, /phase-4-browser-benchmark\.spec\.ts/);
});
