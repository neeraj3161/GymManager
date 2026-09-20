# GymManager APK update server

This server uses only Node.js built-ins. It serves:

- `/update.json`
- `/apk/<file-name>.apk`
- `/health`

## Local Android emulator

Build the APK and copy it into the APK directory:

```sh
mkdir -p update-server/apk
cp android/app/build/outputs/apk/release/app-release.apk update-server/apk/gymmanager-1.0.1.apk
node update-server/server.js
```

The server builds `apkUrl` from the request host. The Android emulator can reach
the host machine at `10.0.2.2`; a physical phone must use your computer's LAN
address, such as `http://192.168.1.27:8080`.

## Hosting

Host this directory on a Node.js service and set `PORT` if required:

```sh
PORT=8080 node server.js
```

Set `PUBLIC_BASE_URL` when the server is behind a proxy or has a public URL:

```sh
PUBLIC_BASE_URL=https://updates.example.com/gymmanager node server.js
```

Replace the production URL in `src/services/appUpdateService.ts` with the
public `/update.json` URL. The APK must be signed with the same signing key as the
installed app; the current Gradle release signing uses the debug key only for
local testing.

When releasing another APK, increase `versionCode`, update `versionName`, copy
the APK to `update-server/apk`, and update `update.json`.
