import { access, mkdir, readdir, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';

// Normalizes `tsc` declaration output into a flat `dist/types/index.d.ts`
// layout, mirroring the other @smilodon/* packages (see vanilla/react).
const typesDirectory = 'dist/types';
const declarationSources = [
  join(typesDirectory, 'angular', 'src'),
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
    throw new Error(`Angular declaration output was not found under ${typesDirectory}`);
  }

  const files = await readdir(sourceDirectory);
  if (!files.includes('index.d.ts')) {
    throw new Error(`Angular declaration output is missing index.d.ts under ${sourceDirectory}`);
  }

  await mkdir(typesDirectory, { recursive: true });
  for (const file of files) {
    await rename(join(sourceDirectory, file), join(typesDirectory, file));
  }

  for (const directory of ['core', 'angular', 'src', 'tests']) {
    await rm(join(typesDirectory, directory), { recursive: true, force: true });
  }

  console.log('Angular declarations are ready in dist/types.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
