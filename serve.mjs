import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSiteServer as createStaticServer} from './scripts/static-server.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export function createSiteServer(options = {}) {
  return createStaticServer({root: here, ...options});
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
