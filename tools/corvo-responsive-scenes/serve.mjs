import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./site/', import.meta.url)));
const portIndex = process.argv.indexOf('--port');
const port = portIndex === -1 ? 8766 : Number.parseInt(process.argv[portIndex + 1], 10);

if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Use --port with a value from 1 to 65535.');

const mime = { '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2' };

createServer((request, response) => {
  const requestPath = new URL(request.url ?? '/', 'http://localhost').pathname;
  const decoded = decodeURIComponent(requestPath);
  const relative = decoded.endsWith('/') ? `${decoded}index.html` : decoded;
  const candidate = resolve(root, `.${sep}${normalize(relative)}`);
  if (!candidate.startsWith(`${root}${sep}`)) {
    response.writeHead(403, { 'Cache-Control': 'no-store' });
    response.end('Forbidden');
    return;
  }
  try { if (!statSync(candidate).isFile()) throw new Error('Not a file'); } catch {
    response.writeHead(404, { 'Cache-Control': 'no-store' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'Cache-Control': 'no-store', 'Content-Type': mime[extname(candidate).toLowerCase()] ?? 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
  createReadStream(candidate).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Corvo responsive scenes: http://127.0.0.1:${port}/`);
  console.log(`Static root: ${root}`);
});
