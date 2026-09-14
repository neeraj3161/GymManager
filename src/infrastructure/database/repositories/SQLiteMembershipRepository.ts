import { MembershipRepository } from '../../../domain/repositories/MembershipRepository';
import { Membership } from '../../../domain/entities/Membership';
import { Database } from '../SQLiteDatabase';
type MembershipRow = {
  id: string;
  member_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  amount: number;
  adjustment_amount: number;
  adjustment_type: string | null;
  adjustment_notes: string | null;
  previous_membership_id: string | null;
  status: 'active' | 'expiring' | 'expired';
  created_at: string;
  updated_at: string;
};

function toMembership(row: MembershipRow): Membership {
  return {
    id: row.id,
    memberId: row.member_id,
    planId: row.plan_id,
    startDate: row.start_date,
    endDate: row.end_date,
    amount: row.amount,
    adjustmentAmount: row.adjustment_amount,
    adjustmentType: row.adjustment_type ?? undefined,
    adjustmentNotes: row.adjustment_notes ?? undefined,
    previousMembershipId: row.previous_membership_id ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SQLiteMembershipRepository implements MembershipRepository {
  constructor(private readonly database: Database) {}

  async getById(id: string): Promise<Membership | null> {
    const rows = await this.database.query<MembershipRow>(
      'SELECT * FROM memberships WHERE id = ? LIMIT 1',
      [id],
    );
    return rows[0] ? toMembership(rows[0]) : null;
  }

  async getByMemberId(memberId: string): Promise<Membership | null> {
    const rows = await this.database.query<MembershipRow>(
      `SELECT * FROM memberships
       WHERE member_id = ?
       ORDER BY end_date DESC
       LIMIT 1`,
      [memberId],
    );
    return rows[0] ? toMembership(rows[0]) : null;
  }

  async update(membership: Membership): Promise<void> {
    await this.database.execute(
      `
    UPDATE memberships
    SET
      plan_id = ?,
      start_date = ?,
      end_date = ?,
      amount = ?,
      adjustment_amount = ?,
      adjustment_type = ?,
      adjustment_notes = ?,
      previous_membership_id = ?,
      status = ?,
      updated_at = ?
    WHERE id = ?
    `,
      [
        membership.planId,
        membership.startDate,
        membership.endDate,
        membership.amount,
        membership.adjustmentAmount,
        membership.adjustmentType ?? null,
        membership.adjustmentNotes ?? null,
        membership.previousMembershipId ?? null,
        membership.status,
        membership.updatedAt,
        membership.id,
      ],
    );
  }

  async save(membership: Membership): Promise<void> {
    await this.database.execute(
      `INSERT INTO memberships
     (
       id,
       member_id,
       plan_id,
       start_date,
       end_date,
       amount,
       adjustment_amount,
       adjustment_type,
       adjustment_notes,
       previous_membership_id,
       status,
       created_at,
       updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        membership.id,
        membership.memberId,
        membership.planId,
        membership.startDate,
        membership.endDate,
        membership.amount,
        membership.adjustmentAmount,
        membership.adjustmentType ?? null,
        membership.adjustmentNotes ?? null,
        membership.previousMembershipId ?? null,
        membership.status,
        membership.createdAt,
        membership.updatedAt,
      ],
    );
  }
}
