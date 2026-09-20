import { NativeModules, Platform } from 'react-native';

type AppVersion = {
  versionCode: number;
  versionName: string;
};

type AppUpdaterNative = {
  getVersion(): Promise<AppVersion>;
  downloadApk(url: string, fileName: string): Promise<string>;
  installApk(fileName: string): Promise<boolean>;
};

const { AppUpdater } = NativeModules as {
  AppUpdater?: AppUpdaterNative;
};

function getNativeUpdater(): AppUpdaterNative {
  if (Platform.OS !== 'android') {
    throw new Error('App updater is only supported on Android');
  }

  if (!AppUpdater) {
    throw new Error('AppUpdater native module is not available');
  }

  return AppUpdater;
}

export const appUpdater = {
  getVersion(): Promise<AppVersion> {
    return getNativeUpdater().getVersion();
  },

  downloadApk(url: string, fileName: string): Promise<string> {
    return getNativeUpdater().downloadApk(url, fileName);
  },

  installApk(fileName: string): Promise<boolean> {
    return getNativeUpdater().installApk(fileName);
  },
};
