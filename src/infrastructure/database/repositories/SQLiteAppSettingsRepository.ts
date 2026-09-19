import { Database } from '../SQLiteDatabase';

export class SQLiteAppSettingsRepository {
  constructor(private readonly database: Database) {}

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
