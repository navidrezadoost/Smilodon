import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = await mkdtemp(join(tmpdir(), 'smilodon-selected-options-packed-'));
const tarballDirectory = join(fixtureRoot, 'tarballs');
const sourceDirectory = join(fixtureRoot, 'src');

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

try {
  await mkdir(tarballDirectory, { recursive: true });
  await mkdir(sourceDirectory, { recursive: true });

  const dependencies = {};
  for (const packageName of ['core', 'react', 'vue', 'svelte', 'solid', 'vanilla']) {
    run('npm', ['pack', '--workspace', `@smilodon/${packageName}`, '--pack-destination', tarballDirectory], repositoryRoot);
    const manifest = JSON.parse(await readFile(join(repositoryRoot, 'packages', packageName, 'package.json'), 'utf8'));
    const archiveName = `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`;
    dependencies[manifest.name] = `file:./tarballs/${archiveName}`;
  }

  const packageManifest = {
    name: 'smilodon-selected-options-packed-consumers',
    private: true,
    type: 'module',
    dependencies: {
      ...dependencies,
      react: '18.3.1',
      'react-dom': '18.3.1',
      vue: '3.5.45',
      svelte: '5.57.3',
      'solid-js': '1.9.18',
    },
    devDependencies: {
      '@types/react': '18.3.24',
      '@types/react-dom': '18.3.7',
      typescript: '5.9.3',
    },
  };
  await writeFile(join(fixtureRoot, 'package.json'), `${JSON.stringify(packageManifest, null, 2)}\n`);
  await writeFile(join(sourceDirectory, 'consumer.tsx'), `
import { createElement } from 'react';
import { Select as ReactSelect, type SelectProps as ReactProps, type SelectInstanceConfig as ReactConfig } from '@smilodon/react';
import { Select as VueSelect, type SelectProps as VueProps, type SelectInstanceConfig as VueConfig } from '@smilodon/vue';
import { Select as SvelteSelect, type SelectProps as SvelteProps, type SelectInstanceConfig as SvelteConfig } from '@smilodon/svelte';
import { Select as SolidSelect, type SelectProps as SolidProps, type SelectInstanceConfig as SolidConfig } from '@smilodon/solid';
import { createSelect } from '@smilodon/vanilla';
import { EnhancedSelect, type SelectInstanceConfig } from '@smilodon/core';

const items = [{ value: 'selected', label: 'Selected' }];
const reactConfig: ReactConfig = { selectedOptions: { placement: 'selected-first' }, scrollToSelected: { onOpen: 'align' } };
const vueConfig: VueConfig = { selectedOptions: { placement: 'original' }, scrollToSelected: { block: 'center' } };
const svelteConfig: SvelteConfig = { selectedOptions: { placement: 'selected-first' }, scrollToSelected: { enabled: false } };
const solidConfig: SolidConfig = { selectedOptions: { placement: 'original' }, scrollToSelected: { onOpen: 'preserve' } };
const coreConfig: SelectInstanceConfig = { selectedOptions: { placement: 'selected-first' }, scrollToSelected: { onOpen: 'reveal' } };

const reactProps: ReactProps = { items, value: 'selected', config: reactConfig };
const vueProps: VueProps = { items, modelValue: 'selected', config: vueConfig };
const svelteProps: SvelteProps = { items, value: 'selected', config: svelteConfig };
const solidProps: SolidProps = { items, value: 'selected', config: solidConfig };

export const ReactConsumer = () => createElement(ReactSelect, reactProps);
export const VueConsumer = () => VueSelect;
export const SvelteConsumer = () => SvelteSelect;
export const SolidConsumer = () => SolidSelect(solidProps);
export const VanillaConsumer = () => createSelect({ items, value: 'selected', config: { selectedOptions: { placement: 'selected-first' }, scrollToSelected: { onOpen: 'align' } } });
export const CoreConsumer = () => {
  const select = new EnhancedSelect();
  select.updateConfig(coreConfig);
  return select;
};

// A placement-only patch and an onOpen-only patch intentionally omit required siblings.
const partialPlacement: SelectInstanceConfig = { selectedOptions: { placement: 'original' } };
const partialScroll: SelectInstanceConfig = { scrollToSelected: { onOpen: 'align' } };
void [partialPlacement, partialScroll];
`);

  const commonOptions = {
    target: 'ES2022',
    strict: true,
    skipLibCheck: false,
    jsx: 'react-jsx',
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    noEmit: true,
  };
  for (const [name, module, moduleResolution] of [
    ['nodenext', 'NodeNext', 'NodeNext'],
    ['bundler', 'ESNext', 'Bundler'],
  ]) {
    await writeFile(join(fixtureRoot, `tsconfig.${name}.json`), `${JSON.stringify({
      compilerOptions: { ...commonOptions, module, moduleResolution },
      include: ['src/**/*.tsx'],
    }, null, 2)}\n`);
  }

  run('npm', ['install', '--no-audit', '--no-fund'], fixtureRoot);
  run('npx', ['tsc', '--project', 'tsconfig.nodenext.json', '--noEmit'], fixtureRoot);
  run('npx', ['tsc', '--project', 'tsconfig.bundler.json', '--noEmit'], fixtureRoot);
  console.log('Packed Core, React, Vue, Svelte, Solid, and Vanilla consumers passed strict NodeNext and Bundler checks with partial nested selected-options settings.');
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}
