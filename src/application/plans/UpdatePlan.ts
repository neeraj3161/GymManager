import { MembershipPlan } from '../../domain/entities/MembershipPlan';
import { PlanRepository } from '../../domain/repositories/PlanRepository';

export interface UpdatePlanInput {
  id: string;
  name: string;
  durationMonths: number;
  amount: number;
  description?: string;
}

export class UpdatePlanUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(input: UpdatePlanInput): Promise<MembershipPlan> {
    if (!input.id) {
      throw new Error('Plan ID is required');
    }

    const existingPlan = await this.planRepository.getById(input.id);

    if (!existingPlan) {
      throw new Error('Membership plan not found');
    }

    const name = input.name.trim();

    if (!name) {
      throw new Error('Plan name is required');
    }

    if (!Number.isInteger(input.durationMonths) || input.durationMonths <= 0) {
      throw new Error('Duration must be a positive number of months');
    }

    if (!Number.isFinite(input.amount) || input.amount < 0) {
      throw new Error('Invalid plan amount');
    }

    const updatedPlan: MembershipPlan = {
      ...existingPlan,
      name,
      durationMonths: input.durationMonths,
      amount: input.amount,
      description: input.description?.trim(),
      updatedAt: new Date().toISOString(),
    };

    await this.planRepository.update(updatedPlan);

    return updatedPlan;
  }
}
