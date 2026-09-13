#!/bin/bash

set -e

echo "======================================"
echo "Setting up GymManager architecture"
echo "======================================"

# --------------------------------------
# Directories
# --------------------------------------

mkdir -p src/domain/entities
mkdir -p src/domain/valueObjects
mkdir -p src/domain/repositories

mkdir -p src/application/members
mkdir -p src/application/memberships
mkdir -p src/application/payments
mkdir -p src/application/plans
mkdir -p src/application/reminders
mkdir -p src/application/users
mkdir -p src/application/auth
mkdir -p src/application/backup
mkdir -p src/application/shared

mkdir -p src/infrastructure/database/migrations
mkdir -p src/infrastructure/database/repositories
mkdir -p src/infrastructure/sms
mkdir -p src/infrastructure/notifications
mkdir -p src/infrastructure/storage
mkdir -p src/infrastructure/backup
mkdir -p src/infrastructure/auth

mkdir -p src/presentation/screens/auth
mkdir -p src/presentation/screens/dashboard
mkdir -p src/presentation/screens/members
mkdir -p src/presentation/screens/memberships
mkdir -p src/presentation/screens/payments
mkdir -p src/presentation/screens/plans
mkdir -p src/presentation/screens/birthdays
mkdir -p src/presentation/screens/staff
mkdir -p src/presentation/screens/settings

mkdir -p src/presentation/components
mkdir -p src/presentation/hooks
mkdir -p src/presentation/viewModels

mkdir -p src/store
mkdir -p src/navigation

mkdir -p src/shared/constants
mkdir -p src/shared/errors
mkdir -p src/shared/utils
mkdir -p src/shared/types

mkdir -p src/di

mkdir -p __tests__/domain
mkdir -p __tests__/application

# --------------------------------------
# Domain Entities
# --------------------------------------

cat > src/domain/entities/Member.ts <<'EOF'
export type MemberStatus = 'active' | 'disabled';

export interface Member {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  gender?: string;
  photoUri?: string;
  status: MemberStatus;
  createdAt: string;
  updatedAt: string;
}
EOF

cat > src/domain/entities/MembershipPlan.ts <<'EOF'
export interface MembershipPlan {
  id: string;
  name: string;
  durationMonths: number;
  amount: number;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
EOF

cat > src/domain/entities/Membership.ts <<'EOF'
export type MembershipStatus =
  | 'active'
  | 'expiring'
  | 'expired';

export interface Membership {
  id: string;
  memberId: string;
  planId: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
}
EOF

cat > src/domain/entities/Payment.ts <<'EOF'
export type PaymentMethod =
  | 'cash'
  | 'upi'
  | 'card'
  | 'bank'
  | 'other';

export interface Payment {
  id: string;
  memberId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}
EOF

cat > src/domain/entities/User.ts <<'EOF'
export type UserRole =
  | 'owner'
  | 'manager'
  | 'receptionist'
  | 'trainer';

export interface User {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
EOF

cat > src/domain/entities/Gym.ts <<'EOF'
export interface Gym {
  id: string;
  name: string;
  logoUri?: string;
  phone?: string;
  email?: string;
  address?: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}
EOF

cat > src/domain/entities/SmsTemplate.ts <<'EOF'
export type SmsTemplateType =
  | 'birthday'
  | 'fee_reminder'
  | 'membership_expiry'
  | 'payment_confirmation';

export interface SmsTemplate {
  id: string;
  type: SmsTemplateType;
  name: string;
  content: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
EOF

cat > src/domain/entities/Reminder.ts <<'EOF'
export type ReminderType =
  | 'birthday'
  | 'fee_due'
  | 'membership_expiry';

export type ReminderStatus =
  | 'pending'
  | 'sent'
  | 'failed';

export interface Reminder {
  id: string;
  memberId: string;
  type: ReminderType;
  scheduledAt: string;
  status: ReminderStatus;
  createdAt: string;
}
EOF

# --------------------------------------
# Value Objects
# --------------------------------------

cat > src/domain/valueObjects/PhoneNumber.ts <<'EOF'
export class PhoneNumber {
  private constructor(
    public readonly value: string,
  ) {}

  static create(value: string): PhoneNumber {
    const normalized = value.replace(/\s+/g, '');

    if (!normalized) {
      throw new Error('Phone number is required');
    }

    return new PhoneNumber(normalized);
  }
}
EOF

cat > src/domain/valueObjects/Money.ts <<'EOF'
export class Money {
  private constructor(
    public readonly amount: number,
  ) {}

  static create(amount: number): Money {
    if (!Number.isFinite(amount)) {
      throw new Error('Invalid amount');
    }

    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }

    return new Money(amount);
  }
}
EOF

# --------------------------------------
# Repository Interfaces
# --------------------------------------

cat > src/domain/repositories/MemberRepository.ts <<'EOF'
import {Member} from '../entities/Member';

export interface MemberRepository {
  getById(id: string): Promise<Member | null>;
  getAll(): Promise<Member[]>;
  getActive(): Promise<Member[]>;
  getDisabled(): Promise<Member[]>;
  save(member: Member): Promise<void>;
  update(member: Member): Promise<void>;
}
EOF

cat > src/domain/repositories/PlanRepository.ts <<'EOF'
import {MembershipPlan} from '../entities/MembershipPlan';

export interface PlanRepository {
  getById(id: string): Promise<MembershipPlan | null>;
  getAll(): Promise<MembershipPlan[]>;
  save(plan: MembershipPlan): Promise<void>;
  update(plan: MembershipPlan): Promise<void>;
}
EOF

cat > src/domain/repositories/PaymentRepository.ts <<'EOF'
import {Payment} from '../entities/Payment';

export interface PaymentRepository {
  getByMemberId(memberId: string): Promise<Payment[]>;
  save(payment: Payment): Promise<void>;
}
EOF

cat > src/domain/repositories/UserRepository.ts <<'EOF'
import {User} from '../entities/User';

export interface UserRepository {
  getById(id: string): Promise<User | null>;
  getByUsername(username: string): Promise<User | null>;
  getAll(): Promise<User[]>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
}
EOF

# --------------------------------------
# Application Interfaces
# --------------------------------------

cat > src/application/backup/BackupService.ts <<'EOF'
export interface BackupFile {
  path: string;
  createdAt: string;
  size: number;
}

export interface BackupService {
  createBackup(): Promise<BackupFile>;
  restoreBackup(path: string): Promise<void>;
}
EOF

cat > src/application/reminders/SmsService.ts <<'EOF'
export interface SmsMessage {
  phoneNumber: string;
  message: string;
}

export interface SmsResult {
  success: boolean;
  error?: string;
}

export interface SmsService {
  send(message: SmsMessage): Promise<SmsResult>;
}
EOF

cat > src/application/reminders/NotificationService.ts <<'EOF'
export interface NotificationService {
  schedule(
    title: string,
    body: string,
    date: Date,
  ): Promise<void>;

  cancel(id: string): Promise<void>;
}
EOF

cat > src/application/auth/AuthorizationService.ts <<'EOF'
import {User} from '../../domain/entities/User';

export type Permission =
  | 'members.view'
  | 'members.create'
  | 'members.edit'
  | 'members.disable'
  | 'payments.view'
  | 'payments.create'
  | 'plans.manage'
  | 'staff.manage'
  | 'settings.manage'
  | 'sms.send'
  | 'backup.manage';

export interface AuthorizationService {
  can(
    user: User,
    permission: Permission,
  ): boolean;
}
EOF

# --------------------------------------
# ID Generator
# --------------------------------------

cat > src/application/shared/IdGenerator.ts <<'EOF'
export interface IdGenerator {
  generate(): string;
}
EOF

cat > src/infrastructure/storage/IdGeneratorImpl.ts <<'EOF'
import {IdGenerator} from '../../application/shared/IdGenerator';

export class IdGeneratorImpl implements IdGenerator {
  generate(): string {
    return `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 11)}`;
  }
}
EOF

# --------------------------------------
# Member Use Cases
# --------------------------------------

cat > src/application/members/AddMember.ts <<'EOF'
import {Member} from '../../domain/entities/Member';
import {MemberRepository} from '../../domain/repositories/MemberRepository';
import {IdGenerator} from '../shared/IdGenerator';

export interface AddMemberInput {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  gender?: string;
  photoUri?: string;
}

export class AddMemberUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: AddMemberInput): Promise<Member> {
    const firstName = input.firstName.trim();
    const phone = input.phone.trim();

    if (!firstName) {
      throw new Error('First name is required');
    }

    if (!phone) {
      throw new Error('Phone number is required');
    }

    const now = new Date().toISOString();

    const member: Member = {
      id: this.idGenerator.generate(),
      memberNumber: `GYM-${Date.now()}`,
      firstName,
      lastName: input.lastName?.trim(),
      phone,
      email: input.email?.trim(),
      dateOfBirth: input.dateOfBirth,
      address: input.address?.trim(),
      gender: input.gender,
      photoUri: input.photoUri,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await this.memberRepository.save(member);

    return member;
  }
}
EOF

cat > src/application/members/GetMemberDetails.ts <<'EOF'
import {Member} from '../../domain/entities/Member';
import {MemberRepository} from '../../domain/repositories/MemberRepository';

export class GetMemberDetailsUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(id: string): Promise<Member | null> {
    return this.memberRepository.getById(id);
  }
}
EOF

cat > src/application/members/DisableMember.ts <<'EOF'
import {MemberRepository} from '../../domain/repositories/MemberRepository';

export class DisableMemberUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const member = await this.memberRepository.getById(id);

    if (!member) {
      throw new Error('Member not found');
    }

    await this.memberRepository.update({
      ...member,
      status: 'disabled',
      updatedAt: new Date().toISOString(),
    });
  }
}
EOF

cat > src/application/members/EnableMember.ts <<'EOF'
import {MemberRepository} from '../../domain/repositories/MemberRepository';

export class EnableMemberUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const member = await this.memberRepository.getById(id);

    if (!member) {
      throw new Error('Member not found');
    }

    await this.memberRepository.update({
      ...member,
      status: 'active',
      updatedAt: new Date().toISOString(),
    });
  }
}
EOF

# --------------------------------------
# Payments
# --------------------------------------

cat > src/application/payments/RecordPayment.ts <<'EOF'
import {
  Payment,
  PaymentMethod,
} from '../../domain/entities/Payment';

import {PaymentRepository} from '../../domain/repositories/PaymentRepository';
import {IdGenerator} from '../shared/IdGenerator';

export interface RecordPaymentInput {
  memberId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  recordedBy: string;
  notes?: string;
}

export class RecordPaymentUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(
    input: RecordPaymentInput,
  ): Promise<Payment> {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new Error(
        'Payment amount must be greater than zero',
      );
    }

    const now = new Date().toISOString();

    const payment: Payment = {
      id: this.idGenerator.generate(),
      memberId: input.memberId,
      amount: input.amount,
      paymentDate: now,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      recordedBy: input.recordedBy,
      createdAt: now,
    };

    await this.paymentRepository.save(payment);

    return payment;
  }
}
EOF

# --------------------------------------
# Plans
# --------------------------------------

cat > src/application/plans/CreatePlan.ts <<'EOF'
import {MembershipPlan} from '../../domain/entities/MembershipPlan';
import {PlanRepository} from '../../domain/repositories/PlanRepository';
import {IdGenerator} from '../shared/IdGenerator';

export interface CreatePlanInput {
  name: string;
  durationMonths: number;
  amount: number;
  description?: string;
}

export class CreatePlanUseCase {
  constructor(
    private readonly planRepository: PlanRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(
    input: CreatePlanInput,
  ): Promise<MembershipPlan> {
    const name = input.name.trim();

    if (!name) {
      throw new Error('Plan name is required');
    }

    if (
      !Number.isInteger(input.durationMonths) ||
      input.durationMonths <= 0
    ) {
      throw new Error(
        'Duration must be a positive number of months',
      );
    }

    if (!Number.isFinite(input.amount) || input.amount < 0) {
      throw new Error('Invalid plan amount');
    }

    const now = new Date().toISOString();

    const plan: MembershipPlan = {
      id: this.idGenerator.generate(),
      name,
      durationMonths: input.durationMonths,
      amount: input.amount,
      description: input.description?.trim(),
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.planRepository.save(plan);

    return plan;
  }
}
EOF

# --------------------------------------
# Backup
# --------------------------------------

cat > src/application/backup/ExportDatabase.ts <<'EOF'
import {
  BackupFile,
  BackupService,
} from './BackupService';

export class ExportDatabaseUseCase {
  constructor(
    private readonly backupService: BackupService,
  ) {}

  async execute(): Promise<BackupFile> {
    return this.backupService.createBackup();
  }
}
EOF

cat > src/application/backup/RestoreDatabase.ts <<'EOF'
import {BackupService} from './BackupService';

export class RestoreDatabaseUseCase {
  constructor(
    private readonly backupService: BackupService,
  ) {}

  async execute(path: string): Promise<void> {
    if (!path.trim()) {
      throw new Error('Backup file is required');
    }

    await this.backupService.restoreBackup(path);
  }
}
EOF

# --------------------------------------
# SQLite abstraction
# --------------------------------------

cat > src/infrastructure/database/SQLiteDatabase.ts <<'EOF'
export interface Database {
  execute(
    query: string,
    params?: unknown[],
  ): Promise<void>;

  query<T>(
    query: string,
    params?: unknown[],
  ): Promise<T[]>;

  transaction(
    callback: () => Promise<void>,
  ): Promise<void>;
}

export class SQLiteDatabase implements Database {
  async execute(
    _query: string,
    _params: unknown[] = [],
  ): Promise<void> {
    throw new Error(
      'SQLiteDatabase has not been configured yet.',
    );
  }

  async query<T>(
    _query: string,
    _params: unknown[] = [],
  ): Promise<T[]> {
    throw new Error(
      'SQLiteDatabase has not been configured yet.',
    );
  }

  async transaction(
    _callback: () => Promise<void>,
  ): Promise<void> {
    throw new Error(
      'SQLiteDatabase has not been configured yet.',
    );
  }
}
EOF

# --------------------------------------
# Database Migration
# --------------------------------------

cat > src/infrastructure/database/migrations/001_initial.sql <<'EOF'
PRAGMA foreign_keys = ON;

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
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

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
);

CREATE TABLE IF NOT EXISTS membership_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  duration_months INTEGER NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

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
  FOREIGN KEY(member_id) REFERENCES members(id),
  FOREIGN KEY(plan_id) REFERENCES membership_plans(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT,
  recorded_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS sms_templates (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  type TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_members_status
ON members(status);

CREATE INDEX IF NOT EXISTS idx_members_dob
ON members(date_of_birth);

CREATE INDEX IF NOT EXISTS idx_memberships_member
ON memberships(member_id);

CREATE INDEX IF NOT EXISTS idx_memberships_end_date
ON memberships(end_date);

CREATE INDEX IF NOT EXISTS idx_payments_member
ON payments(member_id);

CREATE INDEX IF NOT EXISTS idx_reminders_status
ON reminders(status);
EOF

# --------------------------------------
# SQLite Member Repository
# --------------------------------------

cat > src/infrastructure/database/repositories/SQLiteMemberRepository.ts <<'EOF'
import {Member} from '../../../domain/entities/Member';
import {MemberRepository} from '../../../domain/repositories/MemberRepository';
import {Database} from '../SQLiteDatabase';

interface MemberRow {
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
}

export class SQLiteMemberRepository
  implements MemberRepository
{
  constructor(
    private readonly database: Database,
  ) {}

  private mapRow(row: MemberRow): Member {
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

  async getById(id: string): Promise<Member | null> {
    const rows = await this.database.query<MemberRow>(
      `
      SELECT *
      FROM members
      WHERE id = ?
      LIMIT 1
      `,
      [id],
    );

    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async getAll(): Promise<Member[]> {
    const rows = await this.database.query<MemberRow>(
      `
      SELECT *
      FROM members
      ORDER BY first_name, last_name
      `,
    );

    return rows.map(row => this.mapRow(row));
  }

  async getActive(): Promise<Member[]> {
    const rows = await this.database.query<MemberRow>(
      `
      SELECT *
      FROM members
      WHERE status = 'active'
      ORDER BY first_name, last_name
      `,
    );

    return rows.map(row => this.mapRow(row));
  }

  async getDisabled(): Promise<Member[]> {
    const rows = await this.database.query<MemberRow>(
      `
      SELECT *
      FROM members
      WHERE status = 'disabled'
      ORDER BY first_name, last_name
      `,
    );

    return rows.map(row => this.mapRow(row));
  }

  async save(member: Member): Promise<void> {
    await this.database.execute(
      `
      INSERT INTO members (
        id,
        member_number,
        first_name,
        last_name,
        phone,
        email,
        date_of_birth,
        address,
        gender,
        photo_uri,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
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
      `
      UPDATE members
      SET
        member_number = ?,
        first_name = ?,
        last_name = ?,
        phone = ?,
        email = ?,
        date_of_birth = ?,
        address = ?,
        gender = ?,
        photo_uri = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?
      `,
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

# --------------------------------------
# SMS
# --------------------------------------

cat > src/infrastructure/sms/AndroidSmsAdapter.ts <<'EOF'
import {
  SmsMessage,
  SmsResult,
  SmsService,
} from '../../application/reminders/SmsService';

export class AndroidSmsAdapter implements SmsService {
  async send(
    message: SmsMessage,
  ): Promise<SmsResult> {
    console.log(
      'SMS adapter placeholder:',
      message.phoneNumber,
      message.message,
    );

    return {
      success: false,
      error: 'Native Android SMS adapter not configured.',
    };
  }
}
EOF

# --------------------------------------
# Notifications
# --------------------------------------

cat > src/infrastructure/notifications/LocalNotificationAdapter.ts <<'EOF'
import {NotificationService} from '../../application/reminders/NotificationService';

export class LocalNotificationAdapter
  implements NotificationService
{
  async schedule(
    title: string,
    body: string,
    date: Date,
  ): Promise<void> {
    console.log(
      'Notification placeholder:',
      title,
      body,
      date.toISOString(),
    );
  }

  async cancel(id: string): Promise<void> {
    console.log(
      'Cancel notification placeholder:',
      id,
    );
  }
}
EOF

# --------------------------------------
# Secure Storage
# --------------------------------------

cat > src/infrastructure/storage/SecureStorageAdapter.ts <<'EOF'
export interface SecureStorage {
  set(
    key: string,
    value: string,
  ): Promise<void>;

  get(
    key: string,
  ): Promise<string | null>;

  remove(
    key: string,
  ): Promise<void>;
}

export class SecureStorageAdapter
  implements SecureStorage
{
  async set(
    _key: string,
    _value: string,
  ): Promise<void> {
    throw new Error(
      'Secure storage has not been configured yet.',
    );
  }

  async get(
    _key: string,
  ): Promise<string | null> {
    throw new Error(
      'Secure storage has not been configured yet.',
    );
  }

  async remove(
    _key: string,
  ): Promise<void> {
    throw new Error(
      'Secure storage has not been configured yet.',
    );
  }
}
EOF

# --------------------------------------
# Backup
# --------------------------------------

cat > src/infrastructure/backup/SQLiteBackupService.ts <<'EOF'
import {
  BackupFile,
  BackupService,
} from '../../application/backup/BackupService';

export class SQLiteBackupService
  implements BackupService
{
  async createBackup(): Promise<BackupFile> {
    throw new Error(
      'SQLite backup has not been configured yet.',
    );
  }

  async restoreBackup(
    _path: string,
  ): Promise<void> {
    throw new Error(
      'SQLite restore has not been configured yet.',
    );
  }
}
EOF

# --------------------------------------
# RBAC
# --------------------------------------

cat > src/infrastructure/auth/RoleAuthorizationService.ts <<'EOF'
import {
  AuthorizationService,
  Permission,
} from '../../application/auth/AuthorizationService';

import {
  User,
  UserRole,
} from '../../domain/entities/User';

const permissions: Record<UserRole, Permission[]> = {
  owner: [
    'members.view',
    'members.create',
    'members.edit',
    'members.disable',
    'payments.view',
    'payments.create',
    'plans.manage',
    'staff.manage',
    'settings.manage',
    'sms.send',
    'backup.manage',
  ],

  manager: [
    'members.view',
    'members.create',
    'members.edit',
    'members.disable',
    'payments.view',
    'payments.create',
    'plans.manage',
    'sms.send',
  ],

  receptionist: [
    'members.view',
    'members.create',
    'members.edit',
    'payments.view',
    'payments.create',
    'sms.send',
  ],

  trainer: [
    'members.view',
  ],
};

export class RoleAuthorizationService
  implements AuthorizationService
{
  can(
    user: User,
    permission: Permission,
  ): boolean {
    if (!user.active) {
      return false;
    }

    return permissions[user.role].includes(permission);
  }
}
EOF

# --------------------------------------
# Zustand Stores
# --------------------------------------

cat > src/store/authStore.ts <<'EOF'
import {create} from 'zustand';
import {User} from '../domain/entities/User';

interface AuthState {
  user: User | null;
  login(user: User): void;
  logout(): void;
}

export const useAuthStore = create<AuthState>(
  set => ({
    user: null,
    login: user => set({user}),
    logout: () => set({user: null}),
  }),
);
EOF

cat > src/store/memberStore.ts <<'EOF'
import {create} from 'zustand';
import {Member} from '../domain/entities/Member';

interface MemberState {
  members: Member[];
  setMembers(members: Member[]): void;
  addMember(member: Member): void;
  updateMember(member: Member): void;
}

export const useMemberStore = create<MemberState>(
  set => ({
    members: [],

    setMembers: members =>
      set({members}),

    addMember: member =>
      set(state => ({
        members: [
          ...state.members,
          member,
        ],
      })),

    updateMember: member =>
      set(state => ({
        members: state.members.map(item =>
          item.id === member.id
            ? member
            : item,
        ),
      })),
  }),
);
EOF

# --------------------------------------
# Constants
# --------------------------------------

cat > src/shared/constants/app.ts <<'EOF'
export const APP_NAME = 'Gym Manager';

export const DEFAULT_CURRENCY = 'INR';

export const DEFAULT_PLANS = [
  {
    name: '1 Month',
    durationMonths: 1,
    amount: 1200,
  },
  {
    name: '3 Months',
    durationMonths: 3,
    amount: 3000,
  },
  {
    name: '6 Months',
    durationMonths: 6,
    amount: 5500,
  },
  {
    name: '1 Year',
    durationMonths: 12,
    amount: 9500,
  },
];
EOF

# --------------------------------------
# Utilities
# --------------------------------------

cat > src/shared/utils/date.ts <<'EOF'
export function addMonths(
  date: Date,
  months: number,
): Date {
  const result = new Date(date);
  const originalDay = result.getDate();

  result.setDate(1);
  result.setMonth(
    result.getMonth() + months,
  );

  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();

  result.setDate(
    Math.min(originalDay, lastDay),
  );

  return result;
}

export function isToday(
  date: Date,
): boolean {
  const now = new Date();

  return (
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate()
  );
}
EOF

cat > src/shared/utils/currency.ts <<'EOF'
export function formatCurrency(
  amount: number,
  currency = 'INR',
): string {
  return new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency,
    },
  ).format(amount);
}
EOF

# --------------------------------------
# Navigation
# --------------------------------------

cat > src/navigation/AppNavigator.tsx <<'EOF'
import React from 'react';
import {
  NavigationContainer,
} from '@react-navigation/native';

import {DashboardScreen} from '../presentation/screens/dashboard/DashboardScreen';

export function AppNavigator() {
  return (
    <NavigationContainer>
      <DashboardScreen />
    </NavigationContainer>
  );
}
EOF

# --------------------------------------
# Screens
# --------------------------------------

cat > src/presentation/screens/dashboard/DashboardScreen.tsx <<'EOF'
import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.title}>
          Gym Manager
        </Text>

        <Text style={styles.subtitle}>
          Dashboard
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 18,
  },
});
EOF

cat > src/presentation/screens/auth/LoginScreen.tsx <<'EOF'
import React from 'react';
import {
  SafeAreaView,
  Text,
} from 'react-native';

export function LoginScreen() {
  return (
    <SafeAreaView>
      <Text>Login</Text>
    </SafeAreaView>
  );
}
EOF

cat > src/presentation/screens/members/MembersScreen.tsx <<'EOF'
import React from 'react';
import {
  SafeAreaView,
  Text,
} from 'react-native';

export function MembersScreen() {
  return (
    <SafeAreaView>
      <Text>Members</Text>
    </SafeAreaView>
  );
}
EOF

cat > src/presentation/screens/members/AddMemberScreen.tsx <<'EOF'
import React from 'react';
import {
  SafeAreaView,
  Text,
} from 'react-native';

export function AddMemberScreen() {
  return (
    <SafeAreaView>
      <Text>Add Member</Text>
    </SafeAreaView>
  );
}
EOF

cat > src/presentation/screens/members/MemberDetailsScreen.tsx <<'EOF'
import React from 'react';
import {
  SafeAreaView,
  Text,
} from 'react-native';

export function MemberDetailsScreen() {
  return (
    <SafeAreaView>
      <Text>Member Details</Text>
    </SafeAreaView>
  );
}
EOF

cat > src/presentation/screens/payments/PaymentsScreen.tsx <<'EOF'
import React from 'react';
import {
  SafeAreaView,
  Text,
} from 'react-native';

export function PaymentsScreen() {
  return (
    <SafeAreaView>
      <Text>Payments</Text>
    </SafeAreaView>
  );
}
EOF

cat > src/presentation/screens/plans/PlansScreen.tsx <<'EOF'
import React from 'react';
import {
  SafeAreaView,
  Text,
} from 'react-native';

export function PlansScreen() {
  return (
    <SafeAreaView>
      <Text>Membership Plans</Text>
    </SafeAreaView>
  );
}
EOF

cat > src/presentation/screens/birthdays/BirthdaysScreen.tsx <<'EOF'
import React from 'react';
import {
  SafeAreaView,
  Text,
} from 'react-native';

export function BirthdaysScreen() {
  return (
    <SafeAreaView>
      <Text>Birthdays</Text>
    </SafeAreaView>
  );
}
EOF

cat > src/presentation/screens/staff/StaffScreen.tsx <<'EOF'
import React from 'react';
import {
  SafeAreaView,
  Text,
} from 'react-native';

export function StaffScreen() {
  return (
    <SafeAreaView>
      <Text>Staff</Text>
    </SafeAreaView>
  );
}
EOF

cat > src/presentation/screens/settings/SettingsScreen.tsx <<'EOF'
import React from 'react';
import {
  SafeAreaView,
  Text,
} from 'react-native';

export function SettingsScreen() {
  return (
    <SafeAreaView>
      <Text>Settings</Text>
    </SafeAreaView>
  );
}
EOF

cat > src/presentation/screens/settings/BackupScreen.tsx <<'EOF'
import React from 'react';
import {
  SafeAreaView,
  Text,
} from 'react-native';

export function BackupScreen() {
  return (
    <SafeAreaView>
      <Text>Backup & Restore</Text>
    </SafeAreaView>
  );
}
EOF

# --------------------------------------
# DI Container
# --------------------------------------

cat > src/di/container.ts <<'EOF'
import {SQLiteDatabase} from '../infrastructure/database/SQLiteDatabase';
import {SQLiteMemberRepository} from '../infrastructure/database/repositories/SQLiteMemberRepository';

import {AddMemberUseCase} from '../application/members/AddMember';
import {DisableMemberUseCase} from '../application/members/DisableMember';
import {EnableMemberUseCase} from '../application/members/EnableMember';
import {GetMemberDetailsUseCase} from '../application/members/GetMemberDetails';

import {IdGeneratorImpl} from '../infrastructure/storage/IdGeneratorImpl';

const database = new SQLiteDatabase();

const memberRepository =
  new SQLiteMemberRepository(database);

const idGenerator =
  new IdGeneratorImpl();

export const container = {
  database,

  repositories: {
    member: memberRepository,
  },

  useCases: {
    addMember:
      new AddMemberUseCase(
        memberRepository,
        idGenerator,
      ),

    disableMember:
      new DisableMemberUseCase(
        memberRepository,
      ),

    enableMember:
      new EnableMemberUseCase(
        memberRepository,
      ),

    getMemberDetails:
      new GetMemberDetailsUseCase(
        memberRepository,
      ),
  },
};
EOF

# --------------------------------------
# App Entry
# --------------------------------------

cat > App.tsx <<'EOF'
import React from 'react';
import {AppNavigator} from './src/navigation/AppNavigator';

export default function App() {
  return <AppNavigator />;
}
EOF

echo ""
echo "======================================"
echo "Architecture created successfully."
echo "======================================"
echo ""

find src -type f | sort

echo ""
echo "Run next:"
echo "npx tsc --noEmit"
