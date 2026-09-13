import {MembershipRepository} from '../../../domain/repositories/MembershipRepository';
import {Membership} from '../../../domain/entities/Membership';
import {Database} from '../SQLiteDatabase';

type MembershipRow = {
  id: string;
  member_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  amount: number;
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

  async save(membership: Membership): Promise<void> {
    await this.database.execute(
      `INSERT INTO memberships
       (id, member_id, plan_id, start_date, end_date, amount, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        membership.id,
        membership.memberId,
        membership.planId,
        membership.startDate,
        membership.endDate,
        membership.amount,
        membership.status,
        membership.createdAt,
        membership.updatedAt,
      ],
    );
  }
}
