import { SmsTemplate } from '../../domain/entities/SmsTemplate';
import { SmsTemplateRepository } from '../../domain/repositories/SmsTemplateRepository';

export class GetSmsTemplatesUseCase {
  constructor(private readonly smsTemplateRepository: SmsTemplateRepository) {}

  async execute(): Promise<SmsTemplate[]> {
    return this.smsTemplateRepository.getAll();
  }
}
