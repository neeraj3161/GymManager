export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank' | 'other';

export interface Payment {
  id: string;
  memberId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}