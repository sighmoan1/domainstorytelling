const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=UTF-8',
  '.md': 'text/markdown; charset=UTF-8'
};

function getFilePath(urlPath) {
  let relativePath = urlPath.split('?')[0].split('#')[0];
  if (relativePath === '/' || relativePath === '') {
    relativePath = '/index.html';
  }
  return path.join(PUBLIC_DIR, relativePath);
}

function sendError(res, statusCode, message) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=UTF-8' });
  res.end(message);
}

const server = http.createServer((req, res) => {
  const filePath = getFilePath(req.url);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If the requested file is not found, fall back to index.html for SPA-style routing
      const fallbackPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(fallbackPath, (fallbackErr, data) => {
        if (fallbackErr) {
          return sendError(res, 404, '404 Not Found');
        }
        res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] });
        res.end(data);
      });
      return;
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        return sendError(res, 500, '500 Internal Server Error');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Domain Storytelling running at http://localhost:${PORT}`);
});




