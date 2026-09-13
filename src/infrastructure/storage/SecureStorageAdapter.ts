export interface SecureStorage {
  set(
    key: string,
    value: string,
  ): Promise<void>;

  get(
    key: string,
  ): Promise<string | null>;

  remove(
    key: string,
  ): Promise<void>;
}

export class SecureStorageAdapter
  implements SecureStorage
{
  async set(
    _key: string,
    _value: string,
  ): Promise<void> {
    throw new Error(
      'Secure storage has not been configured yet.',
    );
  }

  async get(
    _key: string,
  ): Promise<string | null> {
    throw new Error(
      'Secure storage has not been configured yet.',
    );
  }

  async remove(
    _key: string,
  ): Promise<void> {
    throw new Error(
      'Secure storage has not been configured yet.',
    );
  }
}
