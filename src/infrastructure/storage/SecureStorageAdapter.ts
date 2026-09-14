import * as Keychain from 'react-native-keychain';

export interface SecureStorage {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | null>;
  remove(key: string): Promise<void>;
}

export class SecureStorageAdapter implements SecureStorage {
  async set(key: string, value: string): Promise<void> {
    await Keychain.setGenericPassword(key, value, {
      service: key,
    });
  }

  async get(key: string): Promise<string | null> {
    const credentials = await Keychain.getGenericPassword({
      service: key,
    });

    if (!credentials) {
      return null;
    }

    return credentials.password;
  }

  async remove(key: string): Promise<void> {
    await Keychain.resetGenericPassword({
      service: key,
    });
  }
}
