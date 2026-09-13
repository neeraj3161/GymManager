export interface NotificationService {
  schedule(
    title: string,
    body: string,
    date: Date,
  ): Promise<void>;

  cancel(id: string): Promise<void>;
}
