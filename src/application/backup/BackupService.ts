export interface BackupFile {
  path: string;
  createdAt: string;
  size: number;
}

export interface BackupService {
  createBackup(): Promise<BackupFile>;
  restoreBackup(path: string): Promise<void>;
}
