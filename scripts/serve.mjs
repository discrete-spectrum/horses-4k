// Local preview: node scripts/serve.mjs  → http://localhost:8080
// Serves the folder like GitHub Pages does, including clean URLs
// (/shows → shows.html), which python's http.server doesn't. Files are read
// fresh on every request, so edits show on reload. PORT=9000 to change port.
// Only for previewing on this computer; it isn't used by the live site.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const port = Number(process.env.PORT) || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

async function isFile(p) {
  try { return (await stat(p)).isFile(); } catch { return false; }
}

// Same lookup order as GitHub Pages: exact file, dir/index.html, then name.html.
async function resolve(urlPath) {
  const rel = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  const base = join(root, rel);
  if (!base.startsWith(root)) return null;
  for (const p of [base, join(base, 'index.html'), `${base}.html`]) {
    if (await isFile(p)) return p;
  }
  return null;
}

createServer(async (req, res) => {
  const path = await resolve(new URL(req.url, 'http://x').pathname);
  if (!path) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
    console.log(`404 ${req.url}`);
    return;
  }
  res.writeHead(200, {
    'content-type': TYPES[extname(path).toLowerCase()] || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  res.end(await readFile(path));
}).listen(port, () => console.log(`Previewing horses4k at http://localhost:${port}  (Ctrl+C to stop)`));
