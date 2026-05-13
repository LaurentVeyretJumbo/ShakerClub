import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT || 5173);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function resolvePath(url = '/') {
  const requested = normalize(decodeURIComponent(url.split('?')[0]));
  const safePath = requested === '/' ? '/index.html' : requested;
  const filePath = join(root, safePath);
  return filePath.startsWith(root) ? filePath : join(root, 'index.html');
}

createServer((request, response) => {
  let filePath = resolvePath(request.url);

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(root, 'index.html');
  }

  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
  });
  createReadStream(filePath).pipe(response);
}).listen(port, '0.0.0.0', () => {
  console.log(`Shake Club is available at http://localhost:${port}`);
});
