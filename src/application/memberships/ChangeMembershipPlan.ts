import { Membership } from '../../domain/entities/Membership';
import { MembershipRepository } from '../../domain/repositories/MembershipRepository';
import { PlanRepository } from '../../domain/repositories/PlanRepository';
import { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import { MembershipAdjustmentRepository } from '../../domain/repositories/MembershipAdjustmentRepository';
import {
  calculateMembershipEndDate,
  formatDateOnly,
  parseDateOnly,
} from '../../shared/utils/date';
import { IdGenerator } from '../shared/IdGenerator';

export interface ChangeMembershipPlanInput {
  memberId: string;
  newPlanId: string;
  amount?: number;
  applyUnusedCredit: boolean;
  previousMembershipFullyPaid?: boolean;
  startDate?: string;
}

export interface MembershipPlanChangeResult {
  membership: Membership;
  unusedDays: number;
  unusedCredit: number;
  finalAmount: number;
}

export class ChangeMembershipPlanUseCase {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly planRepository: PlanRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly adjustmentRepository: MembershipAdjustmentRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(
    input: ChangeMembershipPlanInput,
  ): Promise<MembershipPlanChangeResult> {
    if (!input.memberId) {
      throw new Error('Member ID is required');
    }

    if (!input.newPlanId) {
      throw new Error('New plan is required');
    }

    if (
      input.amount !== undefined &&
      (!Number.isFinite(input.amount) || input.amount < 0)
    ) {
      throw new Error('Membership amount must be zero or greater');
    }

    const currentMembership = await this.membershipRepository.getByMemberId(
      input.memberId,
    );

    if (!currentMembership) {
      throw new Error('Current membership not found');
    }

    const newPlan = await this.planRepository.getById(input.newPlanId);

    if (!newPlan) {
      throw new Error('New membership plan not found');
    }

    const today = new Date();

    let unusedDays = 0;
    let unusedCredit = 0;

    const totalPaid = await this.paymentRepository.getTotalPaidByMembership(
      currentMembership.id,
    );
    const totalAdjustments =
      await this.adjustmentRepository.getTotalByMembershipId(
        currentMembership.id,
      );
    const effectiveAmount = Math.max(
      currentMembership.amount +
        currentMembership.adjustmentAmount +
        totalAdjustments,
      0,
    );
    const previousMembershipFullyPaid =
      input.previousMembershipFullyPaid ??
      (totalPaid >= effectiveAmount &&
        totalAdjustments >= currentMembership.adjustmentAmount);

    if (
      input.applyUnusedCredit &&
      previousMembershipFullyPaid &&
      (parseDateOnly(currentMembership.endDate) ??
        new Date(currentMembership.endDate)) > today
    ) {
      const startDate =
        parseDateOnly(currentMembership.startDate) ??
        new Date(currentMembership.startDate);

      const endDate =
        parseDateOnly(currentMembership.endDate) ??
        new Date(currentMembership.endDate);

      const totalDays = Math.max(
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1,
        1,
      );

      unusedDays = Math.max(
        Math.ceil(
          (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        ),
        0,
      );

      const dailyRate = currentMembership.amount / totalDays;

      unusedCredit = Math.min(
        currentMembership.amount,
        Math.round(dailyRate * unusedDays),
      );
    }

    const adjustmentAmount = -unusedCredit;

    const planAmount = input.amount ?? newPlan.amount;
    const finalAmount = Math.max(planAmount + adjustmentAmount, 0);

    const now = new Date().toISOString();
    const startDate = input.startDate
      ? parseDateOnly(input.startDate) ?? new Date(input.startDate)
      : today;

    if (Number.isNaN(startDate.getTime())) {
      throw new Error('Invalid membership start date');
    }

    const updatedOldMembership: Membership = {
      ...currentMembership,
      status: 'expired',
      updatedAt: now,
    };

    await this.membershipRepository.update(updatedOldMembership);

    const newMembership: Membership = {
      id: this.idGenerator.generate(),
      memberId: input.memberId,
      planId: newPlan.id,
      startDate: formatDateOnly(startDate),
      endDate: formatDateOnly(
        calculateMembershipEndDate(startDate, newPlan.durationMonths),
      ),
      amount: planAmount,
      adjustmentAmount,
      adjustmentType: unusedCredit > 0 ? 'unused_membership_credit' : undefined,
      adjustmentNotes:
        unusedCredit > 0
          ? `Credit for ${unusedDays} unused day(s) from previous membership`
          : undefined,
      previousMembershipId: currentMembership.id,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await this.membershipRepository.save(newMembership);

    return {
      membership: newMembership,
      unusedDays,
      unusedCredit,
      finalAmount,
    };
  }
}
