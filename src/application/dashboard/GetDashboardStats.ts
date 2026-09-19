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
          SELECT COALESCE(SUM(m.amount), 0)
          FROM memberships m
          LEFT JOIN (
            SELECT
              member_id,
              COALESCE(SUM(amount), 0) AS paid
            FROM payments
            GROUP BY member_id
          ) p ON p.member_id = m.member_id
          WHERE m.end_date >= date('now', 'localtime')
            AND COALESCE(p.paid, 0) < m.amount
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
          FROM memberships m
          INNER JOIN members mem
            ON mem.id = m.member_id
          WHERE mem.status = 'active'
            AND m.status = 'active'
            AND date(m.end_date)
                BETWEEN date('now', 'localtime')
                    AND date('now', 'localtime', '+7 days')
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
