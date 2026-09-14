import { User } from '../../../domain/entities/User';
import { UserRepository } from '../../../domain/repositories/UserRepository';
import { SQLiteDatabase } from '../SQLiteDatabase';

interface UserRow {
  id: string;
  name: string;
  username: string;
  password_hash: string;
  role: User['role'];
  active: number;
  created_at: string;
  updated_at: string;
}

export class SQLiteUserRepository implements UserRepository {
  constructor(private readonly database: SQLiteDatabase) {}

  async getById(id: string): Promise<User | null> {
    const rows = await this.database.query<UserRow>(
      `
        SELECT
          id,
          name,
          username,
          password_hash,
          role,
          active,
          created_at,
          updated_at
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
      [id],
    );

    return rows.length > 0 ? this.toDomain(rows[0]) : null;
  }

  async getByUsername(username: string): Promise<User | null> {
    const rows = await this.database.query<UserRow>(
      `
        SELECT
          id,
          name,
          username,
          password_hash,
          role,
          active,
          created_at,
          updated_at
        FROM users
        WHERE username = ?
        LIMIT 1
        `,
      [username],
    );

    return rows.length > 0 ? this.toDomain(rows[0]) : null;
  }

  async getAll(): Promise<User[]> {
    const rows = await this.database.query<UserRow>(
      `
        SELECT
          id,
          name,
          username,
          password_hash,
          role,
          active,
          created_at,
          updated_at
        FROM users
        ORDER BY name ASC
        `,
    );

    return rows.map(row => this.toDomain(row));
  }

  async save(user: User): Promise<void> {
    await this.database.execute(
      `
      INSERT INTO users (
        id,
        name,
        username,
        password_hash,
        role,
        active,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        user.id,
        user.name,
        user.username,
        user.passwordHash,
        user.role,
        user.active ? 1 : 0,
        user.createdAt,
        user.updatedAt,
      ],
    );
  }

  async update(user: User): Promise<void> {
    await this.database.execute(
      `
      UPDATE users
      SET
        name = ?,
        username = ?,
        password_hash = ?,
        role = ?,
        active = ?,
        updated_at = ?
      WHERE id = ?
      `,
      [
        user.name,
        user.username,
        user.passwordHash,
        user.role,
        user.active ? 1 : 0,
        user.updatedAt,
        user.id,
      ],
    );
  }

  private toDomain(row: UserRow): User {
    return {
      id: row.id,
      name: row.name,
      username: row.username,
      passwordHash: row.password_hash,
      role: row.role,
      active: row.active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
