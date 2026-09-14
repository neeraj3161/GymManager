import { SmsTemplate } from '../../../domain/entities/SmsTemplate';
import { SmsTemplateRepository } from '../../../domain/repositories/SmsTemplateRepository';
import { SQLiteDatabase } from '../SQLiteDatabase';

interface SmsTemplateRow {
  id: string;
  type: SmsTemplate['type'];
  name: string;
  content: string;
  enabled: number;
  created_at: string;
  updated_at: string;
}

export class SQLiteSmsTemplateRepository implements SmsTemplateRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async getById(id: string): Promise<SmsTemplate | null> {
    const rows = await this.db.query<SmsTemplateRow>(
      `
      SELECT
        id,
        type,
        name,
        content,
        enabled,
        created_at,
        updated_at
      FROM sms_templates
      WHERE id = ?
      LIMIT 1
      `,
      [id],
    );

    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async getByType(type: SmsTemplate['type']): Promise<SmsTemplate | null> {
    const rows = await this.db.query<SmsTemplateRow>(
      `
      SELECT
        id,
        type,
        name,
        content,
        enabled,
        created_at,
        updated_at
      FROM sms_templates
      WHERE type = ?
        AND enabled = 1
      ORDER BY created_at ASC
      LIMIT 1
      `,
      [type],
    );

    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async getAll(): Promise<SmsTemplate[]> {
    const rows = await this.db.query<SmsTemplateRow>(
      `
      SELECT
        id,
        type,
        name,
        content,
        enabled,
        created_at,
        updated_at
      FROM sms_templates
      ORDER BY type ASC, name ASC
      `,
    );

    return rows.map(row => this.toDomain(row));
  }

  async save(template: SmsTemplate): Promise<void> {
    await this.db.execute(
      `
      INSERT INTO sms_templates (
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
      [
        template.id,
        template.type,
        template.name,
        template.content,
        template.enabled ? 1 : 0,
        template.createdAt,
        template.updatedAt,
      ],
    );
  }

  async update(template: SmsTemplate): Promise<void> {
    await this.db.execute(
      `
      UPDATE sms_templates
      SET
        type = ?,
        name = ?,
        content = ?,
        enabled = ?,
        updated_at = ?
      WHERE id = ?
      `,
      [
        template.type,
        template.name,
        template.content,
        template.enabled ? 1 : 0,
        template.updatedAt,
        template.id,
      ],
    );
  }

  private toDomain(row: SmsTemplateRow): SmsTemplate {
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      content: row.content,
      enabled: row.enabled === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
