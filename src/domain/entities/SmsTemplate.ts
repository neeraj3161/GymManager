export type SmsTemplateType =
  | 'birthday'
  | 'fee_due'
  | 'fee_overdue'
  | 'membership_expiring';

export interface SmsTemplate {
  id: string;
  type: SmsTemplateType;
  name: string;
  content: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
