import RNFS from 'react-native-fs';
import {
  BackupFile,
  BackupService,
} from '../../application/backup/BackupService';
import { SQLiteDatabase } from '../database/SQLiteDatabase';

type SchemaRow = {
  type: 'table' | 'index' | 'trigger' | 'view';
  name: string;
  sql: string | null;
};

type ColumnRow = { name: string };
type SqlValueRow = { value: string | null };

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let start = 0;
  let inString = false;

  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index];

    if (character === "'") {
      if (inString && sql[index + 1] === "'") {
        index += 1;
      } else {
        inString = !inString;
      }
    } else if (character === ';' && !inString) {
      const statement = sql.slice(start, index).trim();
      if (statement) statements.push(statement);
      start = index + 1;
    }
  }

  const lastStatement = sql.slice(start).trim();
  if (lastStatement) statements.push(lastStatement);

  return statements.filter(statement => !statement.startsWith('--'));
}

export class SQLiteBackupService implements BackupService {
  constructor(private readonly database: SQLiteDatabase) {}

  async createBackup(): Promise<BackupFile> {
    const schema = await this.database.query<SchemaRow>(
      `
        SELECT type, name, sql
        FROM sqlite_master
        WHERE sql IS NOT NULL
          AND name NOT LIKE 'sqlite_%'
          AND type IN ('table', 'index', 'trigger', 'view')
        ORDER BY CASE type
          WHEN 'table' THEN 1
          WHEN 'view' THEN 2
          WHEN 'index' THEN 3
          ELSE 4
        END, name
      `,
    );

    const tables = schema.filter(row => row.type === 'table');
    const lines = [
      '-- GymManager SQLite backup',
      `-- Created at ${new Date().toISOString()}`,
      'PRAGMA foreign_keys = OFF;',
      'BEGIN TRANSACTION;',
    ];

    for (const table of [...tables].reverse()) {
      lines.push(`DROP TABLE IF EXISTS ${quoteIdentifier(table.name)};`);
    }

    for (const table of tables) {
      lines.push(`${table.sql};`);
    }

    for (const table of tables) {
      const columns = await this.database.query<ColumnRow>(
        `PRAGMA table_info(${quoteIdentifier(table.name)})`,
      );

      if (columns.length === 0) continue;

      const columnList = columns
        .map(column => quoteIdentifier(column.name))
        .join(', ');
      const valueExpressions = columns
        .map(
          column => `COALESCE(quote(${quoteIdentifier(column.name)}), 'NULL')`,
        )
        .join(" || ',' || ");
      const rows = await this.database.query<SqlValueRow>(
        `SELECT ${valueExpressions} AS value FROM ${quoteIdentifier(
          table.name,
        )}`,
      );

      for (const row of rows) {
        lines.push(
          `INSERT INTO ${quoteIdentifier(table.name)} (${columnList}) VALUES (${
            row.value
          });`,
        );
      }
    }

    for (const object of schema.filter(row => row.type !== 'table')) {
      lines.push(`${object.sql};`);
    }

    lines.push('COMMIT;', 'PRAGMA foreign_keys = ON;', '');

    const fileName = `gymmanager-backup-${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')}.sql`;
    const path = `${RNFS.CachesDirectoryPath}/${fileName}`;
    const content = lines.join('\n');

    await RNFS.writeFile(path, content, 'utf8');

    return { path, createdAt: new Date().toISOString(), size: content.length };
  }

  async restoreBackup(path: string): Promise<void> {
    const filePath = path.replace(/^file:\/\//, '');
    const content = await RNFS.readFile(filePath, 'utf8');
    const statements = splitSqlStatements(
      content.replace(/^\s*--.*$/gm, ''),
    ).filter(statement => {
      const normalized = statement.replace(/\s+/g, ' ').trim().toUpperCase();
      return (
        normalized !== 'BEGIN TRANSACTION' &&
        normalized !== 'BEGIN' &&
        normalized !== 'COMMIT' &&
        normalized !== 'END'
      );
    });

    if (
      !content.includes('PRAGMA foreign_keys') ||
      !content.includes('BEGIN TRANSACTION') ||
      !content.includes('COMMIT')
    ) {
      throw new Error('Invalid GymManager SQL backup file.');
    }

    await this.database.executeBatch(statements.map(query => ({ query })));
  }
}
