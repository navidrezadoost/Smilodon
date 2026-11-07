import { readdir, rm, rename, access, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const distTypesPath = './dist/types';

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function cleanupTypes() {
  try {
    // tsc may emit into dist/types/src/ or dist/types/vue/src/ depending
    // on the rootDir it resolves.  Handle both layouts so the final structure
    // is always dist/types/index.d.ts (+ siblings).
    const candidates = [
      join(distTypesPath, 'vue', 'src'),   // composite / paths layout
      join(distTypesPath, 'src'),           // flat layout
    ];

    for (const srcPath of candidates) {
      if (await exists(srcPath)) {
        const files = await readdir(srcPath);
        for (const file of files) {
          const src = join(srcPath, file);
          const dest = join(distTypesPath, file);
          await rename(src, dest);
        }
      }
    }

    const sfcDeclarationPath = join(distTypesPath, 'Select.vue.d.ts');
    const componentDeclarationPath = join(distTypesPath, 'Select.d.ts');
    if (await exists(sfcDeclarationPath)) {
      await rename(sfcDeclarationPath, componentDeclarationPath);
    } else {
      throw new Error(`Generated Vue component declaration was not found at ${sfcDeclarationPath}`);
    }

    const componentDeclaration = await readFile(componentDeclarationPath, 'utf8');
    const defaultDeclarationStart = componentDeclaration.lastIndexOf('declare const _default:');
    if (defaultDeclarationStart === -1) {
      throw new Error(`Generated Vue component declaration is missing its default component type at ${componentDeclarationPath}`);
    }

    // vue-tsc writes a long DefineComponent instantiation using newer Vue
    // internal generics. Keep the generated props and emits interfaces, while
    // publishing the stable generic surface supported by Vue 3.4 and later.
    const stableComponentType = `
export interface SelectExposed {
  open: () => void;
  close: () => void;
  focus: () => void;
  setItems: (items: SelectItem[]) => void;
  setGroupedItems: (groups: GroupedItem[]) => void;
  clear: () => void;
  getSelectedItems: () => SelectItem[];
  getSelectedValues: () => Array<string | number>;
  clearSearch: () => void;
  updateConfig: (config: Partial<GlobalSelectConfig>) => void;
  setError: (message: string) => void;
  clearError: () => void;
  setRequired: (required: boolean) => void;
  validate: () => boolean;
  getCapabilities: () => import('@smilodon/core').SelectCapabilitiesReport;
  getKnownLimitations: () => import('@smilodon/core').LimitationState[];
  getTrackingSnapshot: () => import('@smilodon/core').TrackingSnapshot;
  clearTracking: (source?: 'event' | 'style' | 'limitation' | 'all') => void;
  setLimitationPolicies: (policies: LimitationPolicyMap) => void;
}

type SelectComponentEmits = {
  'update:modelValue': (value: string | number | (string | number)[]) => void;
  change: (value: string | number | (string | number)[], selectedItems: SelectItem[]) => void;
  select: (item: SelectItem, index: number) => void;
  open: () => void;
  close: () => void;
  search: (query: string) => void;
  loadMore: (page: number) => void;
  create: (value: string) => void;
  clear: (detail: { clearedSelection: boolean; clearedSearch: boolean }) => void;
  diagnostic: (detail: DiagnosticEventDetail) => void;
}

declare const _default: import('vue').DefineComponent<
  SelectProps,
  SelectExposed,
  {},
  {},
  {},
  {},
  {},
  SelectComponentEmits
>;
export default _default;
`;
    await writeFile(componentDeclarationPath, componentDeclaration.slice(0, defaultDeclarationStart) + stableComponentType);

    const entryDeclarationPath = join(distTypesPath, 'index.d.ts');
    const entryDeclaration = await readFile(entryDeclarationPath, 'utf8');
    // NodeNext cannot resolve a source SFC suffix. The .js specifier resolves
    // to the adjacent Select.d.ts declaration in both NodeNext and Bundler.
    await writeFile(entryDeclarationPath, entryDeclaration.replaceAll('./Select.vue', './Select.js'));

    for (const file of await readdir(distTypesPath)) {
      if (!file.endsWith('.d.ts')) continue;
      const declaration = await readFile(join(distTypesPath, file), 'utf8');
      if (declaration.includes('.vue')) {
        throw new Error(`Published declaration still references a Vue SFC: ${join(distTypesPath, file)}`);
      }
    }

    // Remove leftover intermediate directories
    for (const dir of ['core', 'vue', 'src', 'tests']) {
      const p = join(distTypesPath, dir);
      if (await exists(p)) {
        await rm(p, { recursive: true, force: true });
      }
    }

    console.log('✓ Type declarations cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up types:', error);
    process.exit(1);
  }
}

cleanupTypes();
