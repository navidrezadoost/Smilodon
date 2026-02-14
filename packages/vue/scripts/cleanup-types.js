import { readdir, rm, rename, access } from 'fs/promises';
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
