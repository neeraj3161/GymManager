import {MembershipPlan} from '../../domain/entities/MembershipPlan';
import {PlanRepository} from '../../domain/repositories/PlanRepository';
import {IdGenerator} from '../shared/IdGenerator';

export interface CreatePlanInput {
  name: string;
  durationMonths: number;
  amount: number;
  description?: string;
}

export class CreatePlanUseCase {
  constructor(
    private readonly planRepository: PlanRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(
    input: CreatePlanInput,
  ): Promise<MembershipPlan> {
    const name = input.name.trim();

    if (!name) {
      throw new Error('Plan name is required');
    }

    if (
      !Number.isInteger(input.durationMonths) ||
      input.durationMonths <= 0
    ) {
      throw new Error(
        'Duration must be a positive number of months',
      );
    }

    if (!Number.isFinite(input.amount) || input.amount < 0) {
      throw new Error('Invalid plan amount');
    }

    const now = new Date().toISOString();

    const plan: MembershipPlan = {
      id: this.idGenerator.generate(),
      name,
      durationMonths: input.durationMonths,
      amount: input.amount,
      description: input.description?.trim(),
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.planRepository.save(plan);

    return plan;
  }
}
