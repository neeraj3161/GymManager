import {
  SmsMessage,
  SmsResult,
  SmsService,
} from '../../application/reminders/SmsService';

export class AndroidSmsAdapter implements SmsService {
  async send(
    message: SmsMessage,
  ): Promise<SmsResult> {
    console.log(
      'SMS adapter placeholder:',
      message.phoneNumber,
      message.message,
    );

    return {
      success: false,
      error: 'Native Android SMS adapter not configured.',
    };
  }
}
