import { Gym } from '../../../domain/entities/Gym';
import { GymRepository } from '../../../domain/repositories/GymRepository';
import { SQLiteDatabase } from '../SQLiteDatabase';

interface GymRow {
  id: string;
  name: string;
  logo_uri: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export class SQLiteGymRepository implements GymRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async get(): Promise<Gym | null> {
    const rows = await this.db.query<GymRow>(
      `
      SELECT
        id,
        name,
        logo_uri,
        phone,
        email,
        address,
        currency,
        created_at,
        updated_at
      FROM gym
      LIMIT 1
      `,
    );

    if (!rows[0]) {
      return null;
    }

    return this.toDomain(rows[0]);
  }

  async save(gym: Gym): Promise<void> {
    await this.db.execute(
      `
      INSERT INTO gym (
        id,
        name,
        logo_uri,
        phone,
        email,
        address,
        currency,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        gym.id,
        gym.name,
        gym.logoUri ?? null,
        gym.phone ?? null,
        gym.email ?? null,
        gym.address ?? null,
        gym.currency,
        gym.createdAt,
        gym.updatedAt,
      ],
    );
  }

  async update(gym: Gym): Promise<void> {
    await this.db.execute(
      `
      UPDATE gym
      SET
        name = ?,
        logo_uri = ?,
        phone = ?,
        email = ?,
        address = ?,
        currency = ?,
        updated_at = ?
      WHERE id = ?
      `,
      [
        gym.name,
        gym.logoUri ?? null,
        gym.phone ?? null,
        gym.email ?? null,
        gym.address ?? null,
        gym.currency,
        gym.updatedAt,
        gym.id,
      ],
    );
  }

  private toDomain(row: GymRow): Gym {
    return {
      id: row.id,
      name: row.name,
      logoUri: row.logo_uri ?? undefined,
      phone: row.phone ?? undefined,
      email: row.email ?? undefined,
      address: row.address ?? undefined,
      currency: row.currency,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
