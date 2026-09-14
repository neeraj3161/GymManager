import { Member } from '../../domain/entities/Member';
import { Database } from '../../infrastructure/database/SQLiteDatabase';

export interface MemberWithFeeDue {
  member: Member;
  membershipAmount: number;
  adjustmentAmount: number;
  totalPaid: number;
  remainingAmount: number;
  overdue: boolean;
}

interface FeeDueRow {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string | null;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  address: string | null;
  gender: string | null;
  photo_uri: string | null;
  member_status: 'active' | 'disabled';
  member_created_at: string;
  member_updated_at: string;

  membership_amount: number;
  membership_adjustment: number;
  additional_adjustments: number | null;
  total_paid: number | null;
  end_date: string;
}

export class GetMembersWithFeesDueUseCase {
  constructor(private readonly database: Database) {}

  async execute(): Promise<MemberWithFeeDue[]> {
    const rows = await this.database.query<FeeDueRow>(
      `
      SELECT
        m.id,
        m.member_number,
        m.first_name,
        m.last_name,
        m.phone,
        m.email,
        m.date_of_birth,
        m.address,
        m.gender,
        m.photo_uri,
        m.status AS member_status,
        m.created_at AS member_created_at,
        m.updated_at AS member_updated_at,

        ms.amount AS membership_amount,

        COALESCE(ms.adjustment_amount, 0)
          AS membership_adjustment,

        COALESCE(
          (
            SELECT SUM(ma.amount)
            FROM membership_adjustments ma
            WHERE ma.membership_id = ms.id
          ),
          0
        ) AS additional_adjustments,

        COALESCE(
          (
            SELECT SUM(p.amount)
            FROM payments p
            WHERE p.membership_id = ms.id
          ),
          0
        ) AS total_paid,

        ms.end_date

      FROM members m

      INNER JOIN memberships ms
        ON ms.id = (
          SELECT ms2.id
          FROM memberships ms2
          WHERE ms2.member_id = m.id
            AND date(ms2.start_date) <= date('now')
          ORDER BY
            date(ms2.end_date) DESC,
            datetime(ms2.created_at) DESC
          LIMIT 1
        )

      WHERE m.status = 'active'

        AND (
          ms.amount
          + COALESCE(ms.adjustment_amount, 0)
          + COALESCE(
              (
                SELECT SUM(ma.amount)
                FROM membership_adjustments ma
                WHERE ma.membership_id = ms.id
              ),
              0
            )
          - COALESCE(
              (
                SELECT SUM(p.amount)
                FROM payments p
                WHERE p.membership_id = ms.id
              ),
              0
            )
        ) > 0

      ORDER BY
        date(ms.end_date) ASC,
        m.first_name COLLATE NOCASE ASC,
        m.last_name COLLATE NOCASE ASC
      `,
    );

    return rows.map(row => {
      const membershipAmount = Number(row.membership_amount) || 0;

      const membershipAdjustment = Number(row.membership_adjustment) || 0;

      const additionalAdjustments = Number(row.additional_adjustments) || 0;

      const adjustmentAmount = membershipAdjustment + additionalAdjustments;

      const totalPaid = Number(row.total_paid) || 0;

      const effectiveAmount = Math.max(membershipAmount + adjustmentAmount, 0);

      const remainingAmount = Math.max(effectiveAmount - totalPaid, 0);

      const overdue = new Date(row.end_date).getTime() < Date.now();

      const member: Member = {
        id: row.id,
        memberNumber: row.member_number,
        firstName: row.first_name,
        lastName: row.last_name ?? undefined,
        phone: row.phone,
        email: row.email ?? undefined,
        dateOfBirth: row.date_of_birth ?? undefined,
        address: row.address ?? undefined,
        gender: row.gender ?? undefined,
        photoUri: row.photo_uri ?? undefined,
        status: row.member_status,
        createdAt: row.member_created_at,
        updatedAt: row.member_updated_at,
      };

      return {
        member,
        membershipAmount,
        adjustmentAmount,
        totalPaid,
        remainingAmount,
        overdue,
      };
    });
  }
}
