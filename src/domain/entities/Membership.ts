export type MembershipStatus =
  | 'active'
  | 'expiring'
  | 'expired';

export interface Membership {
  id: string;
  memberId: string;
  planId: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
}
