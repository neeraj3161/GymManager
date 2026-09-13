import {MembershipPlan} from '../entities/MembershipPlan';

export interface PlanRepository {
  getById(id: string): Promise<MembershipPlan | null>;
  getAll(): Promise<MembershipPlan[]>;
  save(plan: MembershipPlan): Promise<void>;
  update(plan: MembershipPlan): Promise<void>;
}
