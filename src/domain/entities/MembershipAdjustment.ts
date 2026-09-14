export type MembershipAdjustmentType =
  | 'write_off'
  | 'carry_forward_in'
  | 'carry_forward_out'
  | 'discount'
  | 'other';

export interface MembershipAdjustment {
  id: string;
  membershipId: string;
  memberId: string;

  type: MembershipAdjustmentType;

  /**
   * Signed amount.
   *
   * Negative = reduces the balance
   * Positive = increases the balance
   *
   * Examples:
   * write_off      = -1000
   * carry_forward  = +1000
   * discount       = -500
   */
  amount: number;

  reason?: string;
  notes?: string;

  createdBy: string;
  createdAt: string;
}
