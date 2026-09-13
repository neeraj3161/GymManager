import {MembershipPlan} from '../../domain/entities/MembershipPlan';
import {PlanRepository} from '../../domain/repositories/PlanRepository';

export class GetPlansUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  execute(): Promise<MembershipPlan[]> {
    return this.planRepository.getAll();
  }
}
