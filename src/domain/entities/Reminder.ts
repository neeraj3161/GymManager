export type ReminderType =
  | 'birthday'
  | 'fee_due'
  | 'membership_expiry';

export type ReminderStatus =
  | 'pending'
  | 'sent'
  | 'failed';

export interface Reminder {
  id: string;
  memberId: string;
  type: ReminderType;
  scheduledAt: string;
  status: ReminderStatus;
  createdAt: string;
}
