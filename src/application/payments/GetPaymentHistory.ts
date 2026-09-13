import {Payment} from '../../domain/entities/Payment';
import {PaymentRepository} from '../../domain/repositories/PaymentRepository';

export class GetPaymentHistoryUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(memberId: string): Promise<Payment[]> {
    if (!memberId) {
      throw new Error('Member ID is required');
    }

    return this.paymentRepository.getByMemberId(memberId);
  }
}