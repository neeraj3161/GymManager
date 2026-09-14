import { MembershipAdjustment } from '../../domain/entities/MembershipAdjustment';
import { MembershipAdjustmentRepository } from '../../domain/repositories/MembershipAdjustmentRepository';
import { MembershipRepository } from '../../domain/repositories/MembershipRepository';
import { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import { IdGenerator } from '../shared/IdGenerator';

export interface WriteOffMembershipDueInput {
  membershipId: string;
  createdBy: string;
  reason: string;
  notes?: string;
}

export class WriteOffMembershipDueUseCase {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly adjustmentRepository: MembershipAdjustmentRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(
    input: WriteOffMembershipDueInput,
  ): Promise<MembershipAdjustment> {
    if (!input.membershipId) {
      throw new Error('Membership ID is required');
    }

    if (!input.createdBy) {
      throw new Error('User ID is required');
    }

    const reason = input.reason.trim();

    if (!reason) {
      throw new Error('Write-off reason is required');
    }

    const membership = await this.membershipRepository.getById(
      input.membershipId,
    );

    if (!membership) {
      throw new Error('Membership not found');
    }

    const totalPaid = await this.paymentRepository.getTotalPaidByMembership(
      membership.id,
    );

    const totalAdjustments =
      await this.adjustmentRepository.getTotalByMembershipId(membership.id);

    const balance = Math.max(
      membership.amount +
        membership.adjustmentAmount +
        totalAdjustments -
        totalPaid,
      0,
    );

    if (balance <= 0) {
      throw new Error('This membership has no outstanding due.');
    }

    const now = new Date().toISOString();

    const adjustment: MembershipAdjustment = {
      id: this.idGenerator.generate(),
      membershipId: membership.id,
      memberId: membership.memberId,
      type: 'write_off',
      amount: -balance,
      reason,
      notes: input.notes?.trim() || undefined,
      createdBy: input.createdBy,
      createdAt: now,
    };

    await this.adjustmentRepository.create(adjustment);

    return adjustment;
  }
}
