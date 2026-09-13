import {Membership} from '../../domain/entities/Membership';
import {MembershipRepository} from '../../domain/repositories/MembershipRepository';
import {MembershipPlan} from '../../domain/entities/MembershipPlan';
import {PlanRepository} from '../../domain/repositories/PlanRepository';
import {IdGenerator} from '../shared/IdGenerator';

export interface RenewMembershipInput {
  memberId: string;
  planId: string;
}

export class RenewMembershipUseCase {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly planRepository: PlanRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(
    input: RenewMembershipInput,
  ): Promise<Membership> {
    if (!input.memberId) {
      throw new Error('Member ID is required');
    }

    if (!input.planId) {
      throw new Error('Plan ID is required');
    }

    const plan: MembershipPlan | null =
      await this.planRepository.getById(input.planId);

    if (!plan) {
      throw new Error('Membership plan not found');
    }

    const existingMembership =
      await this.membershipRepository.getByMemberId(input.memberId);

    const today = new Date();

    let startDate = today;

    // If the current membership is still active,
    // start the renewal on the day after it expires.
    if (
      existingMembership &&
      new Date(existingMembership.endDate) >= today
    ) {
      startDate = new Date(existingMembership.endDate);
      startDate.setDate(startDate.getDate() + 1);
    }

    const endDate = new Date(startDate);
    endDate.setMonth(
      endDate.getMonth() + plan.durationMonths,
    );
    endDate.setDate(endDate.getDate() - 1);

    const now = new Date().toISOString();

    const membership: Membership = {
      id: this.idGenerator.generate(),
      memberId: input.memberId,
      planId: plan.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      amount: plan.amount,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await this.membershipRepository.save(membership);

    return membership;
  }
}