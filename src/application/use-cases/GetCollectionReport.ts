import { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import { CollectionReport } from '../../domain/entities/CollectionReport';

export class GetCollectionReportUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(fromDate: string, toDate: string): Promise<CollectionReport> {
    if (!fromDate || !toDate || fromDate >= toDate) {
      throw new Error('Invalid collection report date range.');
    }

    return this.paymentRepository.getCollectionReport(fromDate, toDate);
  }
}
