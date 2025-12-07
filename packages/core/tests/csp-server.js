/**
 * Development server with CSP headers for manual testing.
 * Tests that the library works in CSP-restricted environments.
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Strict CSP policy for testing
const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "worker-src 'self' blob:",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'"
].join('; ');

// Even stricter policy (optional - for testing degradation)
const STRICT_CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "worker-src 'none'", // Disable workers
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'none'",
  "object-src 'none'"
].join('; ');

const server = createServer((req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url;
  const filePath = join(__dirname, '..', 'dist', url);
  const ext = extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  // Use strict CSP if ?strict query parameter
  const useStrict = req.url?.includes('?strict');
  const cspPolicy = useStrict ? STRICT_CSP_POLICY : CSP_POLICY;

  try {
    const content = readFileSync(filePath);
    
    // Set security headers
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Security-Policy': cspPolicy,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      // COOP/COEP for SharedArrayBuffer (optional)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    });
    
    res.end(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  }
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`CSP Test Server running at http://localhost:${PORT}/`);
  console.log('');
  console.log('Active CSP Policy:');
  console.log(CSP_POLICY);
  console.log('');
  console.log('Add ?strict to URL for stricter policy (workers disabled)');
  console.log('');
  console.log('Open browser console to check for CSP violations.');
});
