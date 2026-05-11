// Servidor HTTP estático mínimo pra validar arquivos via fetch sem abrir browser.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 8765);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.sf2':  'application/octet-stream',
  '.sf3':  'application/octet-stream',
  '.gp':   'application/octet-stream',
  '.gp3':  'application/octet-stream',
  '.gp4':  'application/octet-stream',
  '.gp5':  'application/octet-stream',
  '.gpx':  'application/octet-stream',
  '.cpro': 'text/plain; charset=utf-8',
  '.alphatex': 'text/plain; charset=utf-8',
  '.gp':   'application/octet-stream',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.mp3':  'audio/mpeg',
  '.mp4':  'video/mp4',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = path.join(ROOT, urlPath.replace(/^\/+/, ''));
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    fs.stat(filePath, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404); res.end('not found: ' + urlPath); return; }
      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (e) {
    res.writeHead(500); res.end('err: ' + e.message);
  }
});
server.listen(PORT, '127.0.0.1', () => {
  console.log(`[dev] http://127.0.0.1:${PORT}/`);
});
