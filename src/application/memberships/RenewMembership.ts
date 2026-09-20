import { Membership } from '../../domain/entities/Membership';
import { MembershipRepository } from '../../domain/repositories/MembershipRepository';
import { MembershipPlan } from '../../domain/entities/MembershipPlan';
import { PlanRepository } from '../../domain/repositories/PlanRepository';
import { IdGenerator } from '../shared/IdGenerator';

export interface RenewMembershipInput {
  memberId: string;
  planId: string;
  startDate?: string;
}

export class RenewMembershipUseCase {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly planRepository: PlanRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: RenewMembershipInput): Promise<Membership> {
    if (!input.memberId) {
      throw new Error('Member ID is required');
    }

    if (!input.planId) {
      throw new Error('Plan ID is required');
    }

    const plan: MembershipPlan | null = await this.planRepository.getById(
      input.planId,
    );

    if (!plan) {
      throw new Error('Membership plan not found');
    }

    const today = new Date();

    const startDate = input.startDate ? new Date(input.startDate) : today;

    if (Number.isNaN(startDate.getTime())) {
      throw new Error('Invalid membership start date');
    }

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);
    endDate.setDate(endDate.getDate() - 1);

    const now = new Date().toISOString();

    const membership: Membership = {
      id: this.idGenerator.generate(),
      memberId: input.memberId,
      planId: plan.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      amount: plan.amount,

      adjustmentAmount: 0,

      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await this.membershipRepository.save(membership);

    return membership;
  }
}
