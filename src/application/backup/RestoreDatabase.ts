import { BackupService, RestoreMode } from './BackupService';

export class RestoreDatabaseUseCase {
  constructor(private readonly backupService: BackupService) {}

  async execute(path: string): Promise<RestoreMode> {
    if (!path.trim()) {
      throw new Error('Backup file is required');
    }

    return this.backupService.restoreBackup(path);
  }
}
