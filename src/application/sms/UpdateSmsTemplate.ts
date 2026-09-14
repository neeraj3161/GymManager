import { SmsTemplate } from '../../domain/entities/SmsTemplate';
import { SmsTemplateRepository } from '../../domain/repositories/SmsTemplateRepository';

export interface UpdateSmsTemplateInput {
  id: string;
  name: string;
  content: string;
  enabled: boolean;
}

export class UpdateSmsTemplateUseCase {
  constructor(private readonly smsTemplateRepository: SmsTemplateRepository) {}

  async execute(input: UpdateSmsTemplateInput): Promise<SmsTemplate> {
    if (!input.id) {
      throw new Error('Template ID is required');
    }

    const existingTemplate = await this.smsTemplateRepository.getById(input.id);

    if (!existingTemplate) {
      throw new Error('SMS template not found');
    }

    const name = input.name.trim();
    const content = input.content.trim();

    if (!name) {
      throw new Error('Template name is required');
    }

    if (!content) {
      throw new Error('Template message is required');
    }

    const updatedTemplate: SmsTemplate = {
      ...existingTemplate,
      name,
      content,
      enabled: input.enabled,
      updatedAt: new Date().toISOString(),
    };

    await this.smsTemplateRepository.update(updatedTemplate);

    return updatedTemplate;
  }
}
