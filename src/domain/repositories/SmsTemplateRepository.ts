import { SmsTemplate } from '../entities/SmsTemplate';

export interface SmsTemplateRepository {
  getById(id: string): Promise<SmsTemplate | null>;

  getByType(type: SmsTemplate['type']): Promise<SmsTemplate | null>;

  getAll(): Promise<SmsTemplate[]>;

  save(template: SmsTemplate): Promise<void>;

  update(template: SmsTemplate): Promise<void>;
}
