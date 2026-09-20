import { appUpdater } from '../appUpdater';

export type UpdateManifest = {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  fileName: string;
  mandatory?: boolean;
  releaseNotes?: string;
};

export type AppUpdateInfo = {
  currentVersionCode: number;
  currentVersionName: string;
  update: UpdateManifest;
};

const UPDATE_MANIFEST_URL = 'http://192.168.1.27:8080/update.json';

const REQUEST_TIMEOUT_MS = 10_000;

function isValidManifest(value: unknown): value is UpdateManifest {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const manifest = value as Partial<UpdateManifest>;

  return (
    typeof manifest.versionCode === 'number' &&
    Number.isInteger(manifest.versionCode) &&
    manifest.versionCode > 0 &&
    typeof manifest.versionName === 'string' &&
    manifest.versionName.length > 0 &&
    typeof manifest.apkUrl === 'string' &&
    manifest.apkUrl.length > 0 &&
    typeof manifest.fileName === 'string' &&
    manifest.fileName.length > 0 &&
    (manifest.mandatory === undefined ||
      typeof manifest.mandatory === 'boolean') &&
    (manifest.releaseNotes === undefined ||
      typeof manifest.releaseNotes === 'string')
  );
}

async function fetchManifest(): Promise<UpdateManifest> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(UPDATE_MANIFEST_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Update server returned HTTP ${response.status}`);
    }

    const data: unknown = await response.json();

    if (!isValidManifest(data)) {
      throw new Error('Update manifest has an invalid format.');
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export const appUpdateService = {
  async check(): Promise<AppUpdateInfo | null> {
    const current = await appUpdater.getVersion();

    const manifest = await fetchManifest();

    if (manifest.versionCode <= current.versionCode) {
      return null;
    }

    return {
      currentVersionCode: current.versionCode,
      currentVersionName: current.versionName,
      update: manifest,
    };
  },

  async downloadAndInstall(update: UpdateManifest): Promise<void> {
    const fileName = await appUpdater.downloadApk(
      update.apkUrl,
      update.fileName,
    );

    await appUpdater.installApk(fileName);
  },
};
