import {Membership} from '../../domain/entities/Membership';
import {MembershipRepository} from '../../domain/repositories/MembershipRepository';
import {PlanRepository} from '../../domain/repositories/PlanRepository';
import {IdGenerator} from '../shared/IdGenerator';

export interface CreateMembershipInput {
  memberId: string;
  planId: string;
  startDate?: string;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const originalDay = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(originalDay, lastDay));
  return result;
}

export class CreateMembershipUseCase {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly planRepository: PlanRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: CreateMembershipInput): Promise<Membership> {
    const plan = await this.planRepository.getById(input.planId);

    if (!plan || !plan.active) {
      throw new Error('Membership plan not found or inactive');
    }

    const start = input.startDate
      ? new Date(input.startDate)
      : new Date();

    const end = addMonths(start, plan.durationMonths);
    end.setDate(end.getDate() - 1);

    const now = new Date().toISOString();

    const membership: Membership = {
      id: this.idGenerator.generate(),
      memberId: input.memberId,
      planId: plan.id,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      amount: plan.amount,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await this.membershipRepository.save(membership);
    return membership;
  }
}
