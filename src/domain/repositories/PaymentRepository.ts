import { Payment } from '../entities/Payment';
import { CollectionReport } from '../entities/CollectionReport';

export interface PaymentRepository {
  create(payment: Payment): Promise<void>;

  getByMemberId(memberId: string): Promise<Payment[]>;

  getTotalPaidByMember(memberId: string): Promise<number>;

  getTotalPaidByMembership(membershipId: string): Promise<number>;

  getCollectionReport(
    fromDate: string,
    toDate: string,
  ): Promise<CollectionReport>;
}
