import 'react-native-get-random-values';

import bcrypt from 'bcryptjs';
import { PasswordHasher } from '../../application/auth/Login';

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    if (!password) {
      throw new Error('Password is required');
    }

    const salt = await bcrypt.genSalt(12);

    return bcrypt.hash(password, salt);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false;
    }

    return bcrypt.compare(password, hash);
  }
}
