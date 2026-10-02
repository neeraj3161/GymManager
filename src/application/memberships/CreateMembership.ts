import { Membership } from '../../domain/entities/Membership';
import { MembershipRepository } from '../../domain/repositories/MembershipRepository';
import { PlanRepository } from '../../domain/repositories/PlanRepository';
import {
  calculateMembershipEndDate,
  formatDateOnly,
  parseDateOnly,
} from '../../shared/utils/date';
import { IdGenerator } from '../shared/IdGenerator';

export interface CreateMembershipInput {
  memberId: string;
  planId: string;
  startDate?: string;
  amount?: number;
}

export class CreateMembershipUseCase {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly planRepository: PlanRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: CreateMembershipInput): Promise<Membership> {
    if (
      input.amount !== undefined &&
      (!Number.isFinite(input.amount) || input.amount < 0)
    ) {
      throw new Error('Membership amount must be zero or greater');
    }

    const plan = await this.planRepository.getById(input.planId);

    if (!plan || !plan.active) {
      throw new Error('Membership plan not found or inactive');
    }

    const start = input.startDate
      ? parseDateOnly(input.startDate) ?? new Date(input.startDate)
      : new Date();

    if (Number.isNaN(start.getTime())) {
      throw new Error('Invalid membership start date');
    }

    const end = calculateMembershipEndDate(start, plan.durationMonths);

    const now = new Date().toISOString();

    const membership: Membership = {
      id: this.idGenerator.generate(),
      memberId: input.memberId,
      planId: plan.id,
      startDate: formatDateOnly(start),
      endDate: formatDateOnly(end),
      amount: input.amount ?? plan.amount,

      adjustmentAmount: 0,

      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await this.membershipRepository.save(membership);
    return membership;
  }
}
