import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const coreBundlePath = resolve(__dirname, '../../core/dist/index.umd.min.js')
const outputPath = resolve(__dirname, '../src/generated/coreBundle.ts')

const coreBundle = await readFile(coreBundlePath, 'utf8')
await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `const coreBundle = ${JSON.stringify(coreBundle)}\n\nexport default coreBundle\n`)
console.log('Embedded @smilodon/core bundle into the React Native adapter.')
