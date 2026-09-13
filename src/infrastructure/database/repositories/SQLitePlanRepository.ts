import {PlanRepository} from '../../../domain/repositories/PlanRepository';
import {MembershipPlan} from '../../../domain/entities/MembershipPlan';
import {Database} from '../SQLiteDatabase';

type PlanRow = {
  id: string;
  name: string;
  duration_months: number;
  amount: number;
  description: string | null;
  active: number;
  created_at: string;
  updated_at: string;
};

function toPlan(row: PlanRow): MembershipPlan {
  return {
    id: row.id,
    name: row.name,
    durationMonths: row.duration_months,
    amount: row.amount,
    description: row.description ?? undefined,
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SQLitePlanRepository implements PlanRepository {
  constructor(private readonly database: Database) {}

  async getById(id: string): Promise<MembershipPlan | null> {
    const rows = await this.database.query<PlanRow>(
      'SELECT * FROM membership_plans WHERE id = ? LIMIT 1',
      [id],
    );
    return rows[0] ? toPlan(rows[0]) : null;
  }

  async getAll(): Promise<MembershipPlan[]> {
    const rows = await this.database.query<PlanRow>(
      'SELECT * FROM membership_plans ORDER BY duration_months',
    );
    return rows.map(toPlan);
  }

  async save(plan: MembershipPlan): Promise<void> {
    await this.database.execute(
      `INSERT INTO membership_plans
       (id, name, duration_months, amount, description, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        plan.id,
        plan.name,
        plan.durationMonths,
        plan.amount,
        plan.description ?? null,
        plan.active ? 1 : 0,
        plan.createdAt,
        plan.updatedAt,
      ],
    );
  }

  async update(plan: MembershipPlan): Promise<void> {
    await this.database.execute(
      `UPDATE membership_plans SET
       name = ?, duration_months = ?, amount = ?, description = ?, active = ?,
       updated_at = ?
       WHERE id = ?`,
      [
        plan.name,
        plan.durationMonths,
        plan.amount,
        plan.description ?? null,
        plan.active ? 1 : 0,
        plan.updatedAt,
        plan.id,
      ],
    );
  }
}
