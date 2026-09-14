import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { IdGenerator } from '../shared/IdGenerator';
import { PasswordHasher } from './Login';

export interface CreateOwnerInput {
  name: string;
  username: string;
  password: string;
}

export class CreateOwnerUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: CreateOwnerInput): Promise<User> {
    const name = input.name.trim();
    const username = input.username.trim();

    if (!name) {
      throw new Error('Name is required');
    }

    if (!username) {
      throw new Error('Username is required');
    }

    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    if (!input.password) {
      throw new Error('Password is required');
    }

    if (input.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const existingUsers = await this.userRepository.getAll();

    if (existingUsers.length > 0) {
      throw new Error('An owner account has already been created.');
    }

    const existingUsername = await this.userRepository.getByUsername(username);

    if (existingUsername) {
      throw new Error('That username is already in use.');
    }

    const now = new Date().toISOString();

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user: User = {
      id: this.idGenerator.generate(),
      name,
      username,
      passwordHash,
      role: 'owner',
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.userRepository.save(user);

    return user;
  }
}
