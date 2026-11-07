import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'smilodon-native-types-'));
const packageDirectory = path.join(temporaryRoot, 'packages');
const consumerDirectory = path.join(temporaryRoot, 'consumer');
const generatedBundlePath = path.join(repositoryRoot, 'packages/react-native/src/generated/coreBundle.ts');
const originalGeneratedBundle = await readFile(generatedBundlePath);
const corePackage = JSON.parse(await readFile(path.join(repositoryRoot, 'packages/core/package.json'), 'utf8'));
const reactNativePackage = JSON.parse(await readFile(path.join(repositoryRoot, 'packages/react-native/package.json'), 'utf8'));

function run(command, args, cwd, options = {}) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  await Promise.all([
    mkdir(packageDirectory, { recursive: true }),
    mkdir(consumerDirectory, { recursive: true }),
  ]);

  run('npm', ['run', 'build', '-w', '@smilodon/core'], repositoryRoot);
  run('npm', ['run', 'build', '-w', '@smilodon/react-native'], repositoryRoot);

  run('npm', ['pack', '-w', '@smilodon/core', '--pack-destination', packageDirectory], repositoryRoot);
  run('npm', ['pack', '-w', '@smilodon/react-native', '--pack-destination', packageDirectory], repositoryRoot);

  const coreTarball = path.join(packageDirectory, `smilodon-core-${corePackage.version}.tgz`);
  const reactNativeTarball = path.join(packageDirectory, `smilodon-react-native-${reactNativePackage.version}.tgz`);
  const fixturePackage = {
    name: 'smilodon-react-native-native-types-consumer',
    private: true,
    type: 'module',
    dependencies: {
      '@smilodon/core': `file:${coreTarball}`,
      '@smilodon/react-native': `file:${reactNativeTarball}`,
      react: '18.3.1',
      'react-native': '0.76.9',
      'react-native-webview': '13.12.5',
    },
    devDependencies: {
      '@types/react': '18.3.18',
      typescript: '5.9.3',
    },
  };
  await writeFile(path.join(consumerDirectory, 'package.json'), `${JSON.stringify(fixturePackage, null, 2)}\n`);
  await writeFile(path.join(consumerDirectory, 'consumer.tsx'), `import React, { createRef } from 'react';
import { Select, type SelectHandle, type SelectItem, type SelectProps, type SelectValue } from '@smilodon/react-native';
import type { GlobalSelectConfig, SelectionConfig, MultiSelectDisplayConfig, ScrollToSelectedConfig, StyleConfig } from '@smilodon/core/native-types';
import { View } from 'react-native';

type IsAny<T> = 0 extends (1 & T) ? true : false;
type AssertFalse<T extends false> = T;
type SearchableIsTyped = AssertFalse<IsAny<SelectProps['searchable']>>;

const items: SelectItem[] = [{ value: 'one', label: 'One' }];
const ref = createRef<SelectHandle>();
const config: Partial<GlobalSelectConfig> = {
  selection: { mode: 'single' } satisfies SelectionConfig,
  multiSelectDisplay: { mode: 'wrap' } satisfies MultiSelectDisplayConfig,
  scrollToSelected: {
    enabled: true,
    multiSelectTarget: 'first',
    behavior: 'instant',
    block: 'center',
  } satisfies ScrollToSelectedConfig,
  styles: { container: { color: 'red' } } satisfies StyleConfig,
};
const scrollBehaviors: NonNullable<ScrollToSelectedConfig['behavior']>[] = ['auto', 'instant', 'smooth'];
const scrollBlocks: NonNullable<ScrollToSelectedConfig['block']>[] = ['start', 'center', 'end', 'nearest'];
const props: SelectProps = {
  items,
  value: 'one',
  config,
  onChange: (value, selectedItems) => {
    const typedValue: SelectValue = value;
    const typedItems: SelectItem[] = selectedItems;
    void typedValue;
    void typedItems;
  },
};

export const NativeConsumer = () => <View><Select {...props} ref={ref} /></View>;

// @ts-expect-error searchable must remain boolean.
const invalidProps: SelectProps = { searchable: 'yes' };
// @ts-expect-error scroll behavior must retain its finite public values without DOM types.
const invalidScroll: ScrollToSelectedConfig = { enabled: true, multiSelectTarget: 'first', behavior: 'later' };
void invalidProps;
void invalidScroll;
void scrollBehaviors;
void scrollBlocks;
void (null as unknown as SearchableIsTyped);
`);

  const commonCompilerOptions = {
    target: 'ES2022',
    jsx: 'react-jsx',
    customConditions: ['react-native'],
    lib: ['ES2022'],
    types: ['react', 'react-native'],
    strict: true,
    skipLibCheck: false,
    esModuleInterop: true,
    noEmit: true,
  };
  const nodeNextConfig = {
    compilerOptions: { ...commonCompilerOptions, module: 'NodeNext', moduleResolution: 'NodeNext' },
    include: ['consumer.tsx'],
  };
  const bundlerConfig = {
    compilerOptions: { ...commonCompilerOptions, module: 'ESNext', moduleResolution: 'Bundler' },
    include: ['consumer.tsx'],
  };
  await writeFile(path.join(consumerDirectory, 'tsconfig.nodenext.json'), `${JSON.stringify(nodeNextConfig, null, 2)}\n`);
  await writeFile(path.join(consumerDirectory, 'tsconfig.bundler.json'), `${JSON.stringify(bundlerConfig, null, 2)}\n`);

  run('npm', ['install', '--no-audit', '--no-fund'], consumerDirectory);

  const compiler = path.join(consumerDirectory, 'node_modules/typescript/bin/tsc');
  run(process.execPath, [compiler, '-p', 'tsconfig.nodenext.json'], consumerDirectory);
  run(process.execPath, [compiler, '-p', 'tsconfig.bundler.json'], consumerDirectory);

  const trace = run(process.execPath, [compiler, '-p', 'tsconfig.nodenext.json', '--traceResolution', '--listFilesOnly'], consumerDirectory, { capture: true });
  const listedFiles = trace.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean);
  const coreDeclarationPaths = listedFiles.filter((entry) => entry.includes('/node_modules/@smilodon/core/') && entry.endsWith('.d.ts'));
  const smilodonDeclarationPaths = listedFiles.filter((entry) => entry.includes('/node_modules/@smilodon/') && entry.endsWith('.d.ts'));
  assert(coreDeclarationPaths.some((entry) => entry.endsWith('/dist/types/src/native-types.d.ts')), 'native-types declaration was not resolved from the packed Core package');
  assert(coreDeclarationPaths.some((entry) => entry.endsWith('/dist/types/src/config/global-config.d.ts')), 'shared configuration declarations were not loaded');
  assert(coreDeclarationPaths.some((entry) => entry.endsWith('/dist/types/src/types/limitation.d.ts')), 'shared limitation declarations were not loaded');
  assert(!coreDeclarationPaths.some((entry) => entry.endsWith('/dist/types/src/index.d.ts')), 'native consumer resolved the browser Core declaration barrel');
  assert(smilodonDeclarationPaths.some((entry) => entry.endsWith('/react-native/dist/index.native.d.ts')), 'native adapter declaration was not resolved');
  assert(!smilodonDeclarationPaths.some((entry) => entry.endsWith('/react-native/dist/Select.web.d.ts')), 'native consumer resolved the React Native Web declarations');
  assert(!listedFiles.some((entry) => entry.endsWith('/lib.dom.d.ts')), 'DOM library unexpectedly entered the native TypeScript program');

  const nativeCorePackage = JSON.parse(await readFile(path.join(consumerDirectory, 'node_modules/@smilodon/core/package.json'), 'utf8'));
  const nativeTypesTarget = nativeCorePackage.exports?.['./native-types']?.types;
  assert(typeof nativeTypesTarget === 'string', 'packed Core package is missing the ./native-types types export condition');
  for (const declarationPath of smilodonDeclarationPaths) {
    const declaration = await readFile(declarationPath, 'utf8');
    assert(!/\b(?:HTMLElement|ShadowRoot|ScrollBehavior|ScrollLogicalPosition|Document|Window)\b/.test(declaration), `browser-only type found in native Smilodon declaration graph: ${declarationPath}`);
  }

  console.log(`Packed React Native type consumer passed (Core ${corePackage.version}, React Native ${reactNativePackage.version}; NodeNext + Bundler; DOM-free).`);
} finally {
  const generatedBundleAfterBuild = await readFile(generatedBundlePath);
  if (!generatedBundleAfterBuild.equals(originalGeneratedBundle)) {
    await writeFile(generatedBundlePath, originalGeneratedBundle);
    console.log('Restored tracked React Native generated core bundle after packaging.');
  }
  await rm(temporaryRoot, { recursive: true, force: true });
}
