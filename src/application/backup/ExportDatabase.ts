import {
  BackupFile,
  BackupService,
} from './BackupService';

export class ExportDatabaseUseCase {
  constructor(
    private readonly backupService: BackupService,
  ) {}

  async execute(): Promise<BackupFile> {
    return this.backupService.createBackup();
  }
}
