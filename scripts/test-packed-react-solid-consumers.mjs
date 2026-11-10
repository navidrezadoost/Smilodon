import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = await mkdtemp(join(tmpdir(), 'smilodon-packed-react-solid-'));
const tarballDirectory = join(fixtureRoot, 'tarballs');
const sourceDirectory = join(fixtureRoot, 'src');

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

try {
  await mkdir(tarballDirectory, { recursive: true });
  await mkdir(sourceDirectory, { recursive: true });

  const packedDependencies = {};
  for (const packageName of ['core', 'react', 'solid']) {
    run('npm', ['pack', '--workspace', `@smilodon/${packageName}`, '--pack-destination', tarballDirectory], repositoryRoot);
    const manifest = JSON.parse(await readFile(join(repositoryRoot, 'packages', packageName, 'package.json'), 'utf8'));
    const archiveName = `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`;
    packedDependencies[manifest.name] = `file:./tarballs/${archiveName}`;
  }

  const packageManifest = {
    name: 'smilodon-packed-react-solid-consumers',
    private: true,
    type: 'module',
    dependencies: {
      ...packedDependencies,
      react: '18.3.1',
      'react-dom': '18.3.1',
      'solid-js': '1.9.9',
    },
    devDependencies: {
      '@types/react': '18.3.24',
      '@types/react-dom': '18.3.7',
      typescript: '5.6.3',
    },
  };
  await writeFile(join(fixtureRoot, 'package.json'), `${JSON.stringify(packageManifest, null, 2)}\n`);
  await writeFile(join(sourceDirectory, 'react-consumer.tsx'), `
import { Select, type SelectHandle, type SelectItem } from '@smilodon/react';
import { createElement, useRef } from 'react';

const items: SelectItem[] = [{ value: 'one', label: 'One' }];
export function ReactConsumer() {
  const ref = useRef<SelectHandle>(null);
  return createElement(Select, { ref, items, value: 'one', onChange: (value) => String(value) });
}
`);
  await writeFile(join(sourceDirectory, 'solid-consumer.tsx'), `
import { Select, type SelectHandle, type SelectItem } from '@smilodon/solid';
import { createSignal } from 'solid-js';

const items: SelectItem[] = [{ value: 'one', label: 'One' }];
export function SolidConsumer() {
  const [value, setValue] = createSignal<string | number>('one');
  let ref: SelectHandle | undefined;
  const view = Select({ items, get value() { return value(); }, onChange: (next) => setValue(String(next)), ref: (handle) => { ref = handle; } });
  void ref;
  return view;
}
`);

  const commonOptions = {
    target: 'ES2022',
    strict: true,
    skipLibCheck: false,
    jsx: 'react-jsx',
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    noEmit: true,
  };
  await writeFile(join(fixtureRoot, 'tsconfig.nodenext.json'), `${JSON.stringify({
    compilerOptions: { ...commonOptions, module: 'NodeNext', moduleResolution: 'NodeNext' },
    include: ['src/**/*.tsx'],
  }, null, 2)}\n`);
  await writeFile(join(fixtureRoot, 'tsconfig.bundler.json'), `${JSON.stringify({
    compilerOptions: { ...commonOptions, module: 'ESNext', moduleResolution: 'Bundler' },
    include: ['src/**/*.tsx'],
  }, null, 2)}\n`);

  run('npm', ['install', '--no-audit', '--no-fund'], fixtureRoot);
  run('npx', ['tsc', '--project', 'tsconfig.nodenext.json', '--noEmit'], fixtureRoot);
  run('npx', ['tsc', '--project', 'tsconfig.bundler.json', '--noEmit'], fixtureRoot);
  console.log('Packed React 18 and Solid 1.9 consumers passed strict NodeNext and Bundler checks.');
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}
