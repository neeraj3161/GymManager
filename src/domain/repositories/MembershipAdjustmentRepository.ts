import { MembershipAdjustment } from '../entities/MembershipAdjustment';

export interface MembershipAdjustmentRepository {
  create(adjustment: MembershipAdjustment): Promise<void>;

  getByMembershipId(membershipId: string): Promise<MembershipAdjustment[]>;

  getTotalByMembershipId(membershipId: string): Promise<number>;
}
