const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const port = Number(process.env.PORT || 8080);
const root = __dirname;
const manifestPath = path.join(root, 'update.json');
const apkRoot = path.join(root, 'apk');

function sendJson(response, statusCode, value) {
  const body = JSON.stringify(value, null, 2);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(body);
}

function serveManifest(request, response) {
  fs.readFile(manifestPath, 'utf8', (error, content) => {
    if (error) {
      sendJson(response, 500, { error: 'Update manifest is unavailable.' });
      return;
    }

    let manifest;

    try {
      manifest = JSON.parse(content);
    } catch {
      sendJson(response, 500, { error: 'Update manifest is invalid.' });
      return;
    }

    const forwardedProtocol = request.headers['x-forwarded-proto'];
    const protocol =
      process.env.PUBLIC_BASE_URL?.replace(/\/$/, '') ||
      `${forwardedProtocol || 'http'}://${request.headers.host}`;

    manifest.apkUrl = `${protocol}/apk/${encodeURIComponent(
      manifest.fileName,
    )}`;

    response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    response.end(JSON.stringify(manifest, null, 2));
  });
}

function serveApk(request, response, fileName) {
  if (!/^[a-zA-Z0-9._-]+\.apk$/.test(fileName)) {
    sendJson(response, 400, { error: 'Invalid APK file name.' });
    return;
  }

  const filePath = path.join(apkRoot, fileName);
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      sendJson(response, 404, { error: 'APK not found.' });
      return;
    }

    response.writeHead(200, {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Length': stats.size,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-cache',
    });

    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    fs.createReadStream(filePath).pipe(response);
  });
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendJson(response, 405, { error: 'Method not allowed.' });
    return;
  }

  if (url.pathname === '/health') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (url.pathname === '/update.json') {
    serveManifest(request, response);
    return;
  }

  if (url.pathname.startsWith('/apk/')) {
    serveApk(request, response, decodeURIComponent(url.pathname.slice(5)));
    return;
  }

  sendJson(response, 404, { error: 'Not found.' });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`GymManager update server listening on port ${port}`);
});
