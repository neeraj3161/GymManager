import { Payment } from '../../../domain/entities/Payment';
import { PaymentRepository } from '../../../domain/repositories/PaymentRepository';
import { SQLiteDatabase } from '../SQLiteDatabase';
import { CollectionReport } from '../../../domain/entities/CollectionReport';

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

  async getCollectionReport(
    fromDate: string,
    toDate: string,
  ): Promise<CollectionReport> {
    const rows = await this.db.query<{
      payment_id: string;
      payment_date: string;
      member_id: string;
      member_number: string;
      member_name: string;
      membership_id: string;
      amount: number;
      payment_method: string;
      recorded_by: string;
      notes: string | null;
    }>(
      `
      SELECT
        p.id AS payment_id,
        p.payment_date,
        p.member_id,
        m.member_number,
        TRIM(
          m.first_name || ' ' || COALESCE(m.last_name, '')
        ) AS member_name,
        p.membership_id,
        p.amount,
        p.payment_method,
        p.recorded_by,
        p.notes
      FROM payments p
      INNER JOIN members m ON m.id = p.member_id
      WHERE p.payment_date >= ?
        AND p.payment_date < ?
      ORDER BY p.payment_date DESC, p.created_at DESC
    `,
      [fromDate, toDate],
    );

    const payments = rows.map(row => ({
      paymentId: row.payment_id,
      paymentDate: row.payment_date,
      memberId: row.member_id,
      memberNumber: row.member_number,
      memberName: row.member_name,
      membershipId: row.membership_id,
      amount: Number(row.amount),
      paymentMethod: row.payment_method,
      recordedBy: row.recorded_by,
      notes: row.notes,
    }));

    return {
      fromDate,
      toDate,
      totalAmount: payments.reduce(
        (total, payment) => total + payment.amount,
        0,
      ),
      paymentCount: payments.length,
      payments,
    };
  }
}
