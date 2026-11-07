import { access, mkdir, readdir, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';

const typesDirectory = 'dist/types';
const declarationSources = [
  join(typesDirectory, 'vanilla', 'src'),
  join(typesDirectory, 'src'),
];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  let sourceDirectory;
  for (const path of declarationSources) {
    if (await exists(path)) {
      sourceDirectory = path;
      break;
    }
  }

  if (!sourceDirectory) {
    throw new Error(`Vanilla declaration output was not found under ${typesDirectory}`);
  }

  const files = await readdir(sourceDirectory);
  if (!files.includes('index.d.ts')) {
    throw new Error(`Vanilla declaration output is missing index.d.ts under ${sourceDirectory}`);
  }

  await mkdir(typesDirectory, { recursive: true });
  for (const file of files) {
    await rename(join(sourceDirectory, file), join(typesDirectory, file));
  }

  for (const directory of ['core', 'vanilla', 'src', 'tests']) {
    await rm(join(typesDirectory, directory), { recursive: true, force: true });
  }

  console.log('Vanilla declarations are ready in dist/types.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
