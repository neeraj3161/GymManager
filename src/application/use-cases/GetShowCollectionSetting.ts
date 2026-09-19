import { SQLiteAppSettingsRepository } from '../../infrastructure/database/repositories/SQLiteAppSettingsRepository';

const SETTING_KEY = 'show_collections_on_dashboard';

export class GetShowCollectionsSettingUseCase {
  constructor(private readonly settings: SQLiteAppSettingsRepository) {}

  execute(): Promise<boolean> {
    return this.settings.getBoolean(SETTING_KEY, false);
  }
}
