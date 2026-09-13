import {
  BackupFile,
  BackupService,
} from '../../application/backup/BackupService';

export class SQLiteBackupService
  implements BackupService
{
  async createBackup(): Promise<BackupFile> {
    throw new Error(
      'SQLite backup has not been configured yet.',
    );
  }

  async restoreBackup(
    _path: string,
  ): Promise<void> {
    throw new Error(
      'SQLite restore has not been configured yet.',
    );
  }
}
