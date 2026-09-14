import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

export interface LoginInput {
  username: string;
  password: string;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: LoginInput): Promise<User> {
    const username = input.username.trim();

    if (!username) {
      throw new Error('Username is required');
    }

    if (!input.password) {
      throw new Error('Password is required');
    }

    const user = await this.userRepository.getByUsername(username);

    if (!user) {
      throw new Error('Invalid username or password');
    }

    if (!user.active) {
      throw new Error('This user account has been disabled.');
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new Error('Invalid username or password');
    }

    return user;
  }
}
