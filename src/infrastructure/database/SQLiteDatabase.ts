import { open } from 'react-native-nitro-sqlite';

export interface Database {
  initialize(): Promise<void>;
  execute(query: string, params?: unknown[]): Promise<void>;
  query<T>(query: string, params?: unknown[]): Promise<T[]>;
  executeBatch(
    commands: Array<{ query: string; params?: unknown[] }>,
  ): Promise<void>;
}

const db = open({
  name: 'gym_manager.sqlite',
  location: 'databases',
});

export class SQLiteDatabase implements Database {
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeDatabase();

    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async initializeDatabase(): Promise<void> {
    await db.executeAsync('PRAGMA foreign_keys = ON');

    /*
     * IMPORTANT:
     * Tables are created before any seed data is inserted.
     *
     * members
     *    ↓
     * membership_plans
     *    ↓
     * memberships
     *    ↓
     * payments
     */

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
            adjustment_amount REAL NOT NULL DEFAULT 0,
            adjustment_type TEXT,
            adjustment_notes TEXT,
            previous_membership_id TEXT,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,

            FOREIGN KEY(member_id)
              REFERENCES members(id)
              ON DELETE CASCADE,

            FOREIGN KEY(plan_id)
              REFERENCES membership_plans(id),

            FOREIGN KEY(previous_membership_id)
              REFERENCES memberships(id)
          )
        `,
      },

      {
        query: `
          CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            member_id TEXT NOT NULL,
            membership_id TEXT NOT NULL,
            amount REAL NOT NULL,
            payment_date TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            notes TEXT,
            recorded_by TEXT NOT NULL,
            created_at TEXT NOT NULL,

            FOREIGN KEY(member_id)
              REFERENCES members(id)
              ON DELETE CASCADE,

            FOREIGN KEY(membership_id)
              REFERENCES memberships(id)
              ON DELETE CASCADE
          )
        `,
      },

      {
        query: `
          CREATE TABLE IF NOT EXISTS membership_adjustments (
            id TEXT PRIMARY KEY,
            membership_id TEXT NOT NULL,
            member_id TEXT NOT NULL,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            reason TEXT,
            notes TEXT,
            created_by TEXT NOT NULL,
            created_at TEXT NOT NULL,

            FOREIGN KEY(membership_id)
              REFERENCES memberships(id)
              ON DELETE CASCADE,

            FOREIGN KEY(member_id)
              REFERENCES members(id)
              ON DELETE CASCADE
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

            FOREIGN KEY(member_id)
              REFERENCES members(id)
              ON DELETE CASCADE
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
          'CREATE INDEX IF NOT EXISTS idx_payments_membership ON payments(membership_id)',
      },

      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(scheduled_at)',
      },

      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_adjustments_membership ON membership_adjustments(membership_id)',
      },
    ]);

    const now = new Date().toISOString();

    /*
     * Default gym
     */

    await db.executeAsync(
      `
        INSERT OR IGNORE INTO gym
        (
          id,
          name,
          currency,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      ['default-gym', 'My Gym', 'INR', now, now],
    );

    /*
     * Default membership plans
     */

    await db.executeBatchAsync([
      {
        query: `
          INSERT OR IGNORE INTO membership_plans
          (
            id,
            name,
            duration_months,
            amount,
            description,
            active,
            created_at,
            updated_at
          )
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
          (
            id,
            name,
            duration_months,
            amount,
            description,
            active,
            created_at,
            updated_at
          )
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
          (
            id,
            name,
            duration_months,
            amount,
            description,
            active,
            created_at,
            updated_at
          )
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
          (
            id,
            name,
            duration_months,
            amount,
            description,
            active,
            created_at,
            updated_at
          )
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

    /*
     * Default SMS templates
     *
     * INSERT OR IGNORE means existing user-edited
     * templates will NOT be overwritten.
     */

    await db.executeBatchAsync([
      {
        query: `
          INSERT OR IGNORE INTO sms_templates
          (
            id,
            type,
            name,
            content,
            enabled,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          'sms-birthday-default',
          'birthday',
          'Birthday Wish',
          'Happy Birthday {{member_name}}! {{gym_name}} wishes you a very Happy Birthday. We wish you good health, happiness and success. Thank you for being a valued member of {{gym_name}}.',
          1,
          now,
          now,
        ],
      },

      {
        query: `
          INSERT OR IGNORE INTO sms_templates
          (
            id,
            type,
            name,
            content,
            enabled,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          'sms-fee-due-default',
          'fee_due',
          'Fee Due Reminder',
          'Hi {{member_name}}, your membership fee of {{amount}} is due at {{gym_name}}. Please contact us for payment. Thank you.',
          1,
          now,
          now,
        ],
      },

      {
        query: `
          INSERT OR IGNORE INTO sms_templates
          (
            id,
            type,
            name,
            content,
            enabled,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          'sms-fee-overdue-default',
          'fee_overdue',
          'Overdue Fee Reminder',
          'Hi {{member_name}}, your membership fee of {{amount}} is overdue at {{gym_name}}. Please clear your outstanding balance at your earliest convenience. Thank you.',
          1,
          now,
          now,
        ],
      },

      {
        query: `
          INSERT OR IGNORE INTO sms_templates
          (
            id,
            type,
            name,
            content,
            enabled,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          'sms-membership-expiring-default',
          'membership_expiring',
          'Membership Expiry Reminder',
          'Hi {{member_name}}, your membership at {{gym_name}} expires on {{expiry_date}}. Please renew your membership to continue your fitness journey.',
          1,
          now,
          now,
        ],
      },
    ]);

    this.initialized = true;
  }

  async execute(query: string, params: unknown[] = []): Promise<void> {
    await this.initialize();

    await db.executeAsync(query, params as any[]);
  }

  async query<T>(query: string, params: unknown[] = []): Promise<T[]> {
    await this.initialize();

    const result = await db.executeAsync(query, params as any[]);

    return result.rows?._array as T[];
  }

  async executeBatch(
    commands: Array<{
      query: string;
      params?: unknown[];
    }>,
  ): Promise<void> {
    await this.initialize();

    await db.executeBatchAsync(
      commands.map(command => ({
        query: command.query,
        params: command.params as any[] | undefined,
      })),
    );

    const memberColumns = await db.executeAsync(`PRAGMA table_info(members)`);

    const columns = memberColumns.rows._array as Array<{
      name: string;
    }>;

    const hasPhoneNormalized = columns.some(
      column => column.name === 'phone_normalized',
    );

    if (!hasPhoneNormalized) {
      await db.executeAsync(
        `ALTER TABLE members ADD COLUMN phone_normalized TEXT`,
      );

      await db.executeAsync(`
    UPDATE members
    SET phone_normalized =
      CASE
        WHEN length(replace(replace(replace(replace(replace(phone, ' ', ''), '+', ''), '-', ''), '(', ''), ')', '')) = 10
          THEN replace(replace(replace(replace(replace(phone, ' ', ''), '+', ''), '-', ''), '(', ''), ')', '')
        WHEN length(replace(replace(replace(replace(replace(phone, ' ', ''), '+', ''), '-', ''), '(', ''), ')', '')) = 11
             AND substr(replace(replace(replace(replace(replace(phone, ' ', ''), '+', ''), '-', ''), '(', ''), ')', ''), 1, 1) = '0'
          THEN substr(replace(replace(replace(replace(replace(phone, ' ', ''), '+', ''), '-', ''), '(', ''), ')', ''), 2)
        WHEN length(replace(replace(replace(replace(replace(phone, ' ', ''), '+', ''), '-', ''), '(', ''), ')', '')) = 12
             AND substr(replace(replace(replace(replace(replace(phone, ' ', ''), '+', ''), '-', ''), '(', ''), ')', ''), 1, 2) = '91'
          THEN substr(replace(replace(replace(replace(replace(phone, ' ', ''), '+', ''), '-', ''), '(', ''), ')', ''), 3)
        ELSE replace(replace(replace(replace(replace(phone, ' ', ''), '+', ''), '-', ''), '(', ''), ')', '')
      END
  `);

      await db.executeAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_members_phone_normalized
    ON members(phone_normalized)
  `);
    }
  }
}
