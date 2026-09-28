import { Database } from '../SQLiteDatabase';

export class SQLiteAppSettingsRepository {
  constructor(private readonly database: Database) {}

  async getString(key: string, defaultValue = ''): Promise<string> {
    const rows = await this.database.query<{ value: string | null }>(
      'SELECT value FROM app_settings WHERE key = ? LIMIT 1',
      [key],
    );

    return rows[0]?.value ?? defaultValue;
  }

  async setString(key: string, value: string): Promise<void> {
    await this.database.execute(
      `
        INSERT INTO app_settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key)
        DO UPDATE SET value = excluded.value
      `,
      [key, value],
    );
  }

  async getBoolean(key: string, defaultValue = false): Promise<boolean> {
    const rows = await this.database.query<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ? LIMIT 1',
      [key],
    );

    if (rows.length === 0) {
      return defaultValue;
    }

    return rows[0].value === 'true';
  }

  async setBoolean(key: string, value: boolean): Promise<void> {
    await this.database.execute(
      `
        INSERT INTO app_settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key)
        DO UPDATE SET value = excluded.value
      `,
      [key, value ? 'true' : 'false'],
    );
  }
}
