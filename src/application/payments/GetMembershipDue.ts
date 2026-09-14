import { MembershipRepository } from '../../domain/repositories/MembershipRepository';
import { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import { MembershipAdjustmentRepository } from '../../domain/repositories/MembershipAdjustmentRepository';

export interface MembershipDue {
  membershipAmount: number;
  adjustmentAmount: number;
  totalPaid: number;
  remainingAmount: number;
}

export class GetMembershipDueUseCase {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly adjustmentRepository: MembershipAdjustmentRepository,
  ) {}

  async execute(membershipId: string): Promise<MembershipDue> {
    if (!membershipId) {
      throw new Error('Membership ID is required');
    }

    const membership = await this.membershipRepository.getById(membershipId);

    if (!membership) {
      throw new Error('Membership not found');
    }

    const totalPaid = await this.paymentRepository.getTotalPaidByMembership(
      membership.id,
    );

    const additionalAdjustments =
      await this.adjustmentRepository.getTotalByMembershipId(membership.id);

    const adjustmentAmount =
      membership.adjustmentAmount + additionalAdjustments;

    const effectiveAmount = Math.max(membership.amount + adjustmentAmount, 0);

    const remainingAmount = Math.max(effectiveAmount - totalPaid, 0);

    return {
      membershipAmount: membership.amount,
      adjustmentAmount,
      totalPaid,
      remainingAmount,
    };
  }
}
