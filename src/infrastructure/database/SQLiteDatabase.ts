import {open} from 'react-native-nitro-sqlite';

export interface Database {
  initialize(): Promise<void>;
  execute(query: string, params?: unknown[]): Promise<void>;
  query<T>(query: string, params?: unknown[]): Promise<T[]>;
  executeBatch(
    commands: Array<{query: string; params?: unknown[]}>,
  ): Promise<void>;
}

const db = open({
  name: 'gym_manager.sqlite',
  location: 'databases',
});

export class SQLiteDatabase implements Database {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await db.executeAsync('PRAGMA foreign_keys = ON');

    await db.executeBatchAsync([
      {
        query: `
          CREATE TABLE IF NOT EXISTS gym (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            logo_uri TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            currency TEXT NOT NULL DEFAULT 'INR',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS members (
            id TEXT PRIMARY KEY,
            member_number TEXT NOT NULL UNIQUE,
            first_name TEXT NOT NULL,
            last_name TEXT,
            phone TEXT NOT NULL,
            email TEXT,
            date_of_birth TEXT,
            address TEXT,
            gender TEXT,
            photo_uri TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS membership_plans (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            duration_months INTEGER NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS memberships (
            id TEXT PRIMARY KEY,
            member_id TEXT NOT NULL,
            plan_id TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            amount REAL NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE,
            FOREIGN KEY(plan_id) REFERENCES membership_plans(id)
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            member_id TEXT NOT NULL,
            amount REAL NOT NULL,
            payment_date TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            notes TEXT,
            recorded_by TEXT NOT NULL,
            created_at TEXT NOT NULL
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS sms_templates (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            content TEXT NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS reminders (
            id TEXT PRIMARY KEY,
            member_id TEXT NOT NULL,
            type TEXT NOT NULL,
            scheduled_at TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT,
            created_at TEXT NOT NULL
          )
        `,
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_members_status ON members(status)',
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_members_name ON members(first_name, last_name)',
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_membership_member ON memberships(member_id)',
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_membership_end_date ON memberships(end_date)',
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_payments_member ON payments(member_id)',
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(scheduled_at)',
      },
    ]);

    const now = new Date().toISOString();

    await db.executeAsync(
      `INSERT OR IGNORE INTO gym
       (id, name, currency, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      ['default-gym', 'My Gym', 'INR', now, now],
    );

    await db.executeBatchAsync([
      {
        query: `
          INSERT OR IGNORE INTO membership_plans
          (id, name, duration_months, amount, description, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          'plan-1-month',
          '1 Month',
          1,
          1200,
          'Monthly membership',
          1,
          now,
          now,
        ],
      },
      {
        query: `
          INSERT OR IGNORE INTO membership_plans
          (id, name, duration_months, amount, description, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          'plan-3-months',
          '3 Months',
          3,
          3000,
          'Quarterly membership',
          1,
          now,
          now,
        ],
      },
      {
        query: `
          INSERT OR IGNORE INTO membership_plans
          (id, name, duration_months, amount, description, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          'plan-6-months',
          '6 Months',
          6,
          5500,
          'Half-year membership',
          1,
          now,
          now,
        ],
      },
      {
        query: `
          INSERT OR IGNORE INTO membership_plans
          (id, name, duration_months, amount, description, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          'plan-1-year',
          '1 Year',
          12,
          9500,
          'Annual membership',
          1,
          now,
          now,
        ],
      },
    ]);

    this.initialized = true;
  }

  async execute(
    query: string,
    params: unknown[] = [],
  ): Promise<void> {
    await db.executeAsync(query, params as any[]);
  }

  async query<T>(
    query: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    const result = await db.executeAsync(
      query,
      params as any[],
    );

    return result.rows?._array as T[];
  }

  async executeBatch(
    commands: Array<{query: string; params?: unknown[]}>,
  ): Promise<void> {
    await db.executeBatchAsync(
      commands.map(command => ({
        query: command.query,
        params: command.params as any[] | undefined,
      })),
    );
  }
}