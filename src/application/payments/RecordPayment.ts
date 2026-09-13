import {
  Payment,
  PaymentMethod,
} from '../../domain/entities/Payment';

import {PaymentRepository} from '../../domain/repositories/PaymentRepository';
import {IdGenerator} from '../shared/IdGenerator';

export interface RecordPaymentInput {
  memberId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  recordedBy: string;
  notes?: string;
}

export class RecordPaymentUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(
    input: RecordPaymentInput,
  ): Promise<Payment> {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new Error(
        'Payment amount must be greater than zero',
      );
    }

    const now = new Date().toISOString();

    const payment: Payment = {
      id: this.idGenerator.generate(),
      memberId: input.memberId,
      amount: input.amount,
      paymentDate: now,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      recordedBy: input.recordedBy,
      createdAt: now,
    };

    await this.paymentRepository.save(payment);

    return payment;
  }
}
