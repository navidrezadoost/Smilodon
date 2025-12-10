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
    // Check if react/src exists
    const reactSrcPath = join(distTypesPath, 'react', 'src');
    if (await exists(reactSrcPath)) {
      // Move react/src/* to types/
      const files = await readdir(reactSrcPath);
      for (const file of files) {
        const src = join(reactSrcPath, file);
        const dest = join(distTypesPath, file);
        await rename(src, dest);
      }
    }

    // Remove core and react directories
    const corePath = join(distTypesPath, 'core');
    const reactPath = join(distTypesPath, 'react');
    
    if (await exists(corePath)) {
      await rm(corePath, { recursive: true, force: true });
    }
    if (await exists(reactPath)) {
      await rm(reactPath, { recursive: true, force: true });
    }

    console.log('✓ Type declarations cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up types:', error);
    process.exit(1);
  }
}

cleanupTypes();
