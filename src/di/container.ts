import { SQLiteDatabase } from '../infrastructure/database/SQLiteDatabase';
import { ExportDatabaseUseCase } from '../application/backup/ExportDatabase';
import { RestoreDatabaseUseCase } from '../application/backup/RestoreDatabase';
import { SQLiteBackupService } from '../infrastructure/backup/SQLiteBackupService';

// --------------------------------------------------
// Repositories
// --------------------------------------------------

import { SQLiteMemberRepository } from '../infrastructure/database/repositories/SQLiteMemberRepository';
import { SQLitePlanRepository } from '../infrastructure/database/repositories/SQLitePlanRepository';
import { SQLiteMembershipRepository } from '../infrastructure/database/repositories/SQLiteMembershipRepository';
import { SQLitePaymentRepository } from '../infrastructure/database/repositories/SQLitePaymentRepository';
import { SQLiteMembershipAdjustmentRepository } from '../infrastructure/database/repositories/SQLiteMembershipAdjustmentRepository';
import { SQLiteUserRepository } from '../infrastructure/database/repositories/SQLiteUserRepository';

// --------------------------------------------------
// Members
// --------------------------------------------------

import { AddMemberUseCase } from '../application/members/AddMember';
import { DisableMemberUseCase } from '../application/members/DisableMember';
import { EnableMemberUseCase } from '../application/members/EnableMember';
import { GetMemberDetailsUseCase } from '../application/members/GetMemberDetails';

// --------------------------------------------------
// Memberships
// --------------------------------------------------

import { CreateMembershipUseCase } from '../application/memberships/CreateMembership';
import { RenewMembershipUseCase } from '../application/memberships/RenewMembership';
import { ChangeMembershipPlanUseCase } from '../application/memberships/ChangeMembershipPlan';
import { ProcessMembershipTransitionUseCase } from '../application/memberships/ProcessMembershipTransition';

// --------------------------------------------------
// Plans
// --------------------------------------------------

import { GetPlansUseCase } from '../application/plans/GetPlans';
import { CreatePlanUseCase } from '../application/plans/CreatePlan';
import { UpdatePlanUseCase } from '../application/plans/UpdatePlan';
import { TogglePlanStatusUseCase } from '../application/plans/TogglePlanStatus';

// --------------------------------------------------
// Dashboard
// --------------------------------------------------

import { GetDashboardStatsUseCase } from '../application/dashboard/GetDashboardStats';

// --------------------------------------------------
// Payments
// --------------------------------------------------

import { RecordPaymentUseCase } from '../application/payments/RecordPayment';
import { GetPaymentHistoryUseCase } from '../application/payments/GetPaymentHistory';
import { GetTotalPaidUseCase } from '../application/payments/GetTotalPaid';
import { GetMemberFeeStatusUseCase } from '../application/payments/GetMemberFeeStatus';
import { WriteOffMembershipDueUseCase } from '../application/payments/WriteOffMembershipDue';
import { CarryForwardMembershipDueUseCase } from '../application/payments/CarryForwardMembershipDue';
import { GetMembershipDueUseCase } from '../application/payments/GetMembershipDue';

// --------------------------------------------------
// Birthdays
// --------------------------------------------------

import { GetUpcomingBirthdaysUseCase } from '../application/birthdays/GetUpcomingBirthdays';

// --------------------------------------------------
// Auth
// --------------------------------------------------

import { LoginUseCase } from '../application/auth/Login';
import { CreateOwnerUseCase } from '../application/auth/CreateOwner';

// --------------------------------------------------
// Infrastructure Services
// --------------------------------------------------

import { IdGeneratorImpl } from '../infrastructure/storage/IdGeneratorImpl';
import { BcryptPasswordHasher } from '../infrastructure/auth/BcryptPasswordHasher';

// --------------------------------------------------
// Gym Repository
// --------------------------------------------------
import { SQLiteGymRepository } from '../infrastructure/database/repositories/SQLiteGymRepository';
import { GetGymProfileUseCase } from '../application/gym/GetGymProfile';
import { UpdateGymProfileUseCase } from '../application/gym/UpdateGymProfile';

//--------------------------------------------------
//SMS Tempelate
//--------------------------------------------------
import { SQLiteSmsTemplateRepository } from '../infrastructure/database/repositories/SQLiteSmsTemplateRepository';

import { GetSmsTemplatesUseCase } from '../application/sms/GetSmsTemplates';
import { UpdateSmsTemplateUseCase } from '../application/sms/UpdateSmsTemplate';

import { GetMembersWithFeesDueUseCase } from '../application/members/GetMembersWithFeesDue';

import { SQLiteAppSettingsRepository } from '../infrastructure/database/repositories/SQLiteAppSettingsRepository';

import { GetCollectionReportUseCase } from '../application/use-cases/GetCollectionReport';

import { GetShowCollectionsSettingUseCase } from '../application/use-cases/GetShowCollectionSetting';

import { UpdateShowCollectionsSettingUseCase } from '../application/use-cases/UpdateShowCollectionsSetting';
// --------------------------------------------------
// Infrastructure
// --------------------------------------------------

const database = new SQLiteDatabase();
const backupService = new SQLiteBackupService(database);

const idGenerator = new IdGeneratorImpl();

const passwordHasher = new BcryptPasswordHasher();

// --------------------------------------------------
// Repositories
// --------------------------------------------------

const memberRepository = new SQLiteMemberRepository(database);

const planRepository = new SQLitePlanRepository(database);

const membershipRepository = new SQLiteMembershipRepository(database);

const paymentRepository = new SQLitePaymentRepository(database);

const membershipAdjustmentRepository = new SQLiteMembershipAdjustmentRepository(
  database,
);

const userRepository = new SQLiteUserRepository(database);

const gymRepository = new SQLiteGymRepository(database);

const smsTemplateRepository = new SQLiteSmsTemplateRepository(database);

// --------------------------------------------------
// Membership Use Cases
// --------------------------------------------------

const createMembershipUseCase = new CreateMembershipUseCase(
  membershipRepository,
  planRepository,
  idGenerator,
);

const renewMembershipUseCase = new RenewMembershipUseCase(
  membershipRepository,
  planRepository,
  idGenerator,
);

const changeMembershipPlanUseCase = new ChangeMembershipPlanUseCase(
  membershipRepository,
  planRepository,
  paymentRepository,
  membershipAdjustmentRepository,
  idGenerator,
);

// --------------------------------------------------
// Payment / Due Use Cases
// --------------------------------------------------

const recordPaymentUseCase = new RecordPaymentUseCase(
  paymentRepository,
  idGenerator,
);

const writeOffMembershipDueUseCase = new WriteOffMembershipDueUseCase(
  membershipRepository,
  paymentRepository,
  membershipAdjustmentRepository,
  idGenerator,
);

const carryForwardMembershipDueUseCase = new CarryForwardMembershipDueUseCase(
  membershipRepository,
  paymentRepository,
  membershipAdjustmentRepository,
  idGenerator,
);

const appSettingsRepository = new SQLiteAppSettingsRepository(database);

const getCollectionReport = new GetCollectionReportUseCase(paymentRepository);

const getShowCollectionsSetting = new GetShowCollectionsSettingUseCase(
  appSettingsRepository,
);

const updateShowCollectionsSetting = new UpdateShowCollectionsSettingUseCase(
  appSettingsRepository,
);

// --------------------------------------------------
// Membership Transition
// --------------------------------------------------

const processMembershipTransitionUseCase =
  new ProcessMembershipTransitionUseCase(
    renewMembershipUseCase,
    changeMembershipPlanUseCase,
    recordPaymentUseCase,
    writeOffMembershipDueUseCase,
    carryForwardMembershipDueUseCase,
  );

// --------------------------------------------------
// Auth Use Cases
// --------------------------------------------------

const loginUseCase = new LoginUseCase(userRepository, passwordHasher);

const createOwnerUseCase = new CreateOwnerUseCase(
  userRepository,
  passwordHasher,
  idGenerator,
);

// --------------------------------------------------
// Birthday Use Case
// --------------------------------------------------

const getUpcomingBirthdaysUseCase = new GetUpcomingBirthdaysUseCase(
  memberRepository,
);

// --------------------------------------------------
// Container
// --------------------------------------------------

export const container = {
  database,

  repositories: {
    member: memberRepository,
    plan: planRepository,
    membership: membershipRepository,
    payment: paymentRepository,
    membershipAdjustment: membershipAdjustmentRepository,
    user: userRepository,
    gym: gymRepository,
    smsTemplate: smsTemplateRepository,
    appSettings: appSettingsRepository,
  },

  useCases: {
    // ----------------------------------------------
    // Members
    // ----------------------------------------------

    addMember: new AddMemberUseCase(memberRepository, idGenerator),

    disableMember: new DisableMemberUseCase(memberRepository),

    enableMember: new EnableMemberUseCase(memberRepository),

    getMemberDetails: new GetMemberDetailsUseCase(memberRepository),

    getMembersWithFeesDue: new GetMembersWithFeesDueUseCase(database),

    // ----------------------------------------------
    // Memberships
    // ----------------------------------------------

    createMembership: createMembershipUseCase,

    renewMembership: renewMembershipUseCase,

    changeMembershipPlan: changeMembershipPlanUseCase,

    processMembershipTransition: processMembershipTransitionUseCase,

    // ----------------------------------------------
    // Plans
    // ----------------------------------------------

    getPlans: new GetPlansUseCase(planRepository),

    createPlan: new CreatePlanUseCase(planRepository, idGenerator),

    updatePlan: new UpdatePlanUseCase(planRepository),

    togglePlanStatus: new TogglePlanStatusUseCase(planRepository),

    // ----------------------------------------------
    // Dashboard
    // ----------------------------------------------

    getDashboardStats: new GetDashboardStatsUseCase(database),

    // ----------------------------------------------
    // Payments
    // ----------------------------------------------

    recordPayment: recordPaymentUseCase,

    getPaymentHistory: new GetPaymentHistoryUseCase(paymentRepository),

    getTotalPaid: new GetTotalPaidUseCase(paymentRepository),

    // ----------------------------------------------
    // Due
    // ----------------------------------------------

    writeOffMembershipDue: writeOffMembershipDueUseCase,

    carryForwardMembershipDue: carryForwardMembershipDueUseCase,

    getMembershipDue: new GetMembershipDueUseCase(
      membershipRepository,
      paymentRepository,
      membershipAdjustmentRepository,
    ),

    getMemberFeeStatus: new GetMemberFeeStatusUseCase(
      paymentRepository,
      membershipRepository,
      membershipAdjustmentRepository,
    ),

    // ----------------------------------------------
    // Birthdays
    // ----------------------------------------------

    getUpcomingBirthdays: getUpcomingBirthdaysUseCase,

    // ----------------------------------------------
    // Authentication
    // ----------------------------------------------

    login: loginUseCase,

    createOwner: createOwnerUseCase,

    // ----------------------------------------------
    // Gym Profile
    // ----------------------------------------------

    getGymProfile: new GetGymProfileUseCase(gymRepository),

    updateGymProfile: new UpdateGymProfileUseCase(gymRepository),

    // ----------------------------------------------
    // SMS Templates
    // ----------------------------------------------

    getSmsTemplates: new GetSmsTemplatesUseCase(smsTemplateRepository),

    updateSmsTemplate: new UpdateSmsTemplateUseCase(smsTemplateRepository),

    getCollectionReport,
    getShowCollectionsSetting,
    updateShowCollectionsSetting,
    exportDatabase: new ExportDatabaseUseCase(backupService),
    restoreDatabase: new RestoreDatabaseUseCase(backupService),
  },
};
