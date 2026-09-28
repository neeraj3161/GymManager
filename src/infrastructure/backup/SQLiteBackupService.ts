import RNFS from 'react-native-fs';
import {
  BackupFile,
  BackupService,
  RestoreMode,
} from '../../application/backup/BackupService';
import { SQLiteDatabase } from '../database/SQLiteDatabase';

type SchemaRow = {
  type: 'table' | 'index' | 'trigger' | 'view';
  name: string;
  sql: string | null;
};

type ColumnRow = { name: string };
type SqlValueRow = { value: string | null };
type ForeignKeyViolationRow = {
  table: string;
  rowid: number | null;
  parent: string;
  fkid: number;
};

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

  async restoreBackup(path: string): Promise<RestoreMode> {
    const filePath = path.replace(/^file:\/\//, '');
    const content = await RNFS.readFile(filePath, 'utf8');
    const rawStatements = splitSqlStatements(
      content.replace(/^\s*--.*$/gm, ''),
    );
    const normalizedStatements = rawStatements.map(statement =>
      statement.replace(/\s+/g, ' ').trim().toUpperCase(),
    );
    const hasTransactionStart = normalizedStatements.some(
      statement => statement === 'BEGIN' || statement === 'BEGIN TRANSACTION',
    );
    const hasTransactionEnd = normalizedStatements.some(
      statement => statement === 'COMMIT' || statement === 'END',
    );
    const commands = rawStatements.filter((_, index) => {
      const normalized = normalizedStatements[index];
      return (
        normalized !== 'BEGIN TRANSACTION' &&
        normalized !== 'BEGIN' &&
        normalized !== 'COMMIT' &&
        normalized !== 'END' &&
        !/^PRAGMA\s+FOREIGN_KEYS\s*=/.test(normalized)
      );
    });
    const isFullBackup =
      /PRAGMA\s+foreign_keys\s*=/i.test(content) &&
      hasTransactionStart &&
      hasTransactionEnd;
    const isMembersOnlyImport =
      hasTransactionStart &&
      hasTransactionEnd &&
      commands.length === 1 &&
      /^\s*INSERT\s+OR\s+IGNORE\s+INTO\s+members\s*\(/i.test(commands[0]);

    if (!isFullBackup && !isMembersOnlyImport) {
      throw new Error(
        'Unsupported SQL file. Select a GymManager full backup or a members-only SQL import.',
      );
    }

    if (isMembersOnlyImport) {
      await this.database.ensureMemberPhoneNormalizedColumn();
    }

    const statements = commands.map(query => ({ query }));
    await this.database.execute('PRAGMA foreign_keys = OFF');

    try {
      await this.database.executeBatch(statements);

      const violations = await this.database.query<ForeignKeyViolationRow>(
        'PRAGMA foreign_key_check',
      );

      if (violations.length > 0) {
        const firstViolation = violations[0];
        throw new Error(
          `Backup contains ${violations.length} foreign-key violation(s); ` +
            `table "${firstViolation.table}" references "${firstViolation.parent}".`,
        );
      }
    } finally {
      await this.database.execute('PRAGMA foreign_keys = ON');
    }

    return isMembersOnlyImport ? 'members' : 'full';
  }
}
