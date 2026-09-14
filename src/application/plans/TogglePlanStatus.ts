import { MembershipPlan } from '../../domain/entities/MembershipPlan';
import { PlanRepository } from '../../domain/repositories/PlanRepository';

export class TogglePlanStatusUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(id: string): Promise<MembershipPlan> {
    if (!id) {
      throw new Error('Plan ID is required');
    }

    const existingPlan = await this.planRepository.getById(id);

    if (!existingPlan) {
      throw new Error('Membership plan not found');
    }

    const updatedPlan: MembershipPlan = {
      ...existingPlan,
      active: !existingPlan.active,
      updatedAt: new Date().toISOString(),
    };

    await this.planRepository.update(updatedPlan);

    return updatedPlan;
  }
}
