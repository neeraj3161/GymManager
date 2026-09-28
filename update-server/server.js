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

function getPublicBaseUrl(request) {
  if (process.env.PUBLIC_BASE_URL) {
    return process.env.PUBLIC_BASE_URL.replace(/\/+$/, '');
  }

  const forwardedProto = request.headers['x-forwarded-proto'];
  const protocol = forwardedProto || 'http';

  return `${protocol}://${request.headers.host}`;
}

function serveManifest(request, response) {
  fs.readFile(manifestPath, 'utf8', (error, content) => {
    if (error) {
      sendJson(response, 500, {
        error: 'Update manifest is unavailable.',
      });
      return;
    }

    let manifest;

    try {
      manifest = JSON.parse(content);
    } catch {
      sendJson(response, 500, {
        error: 'Update manifest is invalid.',
      });
      return;
    }

    manifest.apkUrl =
      `${getPublicBaseUrl(request)}/apk/` +
      encodeURIComponent(manifest.fileName);

    response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });

    response.end(JSON.stringify(manifest, null, 2));
  });
}

function serveApk(request, response, fileName) {
  // Only allow simple .apk filenames.
  if (!/^[a-zA-Z0-9._-]+\.apk$/.test(fileName)) {
    sendJson(response, 400, {
      error: 'Invalid APK file name.',
    });
    return;
  }

  const filePath = path.join(apkRoot, fileName);

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      sendJson(response, 404, {
        error: 'APK not found.',
      });
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
  let url;

  try {
    url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  } catch {
    sendJson(response, 400, {
      error: 'Invalid request URL.',
    });
    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendJson(response, 405, {
      error: 'Method not allowed.',
    });
    return;
  }

  if (url.pathname === '/health') {
    sendJson(response, 200, {
      ok: true,
    });
    return;
  }

  if (url.pathname === '/update.json') {
    serveManifest(request, response);
    return;
  }

  if (url.pathname.startsWith('/apk/')) {
    const encodedFileName = url.pathname.slice('/apk/'.length);

    let fileName;

    try {
      fileName = decodeURIComponent(encodedFileName);
    } catch {
      sendJson(response, 400, {
        error: 'Invalid APK file name.',
      });
      return;
    }

    serveApk(request, response, fileName);
    return;
  }

  sendJson(response, 404, {
    error: 'Not found.',
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`GymManager update server listening on port ${port}`);
});
