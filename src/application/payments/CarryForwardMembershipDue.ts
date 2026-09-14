import { MembershipAdjustment } from '../../domain/entities/MembershipAdjustment';
import { MembershipAdjustmentRepository } from '../../domain/repositories/MembershipAdjustmentRepository';
import { MembershipRepository } from '../../domain/repositories/MembershipRepository';
import { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import { IdGenerator } from '../shared/IdGenerator';

export interface CarryForwardMembershipDueInput {
  previousMembershipId: string;
  newMembershipId: string;
  createdBy: string;
  notes?: string;
}

export class CarryForwardMembershipDueUseCase {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly adjustmentRepository: MembershipAdjustmentRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(
    input: CarryForwardMembershipDueInput,
  ): Promise<MembershipAdjustment> {
    if (!input.previousMembershipId) {
      throw new Error('Previous membership ID is required');
    }

    if (!input.newMembershipId) {
      throw new Error('New membership ID is required');
    }

    if (!input.createdBy) {
      throw new Error('User ID is required');
    }

    if (input.previousMembershipId === input.newMembershipId) {
      throw new Error('Previous and new membership cannot be the same.');
    }

    const previousMembership = await this.membershipRepository.getById(
      input.previousMembershipId,
    );

    if (!previousMembership) {
      throw new Error('Previous membership not found');
    }

    const newMembership = await this.membershipRepository.getById(
      input.newMembershipId,
    );

    if (!newMembership) {
      throw new Error('New membership not found');
    }

    if (previousMembership.memberId !== newMembership.memberId) {
      throw new Error('Memberships belong to different members.');
    }

    const totalPaid = await this.paymentRepository.getTotalPaidByMembership(
      previousMembership.id,
    );

    const totalAdjustments =
      await this.adjustmentRepository.getTotalByMembershipId(
        previousMembership.id,
      );

    const balance = Math.max(
      previousMembership.amount +
        previousMembership.adjustmentAmount +
        totalAdjustments -
        totalPaid,
      0,
    );

    if (balance <= 0) {
      throw new Error('The previous membership has no outstanding due.');
    }

    const now = new Date().toISOString();

    // Remove the outstanding balance from the OLD membership.
    const transferOut: MembershipAdjustment = {
      id: this.idGenerator.generate(),
      membershipId: previousMembership.id,
      memberId: previousMembership.memberId,
      type: 'carry_forward_out',
      amount: -balance,
      reason: 'Outstanding due carried forward to new membership',
      notes: input.notes?.trim() || undefined,
      createdBy: input.createdBy,
      createdAt: now,
    };

    await this.adjustmentRepository.create(transferOut);

    // Add the same balance to the NEW membership.
    const transferIn: MembershipAdjustment = {
      id: this.idGenerator.generate(),
      membershipId: newMembership.id,
      memberId: newMembership.memberId,
      type: 'carry_forward_in',
      amount: balance,
      reason: 'Outstanding due carried forward from previous membership',
      notes: input.notes?.trim() || undefined,
      createdBy: input.createdBy,
      createdAt: now,
    };

    await this.adjustmentRepository.create(transferIn);

    return transferIn;
  }
}
