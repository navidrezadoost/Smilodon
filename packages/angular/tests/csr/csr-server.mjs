/**
 * S5-Q — static server + Playwright web server for the CSR qualification fixture.
 *
 * Serves a BARE HTML document (no server-rendered markup) at `/` that loads the
 * client-side CSR bundle (`.aot-csr/csr-bundle.js`) as a `<script type="module">`.
 * This is the pure-CSR shape (bootstrap entirely in the browser) the CSR gates
 * exercise — the deliberate contrast to the SSR/hydration fixture.
 *
 * Exits non-zero if the CSR bundle is missing so the test fails fast with a clear
 * message rather than a blank page.
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.CSR_PORT || 5175);

const clientBundle = readFileSync(join(__dirname, '.aot-csr', 'csr-bundle.js'), 'utf8');

const pageHtml = `<!doctype html>
<html><head><meta charset="utf-8"><title>Smilodon CSR qualification</title></head>
<body><app-csr-shell></app-csr-shell>
<script type="module" src="/csr-bundle.js"></script></body></html>`;

const server = createServer((req, res) => {
  const url = req.url || '/';
  if (url === '/csr-bundle.js') {
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
  console.log(`[csr-server] listening on http://localhost:${PORT}/`);
});
