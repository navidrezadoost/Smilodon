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
    // Check if vue/src exists
    const vueSrcPath = join(distTypesPath, 'vue', 'src');
    if (await exists(vueSrcPath)) {
      // Move vue/src/* to types/
      const files = await readdir(vueSrcPath);
      for (const file of files) {
        const src = join(vueSrcPath, file);
        const dest = join(distTypesPath, file);
        await rename(src, dest);
      }
    }

    // Remove core and vue directories
    const corePath = join(distTypesPath, 'core');
    const vuePath = join(distTypesPath, 'vue');
    
    if (await exists(corePath)) {
      await rm(corePath, { recursive: true, force: true });
    }
    if (await exists(vuePath)) {
      await rm(vuePath, { recursive: true, force: true });
    }

    console.log('✓ Type declarations cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up types:', error);
    process.exit(1);
  }
}

cleanupTypes();
