import {BackupService} from './BackupService';

export class RestoreDatabaseUseCase {
  constructor(
    private readonly backupService: BackupService,
  ) {}

  async execute(path: string): Promise<void> {
    if (!path.trim()) {
      throw new Error('Backup file is required');
    }

    await this.backupService.restoreBackup(path);
  }
}
