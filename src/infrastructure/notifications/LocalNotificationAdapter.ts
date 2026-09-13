import {NotificationService} from '../../application/reminders/NotificationService';

export class LocalNotificationAdapter
  implements NotificationService
{
  async schedule(
    title: string,
    body: string,
    date: Date,
  ): Promise<void> {
    console.log(
      'Notification placeholder:',
      title,
      body,
      date.toISOString(),
    );
  }

  async cancel(id: string): Promise<void> {
    console.log(
      'Cancel notification placeholder:',
      id,
    );
  }
}
