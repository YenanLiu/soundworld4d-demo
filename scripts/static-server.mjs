import http from 'node:http';
import {createReadStream} from 'node:fs';
import {realpath, stat} from 'node:fs/promises';
import {dirname, extname, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.gltf': 'model/gltf+json', '.wav': 'audio/wav',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.dae': 'model/vnd.collada+xml',
  '.zip': 'application/zip',
};

export function createSiteServer({root = resolve(here, 'site'), prefix = '/'} = {}) {
  if (!prefix.startsWith('/') || !prefix.endsWith('/')) throw new Error('Prefix needs leading and trailing slashes');
  const canonicalRootPromise = realpath(root);
  return http.createServer(async (req, res) => {
    const end = (code, text) => {res.writeHead(code, {'Content-Type': 'text/plain; charset=utf-8'}); res.end(req.method === 'HEAD' ? undefined : text);};
    if (!['GET', 'HEAD'].includes(req.method)) return end(405, 'Method not allowed');
    try {
      const url = new URL(req.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      if (!pathname.startsWith(prefix)) return end(404, 'Not found');
      const parts = pathname.slice(prefix.length).split('/');
      if (parts.some(part => part.startsWith('.') || part.includes('\\') || part.includes('\0'))) return end(403, 'Forbidden');
      const canonicalRoot = await canonicalRootPromise;
      let filename = resolve(canonicalRoot, ...parts);
      if (filename !== canonicalRoot && !filename.startsWith(canonicalRoot + sep)) return end(403, 'Forbidden');
      let info = await stat(filename);
      if (info.isDirectory()) {
        if (!pathname.endsWith('/')) {
          res.writeHead(308, {Location: url.pathname + '/' + url.search}); res.end(); return;
        }
        filename = resolve(filename, 'index.html'); info = await stat(filename);
      }
      const actual = await realpath(filename);
      if (!actual.startsWith(canonicalRoot + sep) || !info.isFile()) return end(403, 'Forbidden');
      let start = 0, finish = info.size - 1, status = 200;
      const headers = {'Content-Type': mime[extname(filename).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache', 'Accept-Ranges': 'bytes', 'X-Content-Type-Options': 'nosniff'};
      if (req.headers.range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if (!match || (!match[1] && !match[2])) {res.writeHead(416, {'Content-Range': `bytes */${info.size}`}); res.end(); return;}
        if (match[1]) {start = Number(match[1]); if (match[2]) finish = Math.min(Number(match[2]), finish);}
        else start = Math.max(0, info.size - Number(match[2]));
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(finish) || start > finish || start >= info.size) {
          res.writeHead(416, {'Content-Range': `bytes */${info.size}`}); res.end(); return;
        }
        status = 206; headers['Content-Range'] = `bytes ${start}-${finish}/${info.size}`;
      }
      headers['Content-Length'] = String(Math.max(0, finish - start + 1)); res.writeHead(status, headers);
      if (req.method === 'HEAD' || !info.size) {res.end(); return;}
      const stream = createReadStream(actual, {start, end: finish});
      stream.on('error', () => res.destroy()); res.on('close', () => stream.destroy()); stream.pipe(res);
    } catch (error) {
      if (res.headersSent) {res.destroy(); return;}
      if (error instanceof URIError) return end(400, 'Invalid URL');
      end(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 500, 'File unavailable');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = process.argv.indexOf('--port');
  const port = Number(index >= 0 ? process.argv[index + 1] : process.env.PORT || 8080);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid port');
  const host = process.env.HOST || '127.0.0.1';
  const server = createSiteServer();
  server.on('error', error => {console.error(error.message); process.exitCode = 1;});
  server.listen(port, host, () => console.log(`SoundWorld4D: http://${host}:${server.address().port}/`));
}
