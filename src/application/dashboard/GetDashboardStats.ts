import { Database } from '../../infrastructure/database/SQLiteDatabase';

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  disabledMembers: number;
  feesDue: number;
  birthdaysToday: number;
  expiringSoon: number;
}

export class GetDashboardStatsUseCase {
  constructor(private readonly database: Database) {}

  async execute(): Promise<DashboardStats> {
    const rows = await this.database.query<{
      total_members: number;
      active_members: number;
      disabled_members: number;
      fees_due: number;
      birthdays_today: number;
      expiring_soon: number;
    }>(`
      SELECT
        (
          SELECT COUNT(*)
          FROM members
        ) AS total_members,

        (
          SELECT COUNT(*)
          FROM members
          WHERE status = 'active'
        ) AS active_members,

        (
          SELECT COUNT(*)
          FROM members
          WHERE status = 'disabled'
        ) AS disabled_members,

        (
          SELECT COALESCE(
            SUM(
              CASE
                WHEN m.amount
                  + COALESCE(m.adjustment_amount, 0)
                  + COALESCE(a.adjustments, 0)
                  - COALESCE(p.paid, 0) > 0
                THEN m.amount
                  + COALESCE(m.adjustment_amount, 0)
                  + COALESCE(a.adjustments, 0)
                  - COALESCE(p.paid, 0)
                ELSE 0
              END
            ),
            0
          )
          FROM memberships m
          LEFT JOIN (
            SELECT
              membership_id,
              COALESCE(SUM(amount), 0) AS paid
            FROM payments
            GROUP BY membership_id
          ) p ON p.membership_id = m.id
          LEFT JOIN (
            SELECT
              membership_id,
              COALESCE(SUM(amount), 0) AS adjustments
            FROM membership_adjustments
            GROUP BY membership_id
          ) a ON a.membership_id = m.id
          WHERE m.id = (
            SELECT current_membership.id
            FROM memberships current_membership
            WHERE current_membership.member_id = m.member_id
              AND date(current_membership.start_date) <= date('now', 'localtime')
            ORDER BY
              CASE WHEN current_membership.status = 'active' THEN 0 ELSE 1 END,
              date(current_membership.start_date) DESC,
              datetime(current_membership.created_at) DESC
            LIMIT 1
          )
            AND m.amount
              + COALESCE(m.adjustment_amount, 0)
              + COALESCE(a.adjustments, 0)
              - COALESCE(p.paid, 0) > 0
        ) AS fees_due,

        (
          SELECT COUNT(*)
          FROM members
          WHERE date_of_birth IS NOT NULL
            AND strftime('%m-%d', date_of_birth) =
                strftime('%m-%d', 'now', 'localtime')
        ) AS birthdays_today,

        (
          SELECT COUNT(DISTINCT m.member_id)
          FROM members mem
          INNER JOIN memberships m
            ON m.id = (
              SELECT current_membership.id
              FROM memberships current_membership
              WHERE current_membership.member_id = mem.id
              ORDER BY
                CASE WHEN current_membership.status = 'active' THEN 0 ELSE 1 END,
                date(current_membership.start_date) DESC,
                datetime(current_membership.created_at) DESC
              LIMIT 1
            )
          WHERE mem.status = 'active'
            AND date(m.end_date) <= date('now', 'localtime', '+7 days')
        ) AS expiring_soon
    `);

    const row = rows[0];

    return {
      totalMembers: Number(row?.total_members ?? 0),
      activeMembers: Number(row?.active_members ?? 0),
      disabledMembers: Number(row?.disabled_members ?? 0),
      feesDue: Number(row?.fees_due ?? 0),
      birthdaysToday: Number(row?.birthdays_today ?? 0),
      expiringSoon: Number(row?.expiring_soon ?? 0),
    };
  }
}
