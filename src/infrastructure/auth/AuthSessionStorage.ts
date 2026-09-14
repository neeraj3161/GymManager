import { User } from '../../domain/entities/User';
import { SecureStorage } from '../storage/SecureStorageAdapter';

const AUTH_SESSION_KEY = 'gym_manager_auth_session';

export class AuthSessionStorage {
  constructor(private readonly secureStorage: SecureStorage) {}

  async save(user: User): Promise<void> {
    await this.secureStorage.set(
      AUTH_SESSION_KEY,
      JSON.stringify({
        userId: user.id,
      }),
    );
  }

  async getUserId(): Promise<string | null> {
    const value = await this.secureStorage.get(AUTH_SESSION_KEY);

    if (!value) {
      return null;
    }

    try {
      const session = JSON.parse(value);

      if (!session || typeof session.userId !== 'string') {
        return null;
      }

      return session.userId;
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    await this.secureStorage.remove(AUTH_SESSION_KEY);
  }
}
