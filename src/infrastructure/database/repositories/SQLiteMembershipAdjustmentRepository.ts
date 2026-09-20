import { MembershipAdjustment } from '../../../domain/entities/MembershipAdjustment';
import { MembershipAdjustmentRepository } from '../../../domain/repositories/MembershipAdjustmentRepository';
import { Database } from '../SQLiteDatabase';

interface MembershipAdjustmentRow {
  id: string;
  membership_id: string;
  member_id: string;
  type: MembershipAdjustment['type'];
  amount: number;
  reason: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export class SQLiteMembershipAdjustmentRepository
  implements MembershipAdjustmentRepository
{
  constructor(private readonly database: Database) {}

  async create(adjustment: MembershipAdjustment): Promise<void> {
    await this.database.execute(
      `
      INSERT INTO membership_adjustments (
        id,
        membership_id,
        member_id,
        type,
        amount,
        reason,
        notes,
        created_by,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        adjustment.id,
        adjustment.membershipId,
        adjustment.memberId,
        adjustment.type,
        adjustment.amount,
        adjustment.reason ?? null,
        adjustment.notes ?? null,
        adjustment.createdBy,
        adjustment.createdAt,
      ],
    );
  }

  async getByMembershipId(
    membershipId: string,
  ): Promise<MembershipAdjustment[]> {
    const rows = await this.database.query<MembershipAdjustmentRow>(
      `
        SELECT
          id,
          membership_id,
          member_id,
          type,
          amount,
          reason,
          notes,
          created_by,
          created_at
        FROM membership_adjustments
        WHERE membership_id = ?
        ORDER BY created_at DESC
        `,
      [membershipId],
    );

    return rows.map(row => ({
      id: row.id,
      membershipId: row.membership_id,
      memberId: row.member_id,
      type: row.type,
      amount: row.amount,
      reason: row.reason ?? undefined,
      notes: row.notes ?? undefined,
      createdBy: row.created_by,
      createdAt: row.created_at,
    }));
  }

  async getByMemberId(memberId: string): Promise<MembershipAdjustment[]> {
    const rows = await this.database.query<MembershipAdjustmentRow>(
      `
        SELECT
          id,
          membership_id,
          member_id,
          type,
          amount,
          reason,
          notes,
          created_by,
          created_at
        FROM membership_adjustments
        WHERE member_id = ?
        ORDER BY created_at DESC
      `,
      [memberId],
    );

    return rows.map(row => ({
      id: row.id,
      membershipId: row.membership_id,
      memberId: row.member_id,
      type: row.type,
      amount: row.amount,
      reason: row.reason ?? undefined,
      notes: row.notes ?? undefined,
      createdBy: row.created_by,
      createdAt: row.created_at,
    }));
  }

  async getTotalByMembershipId(membershipId: string): Promise<number> {
    const rows = await this.database.query<{
      total: number | null;
    }>(
      `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM membership_adjustments
      WHERE membership_id = ?
      `,
      [membershipId],
    );

    return rows[0]?.total ?? 0;
  }
}
