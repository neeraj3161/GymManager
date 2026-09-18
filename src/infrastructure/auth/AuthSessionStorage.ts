import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';

import { User } from '../../domain/entities/User';

const KEYCHAIN_SERVICE = 'gym-manager-auth';
const KEYCHAIN_ACCOUNT = 'session';

interface AuthState {
  user: User | null;

  login: (user: User) => Promise<void>;

  logout: () => Promise<void>;

  hydrate: (user: User | null) => void;

  getPersistedUserId: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,

  login: async user => {
    await Keychain.setGenericPassword(KEYCHAIN_ACCOUNT, user.id, {
      service: KEYCHAIN_SERVICE,
    });

    set({
      user,
    });
  },

  logout: async () => {
    try {
      await Keychain.resetGenericPassword({
        service: KEYCHAIN_SERVICE,
      });
    } finally {
      set({
        user: null,
      });
    }
  },

  hydrate: user => {
    set({
      user,
    });
  },

  getPersistedUserId: async () => {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICE,
      });

      if (!credentials) {
        return null;
      }

      return credentials.password;
    } catch (error) {
      console.error('Failed to read persisted authentication:', error);

      return null;
    }
  },
}));
