import { Payment } from '../../../domain/entities/Payment';
import { PaymentRepository } from '../../../domain/repositories/PaymentRepository';
import { SQLiteDatabase } from '../SQLiteDatabase';

interface PaymentRow {
  id: string;
  member_id: string;
  membership_id: string;
  amount: number;
  payment_date: string;
  payment_method: Payment['paymentMethod'];
  notes: string | null;
  recorded_by: string;
  created_at: string;
}

export class SQLitePaymentRepository implements PaymentRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async create(payment: Payment): Promise<void> {
    await this.db.execute(
      `
      INSERT INTO payments (
        id,
        member_id,
        membership_id,
        amount,
        payment_date,
        payment_method,
        notes,
        recorded_by,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        payment.id,
        payment.memberId,
        payment.membershipId,
        payment.amount,
        payment.paymentDate,
        payment.paymentMethod,
        payment.notes ?? null,
        payment.recordedBy,
        payment.createdAt,
      ],
    );
  }

  async getByMemberId(memberId: string): Promise<Payment[]> {
    const rows = await this.db.query<PaymentRow>(
      `
      SELECT
        id,
        member_id,
        membership_id,
        amount,
        payment_date,
        payment_method,
        notes,
        recorded_by,
        created_at
      FROM payments
      WHERE member_id = ?
      ORDER BY payment_date DESC
      `,
      [memberId],
    );

    return rows.map(row => this.toDomain(row));
  }

  async getTotalPaidByMember(memberId: string): Promise<number> {
    const rows = await this.db.query<{ total: number | null }>(
      `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM payments
      WHERE member_id = ?
      `,
      [memberId],
    );

    return rows[0]?.total ?? 0;
  }

  async getTotalPaidByMembership(membershipId: string): Promise<number> {
    const rows = await this.db.query<{ total: number | null }>(
      `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM payments
      WHERE membership_id = ?
      `,
      [membershipId],
    );

    return rows[0]?.total ?? 0;
  }

  private toDomain(row: PaymentRow): Payment {
    return {
      id: row.id,
      memberId: row.member_id,
      membershipId: row.membership_id,
      amount: row.amount,
      paymentDate: row.payment_date,
      paymentMethod: row.payment_method,
      notes: row.notes ?? undefined,
      recordedBy: row.recorded_by,
      createdAt: row.created_at,
    };
  }
}
