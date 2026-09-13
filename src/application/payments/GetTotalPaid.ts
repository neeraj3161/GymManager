import {PaymentRepository} from '../../domain/repositories/PaymentRepository';

export class GetTotalPaidUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(memberId: string): Promise<number> {
    if (!memberId) {
      throw new Error('Member ID is required');
    }

    return this.paymentRepository.getTotalPaidByMember(memberId);
  }
}