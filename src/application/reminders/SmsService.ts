export interface SmsMessage {
  phoneNumber: string;
  message: string;
}

export interface SmsResult {
  success: boolean;
  error?: string;
}

export interface SmsService {
  send(message: SmsMessage): Promise<SmsResult>;
}
