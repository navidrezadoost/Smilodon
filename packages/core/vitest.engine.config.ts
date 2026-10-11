import { defineConfig } from 'vitest/config';

// Run the headless engine without the shared component/DOM setup.
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: [],
    include: [
      'packages/core/tests/item-adapter.spec.ts',
      'packages/core/tests/item-registry.spec.ts',
      'packages/core/tests/select-machine.spec.ts',
      'packages/core/tests/select-selection.spec.ts',
    ],
  },
});
