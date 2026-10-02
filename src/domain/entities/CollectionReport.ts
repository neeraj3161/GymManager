import type { MembershipAdjustmentType } from './MembershipAdjustment';

export interface CollectionReportRow {
  paymentId: string;
  transactionType:
    | 'payment'
    | 'unused_membership_credit'
    | MembershipAdjustmentType;
  paymentDate: string;
  memberId: string;
  memberNumber: string;
  memberName: string;
  membershipId: string;
  amount: number;
  paymentMethod: string;
  recordedBy: string;
  notes: string | null;
}

export interface CollectionReport {
  fromDate: string;
  toDate: string;
  totalAmount: number;
  paymentCount: number;
  payments: CollectionReportRow[];
  transactions: CollectionReportRow[];
}
