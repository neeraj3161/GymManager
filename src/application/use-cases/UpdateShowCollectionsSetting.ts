import { SQLiteAppSettingsRepository } from '../../infrastructure/database/repositories/SQLiteAppSettingsRepository';

const SETTING_KEY = 'show_collections_on_dashboard';

export class UpdateShowCollectionsSettingUseCase {
  constructor(private readonly settings: SQLiteAppSettingsRepository) {}

  execute(enabled: boolean): Promise<void> {
    return this.settings.setBoolean(SETTING_KEY, enabled);
  }
}
