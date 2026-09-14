import { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import { MembershipRepository } from '../../domain/repositories/MembershipRepository';

export type FeeStatus = 'PAID' | 'PARTIAL' | 'DUE' | 'OVERDUE';

export interface MemberFeeStatus {
  membershipAmount: number;
  totalPaid: number;
  remainingAmount: number;
  status: FeeStatus;
}

export class GetMemberFeeStatusUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly membershipRepository: MembershipRepository,
  ) {}

  async execute(memberId: string): Promise<MemberFeeStatus | null> {
    if (!memberId) {
      throw new Error('Member ID is required');
    }

    const membership = await this.membershipRepository.getByMemberId(memberId);

    if (!membership) {
      return null;
    }

    const totalPaid = await this.paymentRepository.getTotalPaidByMembership(
      membership.id,
    );

    const remainingAmount = Math.max(membership.amount - totalPaid, 0);

    const expiryDate = new Date(membership.endDate);
    const today = new Date();

    let status: FeeStatus;

    if (remainingAmount === 0) {
      status = 'PAID';
    } else if (expiryDate < today) {
      status = 'OVERDUE';
    } else if (totalPaid > 0) {
      status = 'PARTIAL';
    } else {
      status = 'DUE';
    }

    return {
      membershipAmount: membership.amount,
      totalPaid,
      remainingAmount,
      status,
    };
  }
}
