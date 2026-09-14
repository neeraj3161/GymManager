import { Payment } from '../entities/Payment';

export interface PaymentRepository {
  create(payment: Payment): Promise<void>;

  getByMemberId(memberId: string): Promise<Payment[]>;

  getTotalPaidByMember(memberId: string): Promise<number>;

  getTotalPaidByMembership(membershipId: string): Promise<number>;
}
