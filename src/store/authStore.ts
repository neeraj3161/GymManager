import { create } from 'zustand';

import { User } from '../domain/entities/User';
import { AuthSessionStorage } from '../infrastructure/auth/AuthSessionStorage';
import { SecureStorageAdapter } from '../infrastructure/storage/SecureStorageAdapter';

interface AuthState {
  user: User | null;
  hydrated: boolean;

  login(user: User): Promise<void>;
  logout(): Promise<void>;
  hydrate(user: User | null): void;
  getPersistedUserId(): Promise<string | null>;
}

const secureStorage = new SecureStorageAdapter();
const sessionStorage = new AuthSessionStorage(secureStorage);

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  hydrated: false,

  login: async user => {
    await sessionStorage.save(user);
    set({
      user,
      hydrated: true,
    });
  },

  logout: async () => {
    await sessionStorage.clear();
    set({
      user: null,
      hydrated: true,
    });
  },

  hydrate: user => {
    set({
      user,
      hydrated: true,
    });
  },

  getPersistedUserId: async () => {
    return sessionStorage.getUserId();
  },
}));
