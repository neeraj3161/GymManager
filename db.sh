#!/bin/bash
set -e

echo "======================================"
echo "Connecting GymManager to SQLite"
echo "======================================"

mkdir -p src/application/dashboard
mkdir -p src/application/members
mkdir -p src/application/plans
mkdir -p src/application/memberships
mkdir -p src/domain/repositories
mkdir -p src/infrastructure/database/repositories
mkdir -p src/infrastructure/storage

cat > src/infrastructure/database/SQLiteDatabase.ts <<'EOF'
import {open} from 'react-native-nitro-sqlite';

export interface Database {
  initialize(): Promise<void>;
  execute(query: string, params?: unknown[]): Promise<void>;
  query<T>(query: string, params?: unknown[]): Promise<T[]>;
  executeBatch(
    commands: Array<{query: string; params?: unknown[]}>,
  ): Promise<void>;
}

const db = open({
  name: 'gym_manager.sqlite',
  location: 'databases',
});

export class SQLiteDatabase implements Database {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await db.executeAsync('PRAGMA foreign_keys = ON');

    await db.executeBatchAsync([
      {
        query: `
          CREATE TABLE IF NOT EXISTS gym (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            logo_uri TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            currency TEXT NOT NULL DEFAULT 'INR',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS members (
            id TEXT PRIMARY KEY,
            member_number TEXT NOT NULL UNIQUE,
            first_name TEXT NOT NULL,
            last_name TEXT,
            phone TEXT NOT NULL,
            email TEXT,
            date_of_birth TEXT,
            address TEXT,
            gender TEXT,
            photo_uri TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS membership_plans (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            duration_months INTEGER NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS memberships (
            id TEXT PRIMARY KEY,
            member_id TEXT NOT NULL,
            plan_id TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            amount REAL NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE,
            FOREIGN KEY(plan_id) REFERENCES membership_plans(id)
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            member_id TEXT NOT NULL,
            amount REAL NOT NULL,
            payment_date TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            notes TEXT,
            recorded_by TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS sms_templates (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            content TEXT NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS reminders (
            id TEXT PRIMARY KEY,
            member_id TEXT NOT NULL,
            type TEXT NOT NULL,
            scheduled_at TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT,
            created_at TEXT NOT NULL
          )
        `,
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_members_status ON members(status)',
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_members_name ON members(first_name, last_name)',
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_membership_member ON memberships(member_id)',
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_membership_end_date ON memberships(end_date)',
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_payments_member ON payments(member_id)',
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(scheduled_at)',
      },
    ]);

    const now = new Date().toISOString();

    await db.executeAsync(
      `INSERT OR IGNORE INTO gym
       (id, name, currency, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      ['default-gym', 'My Gym', 'INR', now, now],
    );

    await db.executeBatchAsync([
      {
        query: `
          INSERT OR IGNORE INTO membership_plans
          (id, name, duration_months, amount, description, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          'plan-1-month',
          '1 Month',
          1,
          1200,
          'Monthly membership',
          1,
          now,
          now,
        ],
      },
      {
        query: `
          INSERT OR IGNORE INTO membership_plans
          (id, name, duration_months, amount, description, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          'plan-3-months',
          '3 Months',
          3,
          3000,
          'Quarterly membership',
          1,
          now,
          now,
        ],
      },
      {
        query: `
          INSERT OR IGNORE INTO membership_plans
          (id, name, duration_months, amount, description, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          'plan-6-months',
          '6 Months',
          6,
          5500,
          'Half-year membership',
          1,
          now,
          now,
        ],
      },
      {
        query: `
          INSERT OR IGNORE INTO membership_plans
          (id, name, duration_months, amount, description, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          'plan-1-year',
          '1 Year',
          12,
          9500,
          'Annual membership',
          1,
          now,
          now,
        ],
      },
    ]);

    this.initialized = true;
  }

  async execute(query: string, params: unknown[] = []): Promise<void> {
    await db.executeAsync(query, params as any[]);
  }

  async query<T>(query: string, params: unknown[] = []): Promise<T[]> {
    const result = await db.executeAsync<T>(query, params as any[]);
    return result.results as T[];
  }

  async executeBatch(
    commands: Array<{query: string; params?: unknown[]}>,
  ): Promise<void> {
    await db.executeBatchAsync(
      commands.map(command => ({
        query: command.query,
        params: command.params as any[] | undefined,
      })),
    );
  }
}
EOF

cat > src/infrastructure/storage/IdGeneratorImpl.ts <<'EOF'
import {IdGenerator} from '../../application/shared/IdGenerator';

export class IdGeneratorImpl implements IdGenerator {
  generate(): string {
    const cryptoApi = globalThis.crypto as
      | {randomUUID?: () => string}
      | undefined;

    if (cryptoApi?.randomUUID) {
      return cryptoApi.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}
EOF

cat > src/application/members/AddMember.ts <<'EOF'
import {MemberRepository} from '../../domain/repositories/MemberRepository';
import {Member} from '../../domain/entities/Member';
import {IdGenerator} from '../shared/IdGenerator';

export interface AddMemberInput {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
}

export class AddMemberUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: AddMemberInput): Promise<Member> {
    if (!input.firstName.trim()) {
      throw new Error('First name is required');
    }

    if (!input.phone.trim()) {
      throw new Error('Phone number is required');
    }

    const now = new Date().toISOString();
    const id = this.idGenerator.generate();

    const member: Member = {
      id,
      memberNumber: `GYM-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
      firstName: input.firstName.trim(),
      lastName: input.lastName?.trim() || undefined,
      phone: input.phone.trim(),
      email: input.email?.trim() || undefined,
      dateOfBirth: input.dateOfBirth?.trim() || undefined,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await this.memberRepository.save(member);
    return member;
  }
}
EOF

cat > src/infrastructure/database/repositories/SQLiteMemberRepository.ts <<'EOF'
import {MemberRepository} from '../../../domain/repositories/MemberRepository';
import {Member} from '../../../domain/entities/Member';
import {Database} from '../SQLiteDatabase';

type MemberRow = {
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
  status: 'active' | 'disabled';
  created_at: string;
  updated_at: string;
};

function toMember(row: MemberRow): Member {
  return {
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
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SQLiteMemberRepository implements MemberRepository {
  constructor(private readonly database: Database) {}

  async getById(id: string): Promise<Member | null> {
    const rows = await this.database.query<MemberRow>(
      'SELECT * FROM members WHERE id = ? LIMIT 1',
      [id],
    );
    return rows[0] ? toMember(rows[0]) : null;
  }

  async getAll(): Promise<Member[]> {
    const rows = await this.database.query<MemberRow>(
      'SELECT * FROM members ORDER BY first_name, last_name',
    );
    return rows.map(toMember);
  }

  async getActive(): Promise<Member[]> {
    const rows = await this.database.query<MemberRow>(
      `SELECT * FROM members WHERE status = 'active'
       ORDER BY first_name, last_name`,
    );
    return rows.map(toMember);
  }

  async getDisabled(): Promise<Member[]> {
    const rows = await this.database.query<MemberRow>(
      `SELECT * FROM members WHERE status = 'disabled'
       ORDER BY first_name, last_name`,
    );
    return rows.map(toMember);
  }

  async save(member: Member): Promise<void> {
    await this.database.execute(
      `INSERT INTO members
       (id, member_number, first_name, last_name, phone, email, date_of_birth,
        address, gender, photo_uri, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        member.id,
        member.memberNumber,
        member.firstName,
        member.lastName ?? null,
        member.phone,
        member.email ?? null,
        member.dateOfBirth ?? null,
        member.address ?? null,
        member.gender ?? null,
        member.photoUri ?? null,
        member.status,
        member.createdAt,
        member.updatedAt,
      ],
    );
  }

  async update(member: Member): Promise<void> {
    await this.database.execute(
      `UPDATE members SET
       member_number = ?, first_name = ?, last_name = ?, phone = ?, email = ?,
       date_of_birth = ?, address = ?, gender = ?, photo_uri = ?, status = ?,
       updated_at = ?
       WHERE id = ?`,
      [
        member.memberNumber,
        member.firstName,
        member.lastName ?? null,
        member.phone,
        member.email ?? null,
        member.dateOfBirth ?? null,
        member.address ?? null,
        member.gender ?? null,
        member.photoUri ?? null,
        member.status,
        member.updatedAt,
        member.id,
      ],
    );
  }
}
EOF

cat > src/infrastructure/database/repositories/SQLitePlanRepository.ts <<'EOF'
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
EOF

cat > src/domain/repositories/MembershipRepository.ts <<'EOF'
import {Membership} from '../entities/Membership';

export interface MembershipRepository {
  getById(id: string): Promise<Membership | null>;
  getByMemberId(memberId: string): Promise<Membership | null>;
  save(membership: Membership): Promise<void>;
}
EOF

cat > src/infrastructure/database/repositories/SQLiteMembershipRepository.ts <<'EOF'
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
EOF

cat > src/application/memberships/CreateMembership.ts <<'EOF'
import {Membership} from '../../domain/entities/Membership';
import {MembershipRepository} from '../../domain/repositories/MembershipRepository';
import {PlanRepository} from '../../domain/repositories/PlanRepository';
import {IdGenerator} from '../shared/IdGenerator';

export interface CreateMembershipInput {
  memberId: string;
  planId: string;
  startDate?: string;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const originalDay = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(originalDay, lastDay));
  return result;
}

export class CreateMembershipUseCase {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly planRepository: PlanRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: CreateMembershipInput): Promise<Membership> {
    const plan = await this.planRepository.getById(input.planId);

    if (!plan || !plan.active) {
      throw new Error('Membership plan not found or inactive');
    }

    const start = input.startDate
      ? new Date(input.startDate)
      : new Date();

    const end = addMonths(start, plan.durationMonths);
    end.setDate(end.getDate() - 1);

    const now = new Date().toISOString();

    const membership: Membership = {
      id: this.idGenerator.generate(),
      memberId: input.memberId,
      planId: plan.id,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      amount: plan.amount,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await this.membershipRepository.save(membership);
    return membership;
  }
}
EOF

cat > src/application/plans/GetPlans.ts <<'EOF'
import {MembershipPlan} from '../../domain/entities/MembershipPlan';
import {PlanRepository} from '../../domain/repositories/PlanRepository';

export class GetPlansUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  execute(): Promise<MembershipPlan[]> {
    return this.planRepository.getAll();
  }
}
EOF

cat > src/application/dashboard/GetDashboardStats.ts <<'EOF'
import {Database} from '../../infrastructure/database/SQLiteDatabase';

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
        (SELECT COUNT(*) FROM members) AS total_members,
        (SELECT COUNT(*) FROM members WHERE status = 'active') AS active_members,
        (SELECT COUNT(*) FROM members WHERE status = 'disabled') AS disabled_members,
        (SELECT COALESCE(SUM(m.amount), 0)
         FROM memberships m
         LEFT JOIN (
           SELECT member_id, COALESCE(SUM(amount), 0) AS paid
           FROM payments
           GROUP BY member_id
         ) p ON p.member_id = m.member_id
         WHERE m.end_date >= date('now')
           AND COALESCE(p.paid, 0) < m.amount) AS fees_due,
        (SELECT COUNT(*) FROM members
         WHERE date_of_birth IS NOT NULL
           AND strftime('%m-%d', date_of_birth) = strftime('%m-%d', 'now')) AS birthdays_today,
        (SELECT COUNT(*) FROM memberships
         WHERE date(end_date) BETWEEN date('now') AND date('now', '+7 day')) AS expiring_soon
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
EOF

cat > src/di/container.ts <<'EOF'
import {SQLiteDatabase} from '../infrastructure/database/SQLiteDatabase';
import {SQLiteMemberRepository} from '../infrastructure/database/repositories/SQLiteMemberRepository';
import {SQLitePlanRepository} from '../infrastructure/database/repositories/SQLitePlanRepository';
import {SQLiteMembershipRepository} from '../infrastructure/database/repositories/SQLiteMembershipRepository';
import {AddMemberUseCase} from '../application/members/AddMember';
import {DisableMemberUseCase} from '../application/members/DisableMember';
import {EnableMemberUseCase} from '../application/members/EnableMember';
import {GetMemberDetailsUseCase} from '../application/members/GetMemberDetails';
import {CreateMembershipUseCase} from '../application/memberships/CreateMembership';
import {GetPlansUseCase} from '../application/plans/GetPlans';
import {GetDashboardStatsUseCase} from '../application/dashboard/GetDashboardStats';
import {IdGeneratorImpl} from '../infrastructure/storage/IdGeneratorImpl';

const database = new SQLiteDatabase();
const idGenerator = new IdGeneratorImpl();

const memberRepository = new SQLiteMemberRepository(database);
const planRepository = new SQLitePlanRepository(database);
const membershipRepository = new SQLiteMembershipRepository(database);

export const container = {
  database,

  repositories: {
    member: memberRepository,
    plan: planRepository,
    membership: membershipRepository,
  },

  useCases: {
    addMember: new AddMemberUseCase(memberRepository, idGenerator),
    disableMember: new DisableMemberUseCase(memberRepository),
    enableMember: new EnableMemberUseCase(memberRepository),
    getMemberDetails: new GetMemberDetailsUseCase(memberRepository),
    createMembership: new CreateMembershipUseCase(
      membershipRepository,
      planRepository,
      idGenerator,
    ),
    getPlans: new GetPlansUseCase(planRepository),
    getDashboardStats: new GetDashboardStatsUseCase(database),
  },
};
EOF

cat > App.tsx <<'EOF'
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, SafeAreaView, Text, View} from 'react-native';

import {AppNavigator} from './src/navigation/AppNavigator';
import {container} from './src/di/container';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    container.database
      .initialize()
      .then(() => setReady(true))
      .catch((initializationError: Error) => {
        setError(initializationError.message);
      });
  }, []);

  if (error) {
    return (
      <SafeAreaView style={{flex: 1, justifyContent: 'center', padding: 24}}>
        <Text style={{fontSize: 22, fontWeight: '800'}}>
          Database error
        </Text>
        <Text style={{marginTop: 10}}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!ready) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator size="large" />
        <Text style={{marginTop: 12}}>Preparing Gym Manager...</Text>
      </View>
    );
  }

  return <AppNavigator />;
}
EOF

cat > src/presentation/screens/members/MembersScreen.tsx <<'EOF'
import React, {useCallback, useState} from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

import {Member} from '../../../domain/entities/Member';
import {container} from '../../../di/container';

export function MembersScreen() {
  const navigation = useNavigation<any>();
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState('');

  const loadMembers = useCallback(async () => {
    const data = await container.repositories.member.getAll();
    setMembers(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [loadMembers]),
  );

  const filtered = members.filter(member =>
    `${member.firstName} ${member.lastName ?? ''} ${member.phone} ${member.memberNumber}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <Text style={styles.count}>{members.length} members</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate('AddMember')}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search members"
        style={styles.search}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({item}) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate('MemberDetails', {memberId: item.id})
            }>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.firstName.charAt(0)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>
                {item.firstName} {item.lastName ?? ''}
              </Text>
              <Text style={styles.phone}>{item.phone}</Text>
              <Text style={styles.plan}>{item.memberNumber}</Text>
            </View>
            <View
              style={[
                styles.status,
                item.status === 'active' ? styles.active : styles.disabled,
              ]}>
              <Text style={styles.statusText}>
                {item.status === 'active' ? 'Active' : 'Disabled'}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {query ? 'No matching members.' : 'No members yet. Add your first member.'}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {fontSize: 16, fontWeight: '700', color: '#374151'},
  addButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {color: '#FFFFFF', fontWeight: '800'},
  search: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  list: {padding: 16, paddingTop: 4},
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontSize: 18, fontWeight: '800', color: '#374151'},
  info: {flex: 1, marginLeft: 12},
  name: {fontWeight: '800', fontSize: 16, color: '#111827'},
  phone: {marginTop: 3, color: '#6B7280', fontSize: 12},
  plan: {marginTop: 3, color: '#4B5563', fontSize: 12},
  status: {paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10},
  active: {backgroundColor: '#DCFCE7'},
  disabled: {backgroundColor: '#F3F4F6'},
  statusText: {fontSize: 11, fontWeight: '800', color: '#374151'},
  empty: {textAlign: 'center', color: '#6B7280', marginTop: 40, padding: 20},
});
EOF

cat > src/presentation/screens/members/AddMemberScreen.tsx <<'EOF'
import React, {useEffect, useState} from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {MembershipPlan} from '../../../domain/entities/MembershipPlan';
import {container} from '../../../di/container';

export function AddMemberScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [planId, setPlanId] = useState('');

  useEffect(() => {
    container.useCases.getPlans().then(data => {
      setPlans(data);
      if (data[0]) {
        setPlanId(data[0].id);
      }
    });
  }, []);

  const save = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing information', 'Name and phone number are required.');
      return;
    }

    try {
      const parts = name.trim().split(/\s+/);
      const member = await container.useCases.addMember.execute({
        firstName: parts[0],
        lastName: parts.slice(1).join(' ') || undefined,
        phone,
        email,
        dateOfBirth: dob,
      });

      if (planId) {
        await container.useCases.createMembership.execute({
          memberId: member.id,
          planId,
        });
      }

      Alert.alert('Member added', `${name} has been saved locally.`, [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      Alert.alert(
        'Could not add member',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>New Member</Text>
        <Text style={styles.subtitle}>
          This member will be saved directly to the phone's local SQLite database.
        </Text>

        <Field label="Full name" value={name} onChangeText={setName} placeholder="e.g. Rahul Sharma" />
        <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="10 digit mobile number" keyboardType="phone-pad" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="Optional" keyboardType="email-address" />
        <Field label="Date of birth" value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" />

        <Text style={styles.label}>Membership plan</Text>

        {plans.map(plan => (
          <Pressable
            key={plan.id}
            style={[styles.plan, planId === plan.id && styles.planSelected]}
            onPress={() => setPlanId(plan.id)}>
            <View style={styles.planInfo}>
              <Text
                style={[
                  styles.planName,
                  planId === plan.id && styles.planTextSelected,
                ]}>
                {plan.name}
              </Text>
              <Text
                style={[
                  styles.planDescription,
                  planId === plan.id && styles.planTextSelected,
                ]}>
                {plan.durationMonths} month{plan.durationMonths > 1 ? 's' : ''}
              </Text>
            </View>
            <Text
              style={[
                styles.amount,
                planId === plan.id && styles.planTextSelected,
              ]}>
              ₹{plan.amount.toLocaleString('en-IN')}
            </Text>
          </Pressable>
        ))}

        <Pressable style={styles.save} onPress={save}>
          <Text style={styles.saveText}>Add Member</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  container: {padding: 16, paddingBottom: 40},
  title: {fontSize: 24, fontWeight: '800', color: '#111827'},
  subtitle: {marginTop: 5, marginBottom: 24, color: '#6B7280', lineHeight: 19},
  field: {marginBottom: 16},
  label: {fontWeight: '700', color: '#374151', marginBottom: 7},
  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  plan: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    marginBottom: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planSelected: {backgroundColor: '#111827'},
  planInfo: {flex: 1},
  planName: {fontWeight: '800', color: '#111827'},
  planDescription: {marginTop: 3, color: '#6B7280', fontSize: 12},
  amount: {fontWeight: '800', color: '#111827'},
  planTextSelected: {color: '#FFFFFF'},
  save: {
    marginTop: 18,
    backgroundColor: '#111827',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {color: '#FFFFFF', fontWeight: '800', fontSize: 16},
});
EOF

cat > src/presentation/screens/members/MemberDetailsScreen.tsx <<'EOF'
import React, {useCallback, useState} from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';

import {Member} from '../../../domain/entities/Member';
import {Membership} from '../../../domain/entities/Membership';
import {MembershipPlan} from '../../../domain/entities/MembershipPlan';
import {container} from '../../../di/container';

export function MemberDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const memberId = route.params?.memberId as string;

  const [member, setMember] = useState<Member | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [plan, setPlan] = useState<MembershipPlan | null>(null);

  const load = useCallback(async () => {
    const memberData = await container.useCases.getMemberDetails.execute(memberId);
    const membershipData =
      await container.repositories.membership.getByMemberId(memberId);

    setMember(memberData);
    setMembership(membershipData);

    if (membershipData) {
      setPlan(
        await container.repositories.plan.getById(membershipData.planId),
      );
    }
  }, [memberId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const disable = () => {
    Alert.alert(
      'Disable member',
      'The member will remain in the database but will no longer be active.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            await container.useCases.disableMember.execute(memberId);
            await load();
          },
        },
      ],
    );
  };

  const enable = async () => {
    await container.useCases.enableMember.execute(memberId);
    await load();
  };

  if (!member) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.empty}>Member not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{member.firstName.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>
            {member.firstName} {member.lastName ?? ''}
          </Text>
          <Text style={styles.phone}>{member.phone}</Text>
          <Text style={styles.memberNumber}>{member.memberNumber}</Text>

          <View
            style={[
              styles.badge,
              member.status === 'active' ? styles.activeBadge : styles.disabledBadge,
            ]}>
            <Text style={styles.badgeText}>
              {member.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Section title="Membership">
          <Row label="Plan" value={plan?.name ?? 'No plan'} />
          <Row
            label="Start date"
            value={membership ? formatDate(membership.startDate) : '-'}
          />
          <Row
            label="Expiry date"
            value={membership ? formatDate(membership.endDate) : '-'}
          />
          <Row
            label="Amount"
            value={membership ? `₹${membership.amount.toLocaleString('en-IN')}` : '-'}
          />
        </Section>

        <Section title="Contact">
          <Row label="Phone" value={member.phone} />
          <Row label="Email" value={member.email ?? '-'} />
          <Row label="Date of birth" value={member.dateOfBirth ?? '-'} />
        </Section>

        <View style={styles.actions}>
          {member.status === 'active' ? (
            <Pressable style={styles.secondaryDanger} onPress={disable}>
              <Text style={styles.dangerText}>Disable Member</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.primary} onPress={enable}>
              <Text style={styles.primaryText}>Enable Member</Text>
            </Pressable>
          )}

          <Pressable
            style={styles.secondary}
            onPress={() => navigation.navigate('Payments')}>
            <Text style={styles.secondaryText}>Payments</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function Section({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  container: {padding: 16, paddingBottom: 40},
  profile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    padding: 22,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontSize: 30, fontWeight: '800', color: '#374151'},
  name: {fontSize: 22, fontWeight: '800', marginTop: 12, color: '#111827'},
  phone: {marginTop: 4, color: '#6B7280'},
  memberNumber: {marginTop: 4, color: '#9CA3AF', fontSize: 12},
  badge: {
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeBadge: {backgroundColor: '#DCFCE7'},
  disabledBadge: {backgroundColor: '#F3F4F6'},
  badgeText: {fontSize: 11, fontWeight: '800', color: '#374151'},
  section: {marginTop: 20},
  sectionTitle: {fontSize: 17, fontWeight: '800', marginBottom: 10, color: '#111827'},
  sectionCard: {backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLabel: {color: '#6B7280'},
  rowValue: {fontWeight: '700', color: '#111827', maxWidth: '58%', textAlign: 'right'},
  actions: {marginTop: 24, gap: 10},
  primary: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {color: '#FFFFFF', fontWeight: '800'},
  secondary: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {color: '#111827', fontWeight: '800'},
  secondaryDanger: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerText: {color: '#B91C1C', fontWeight: '800'},
  empty: {padding: 20},
});
EOF

cat > src/presentation/screens/dashboard/DashboardScreen.tsx <<'EOF'
import React, {useCallback, useState} from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

import {DashboardStats} from '../../../application/dashboard/GetDashboardStats';
import {container} from '../../../di/container';

const emptyStats: DashboardStats = {
  totalMembers: 0,
  activeMembers: 0,
  disabledMembers: 0,
  feesDue: 0,
  birthdaysToday: 0,
  expiringSoon: 0,
};

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState(emptyStats);

  const load = useCallback(async () => {
    setStats(await container.useCases.getDashboardStats.execute());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Gym Manager</Text>
            <Text style={styles.subtitle}>Your gym at a glance</Text>
          </View>
          <Pressable
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.settingsText}>⚙</Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Total Members" value={String(stats.totalMembers)} />
          <StatCard label="Active" value={String(stats.activeMembers)} />
          <StatCard
            label="Fees Due"
            value={`₹${stats.feesDue.toLocaleString('en-IN')}`}
          />
          <StatCard label="Birthdays Today" value={String(stats.birthdaysToday)} />
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionsGrid}>
          <ActionCard
            title="Add Member"
            icon="+"
            onPress={() => navigation.navigate('AddMember')}
          />
          <ActionCard
            title="Members"
            icon="👥"
            onPress={() => navigation.navigate('Members')}
          />
          <ActionCard
            title="Payments"
            icon="₹"
            onPress={() => navigation.navigate('Payments')}
          />
          <ActionCard
            title="Plans"
            icon="▤"
            onPress={() => navigation.navigate('Plans')}
          />
          <ActionCard
            title="Birthdays"
            icon="★"
            onPress={() => navigation.navigate('Birthdays')}
          />
          <ActionCard
            title="Staff"
            icon="♙"
            onPress={() => navigation.navigate('Staff')}
          />
        </View>

        <Text style={styles.sectionTitle}>Needs Attention</Text>

        <View style={styles.alertCard}>
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>Memberships expiring soon</Text>
            <Text style={styles.alertText}>
              {stats.expiringSoon} membership{stats.expiringSoon === 1 ? '' : 's'} expire within 7 days.
            </Text>
          </View>
        </View>

        <View style={styles.alertCard}>
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>Disabled members</Text>
            <Text style={styles.alertText}>
              {stats.disabledMembers} member{stats.disabledMembers === 1 ? '' : 's'} currently disabled.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  container: {padding: 16, paddingBottom: 32},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brand: {fontSize: 26, fontWeight: '800', color: '#111827'},
  subtitle: {marginTop: 4, color: '#6B7280', fontSize: 14},
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsText: {fontSize: 21},
  statsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  statValue: {fontSize: 23, fontWeight: '800', color: '#111827'},
  statLabel: {marginTop: 5, color: '#6B7280'},
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  actionsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  actionCard: {
    width: '31%',
    minHeight: 92,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  actionIcon: {fontSize: 24, marginBottom: 8},
  actionTitle: {fontSize: 12, fontWeight: '700', color: '#374151'},
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  alertBody: {flex: 1},
  alertTitle: {fontWeight: '800', color: '#111827'},
  alertText: {marginTop: 3, color: '#6B7280', fontSize: 13},
});
EOF

cat > src/presentation/screens/plans/PlansScreen.tsx <<'EOF'
import React, {useCallback, useState} from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';

import {MembershipPlan} from '../../../domain/entities/MembershipPlan';
import {container} from '../../../di/container';

export function PlansScreen() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  const load = useCallback(async () => {
    setPlans(await container.useCases.getPlans());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.title}>Membership Plans</Text>
            <Text style={styles.subtitle}>Plans are stored locally in SQLite.</Text>
          </View>
          <Pressable
            style={styles.add}
            onPress={() =>
              Alert.alert('Next step', 'Plan creation and editing will be connected next.')
            }>
            <Text style={styles.addText}>+ Add</Text>
          </Pressable>
        </View>

        {plans.map(plan => (
          <View style={styles.card} key={plan.id}>
            <View>
              <Text style={styles.name}>{plan.name}</Text>
              <Text style={styles.duration}>
                {plan.durationMonths} month{plan.durationMonths > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>
                ₹{plan.amount.toLocaleString('en-IN')}
              </Text>
              <Pressable
                onPress={() =>
                  Alert.alert('Next step', `Editing ${plan.name} will be connected next.`)
                }>
                <Text style={styles.edit}>Edit</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  container: {padding: 16},
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {fontSize: 23, fontWeight: '800', color: '#111827'},
  subtitle: {marginTop: 4, color: '#6B7280'},
  add: {backgroundColor: '#111827', borderRadius: 11, padding: 10},
  addText: {color: '#FFFFFF', fontWeight: '800'},
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {fontSize: 17, fontWeight: '800', color: '#111827'},
  duration: {marginTop: 4, color: '#6B7280'},
  right: {alignItems: 'flex-end'},
  amount: {fontSize: 18, fontWeight: '800', color: '#111827'},
  edit: {marginTop: 5, fontWeight: '700', color: '#2563EB'},
});
EOF

echo ""
echo "======================================"
echo "SQLite integration files applied."
echo "======================================"
echo ""
echo "Now run:"
echo "npm install react-native-nitro-sqlite react-native-nitro-modules"
echo "npx tsc --noEmit"
echo "npm run android"
