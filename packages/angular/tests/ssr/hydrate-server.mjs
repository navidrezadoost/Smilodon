/**
 * S5-V — hydration static server + Playwright web server.
 *
 * Serves the SERVER-RENDERED HTML (produced by `render-server.mjs` into
 * `.aot-out/server-render.html`) at `/`, injecting the client hydration bundle
 * (`.aot-client/client-bundle.js`) as a `<script type="module">`. This gives the
 * Playwright hydration test a real document: server markup + client bundle that
 * hydrates it — the exact production shape (framework SSR then framework
 * hydration).
 *
 * Exits non-zero if the SSR HTML is missing so the test fails fast with a clear
 * message rather than a blank page.
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.SSR_HYDRATE_PORT || 5174);

const serverHtml = readFileSync(join(__dirname, '.aot-out', 'server-render.html'), 'utf8');
const clientBundle = readFileSync(join(__dirname, '.aot-client', 'client-bundle.js'), 'utf8');

// Inject the hydration bundle just before </body>. Keep `type=module` so the
// hydrate entry runs after the server markup is parsed.
const pageHtml = serverHtml.replace(
  '</body>',
  '<script type="module" src="/client-bundle.js"></script></body>',
);

const server = createServer((req, res) => {
  const url = req.url || '/';
  if (url === '/client-bundle.js') {
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
    res.end(clientBundle);
    return;
  }
  if (url === '/' || url.startsWith('/?')) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(pageHtml);
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[ssr-hydrate-server] listening on http://localhost:${PORT}/`);
});
