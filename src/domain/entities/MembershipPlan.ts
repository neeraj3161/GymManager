export interface MembershipPlan {
  id: string;
  name: string;
  durationMonths: number;
  amount: number;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
