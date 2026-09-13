import {Payment} from '../entities/Payment';

export interface PaymentRepository {
  getByMemberId(memberId: string): Promise<Payment[]>;
  save(payment: Payment): Promise<void>;
}
