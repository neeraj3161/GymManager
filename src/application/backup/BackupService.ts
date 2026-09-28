export interface BackupFile {
  path: string;
  createdAt: string;
  size: number;
}

export type RestoreMode = 'full' | 'members';

export interface BackupService {
  createBackup(): Promise<BackupFile>;
  restoreBackup(path: string): Promise<RestoreMode>;
}
