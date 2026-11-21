import http from 'node:http';
import { createReadStream, existsSync, statSync, watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PROTOTYPE_PORT || 5173);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs':'text/javascript', '.png': 'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.svg': 'image/svg+xml', '.wav':'audio/wav', '.pdf':'application/pdf', '.ttf': 'font/ttf', '.txt': 'text/plain' };
const clients = new Set();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/__dev/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': connected\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400).end(); return; }
  const filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!filename.startsWith(root) || !existsSync(filename) || !statSync(filename).isFile()) { res.writeHead(404).end('Not found'); return; }
  const size=statSync(filename).size;
  const headers={ 'Content-Type': `${types[path.extname(filename)] || 'application/octet-stream'}${/\.(html|css|js|mjs|txt)$/.test(filename) ? '; charset=utf-8' : ''}`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges':'bytes', 'Content-Length':size };
  let start=0,end=size-1,status=200;
  if(req.headers.range) {
    const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if(!range || (!range[1]&&!range[2])){res.writeHead(416,{'Content-Range':`bytes */${size}`}).end();return;}
    if(!range[1])start=Math.max(0,size-Number(range[2]));
    else {start=Number(range[1]);if(range[2])end=Math.min(end,Number(range[2]));}
    if(start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`}).end();return;}
    status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;headers['Content-Length']=end-start+1;
  }
  res.writeHead(status,headers);
  if (req.method === 'HEAD') res.end(); else createReadStream(filename,{start,end}).pipe(res);
});

let reloadTimer;
const watcher = watch(root, { recursive: true }, (_, filename) => {
  if (!filename || !/^(src\/|styles\/|index\.html)/.test(filename)) return;
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => { for (const client of clients) client.write('data: reload\n\n'); }, 100);
});
watcher.on('error', () => console.warn('Live reload unavailable. Reload the browser after changes.'));
server.listen(port, '127.0.0.1', () => console.log(`HoLink prototype ready\nLocal: http://localhost:${port}`));
server.on('error', error => { console.error(error.message); watcher.close(); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { watcher.close(); for (const client of clients) client.end(); server.close(() => process.exit(0)); });
