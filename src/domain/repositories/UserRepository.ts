import {User} from '../entities/User';

export interface UserRepository {
  getById(id: string): Promise<User | null>;
  getByUsername(username: string): Promise<User | null>;
  getAll(): Promise<User[]>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
}
