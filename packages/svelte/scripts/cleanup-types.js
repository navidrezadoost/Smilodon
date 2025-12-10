#!/usr/bin/env node

/**
 * Cleanup script for TypeScript type declarations
 * 
 * Moves Svelte-specific types to the root and removes core package types
 * that were compiled due to path mapping in tsconfig.json
 */

import { readdir, rm, rename } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const distTypesDir = join(process.cwd(), 'dist', 'types');

async function cleanupTypes() {
  console.log('Cleaning up TypeScript declarations...');

  // Check if dist/types exists
  if (!existsSync(distTypesDir)) {
    console.log('No types directory found, skipping cleanup');
    return;
  }

  const entries = await readdir(distTypesDir, { withFileTypes: true });

  // Move svelte types to root
  const svelteDir = entries.find(e => e.isDirectory() && e.name === 'svelte');
  if (svelteDir) {
    const svelteSrcDir = join(distTypesDir, 'svelte', 'src');
    if (existsSync(svelteSrcDir)) {
      console.log('Moving Svelte types to root...');
      const files = await readdir(svelteSrcDir);
      
      for (const file of files) {
        const src = join(svelteSrcDir, file);
        const dest = join(distTypesDir, file);
        await rename(src, dest);
      }

      // Remove the svelte directory
      await rm(join(distTypesDir, 'svelte'), { recursive: true, force: true });
      console.log('✓ Svelte types moved to dist/types/');
    }
  }

  // Remove core types
  const coreDir = entries.find(e => e.isDirectory() && e.name === 'core');
  if (coreDir) {
    console.log('Removing core types...');
    await rm(join(distTypesDir, 'core'), { recursive: true, force: true });
    console.log('✓ Core types removed');
  }

  console.log('Type cleanup complete!');
}

cleanupTypes().catch(err => {
  console.error('Error during type cleanup:', err);
  process.exit(1);
});
