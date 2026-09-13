export type SmsTemplateType =
  | 'birthday'
  | 'fee_reminder'
  | 'membership_expiry'
  | 'payment_confirmation';

export interface SmsTemplate {
  id: string;
  type: SmsTemplateType;
  name: string;
  content: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
