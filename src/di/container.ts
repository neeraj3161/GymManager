import { SQLiteDatabase } from '../infrastructure/database/SQLiteDatabase';

import { SQLiteMemberRepository } from '../infrastructure/database/repositories/SQLiteMemberRepository';
import { SQLitePlanRepository } from '../infrastructure/database/repositories/SQLitePlanRepository';
import { SQLiteMembershipRepository } from '../infrastructure/database/repositories/SQLiteMembershipRepository';
import { SQLitePaymentRepository } from '../infrastructure/database/repositories/SQLitePaymentRepository';
import { SQLiteMembershipAdjustmentRepository } from '../infrastructure/database/repositories/SQLiteMembershipAdjustmentRepository';

import { AddMemberUseCase } from '../application/members/AddMember';
import { DisableMemberUseCase } from '../application/members/DisableMember';
import { EnableMemberUseCase } from '../application/members/EnableMember';
import { GetMemberDetailsUseCase } from '../application/members/GetMemberDetails';

import { CreateMembershipUseCase } from '../application/memberships/CreateMembership';
import { RenewMembershipUseCase } from '../application/memberships/RenewMembership';
import { ChangeMembershipPlanUseCase } from '../application/memberships/ChangeMembershipPlan';
import { ProcessMembershipTransitionUseCase } from '../application/memberships/ProcessMembershipTransition';

import { GetPlansUseCase } from '../application/plans/GetPlans';
import { CreatePlanUseCase } from '../application/plans/CreatePlan';
import { UpdatePlanUseCase } from '../application/plans/UpdatePlan';

import { GetDashboardStatsUseCase } from '../application/dashboard/GetDashboardStats';

import { RecordPaymentUseCase } from '../application/payments/RecordPayment';
import { GetPaymentHistoryUseCase } from '../application/payments/GetPaymentHistory';
import { GetTotalPaidUseCase } from '../application/payments/GetTotalPaid';
import { GetMemberFeeStatusUseCase } from '../application/payments/GetMemberFeeStatus';
import { WriteOffMembershipDueUseCase } from '../application/payments/WriteOffMembershipDue';
import { CarryForwardMembershipDueUseCase } from '../application/payments/CarryForwardMembershipDue';
import { GetMembershipDueUseCase } from '../application/payments/GetMembershipDue';

import { IdGeneratorImpl } from '../infrastructure/storage/IdGeneratorImpl';
import { SQLiteUserRepository } from '../infrastructure/database/repositories/SQLiteUserRepository';
import { BcryptPasswordHasher } from '../infrastructure/auth/BcryptPasswordHasher';
import { LoginUseCase } from '../application/auth/Login';
import { CreateOwnerUseCase } from '../application/auth/CreateOwner';

// --------------------------------------------------
// Infrastructure
// --------------------------------------------------

const database = new SQLiteDatabase();

const idGenerator = new IdGeneratorImpl();

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

const passwordHasher = new BcryptPasswordHasher();

// --------------------------------------------------
// Membership Use Cases
// --------------------------------------------------

const renewMembershipUseCase = new RenewMembershipUseCase(
  membershipRepository,
  planRepository,
  idGenerator,
);

const changeMembershipPlanUseCase = new ChangeMembershipPlanUseCase(
  membershipRepository,
  planRepository,
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
  },

  useCases: {
    // Members
    addMember: new AddMemberUseCase(memberRepository, idGenerator),

    disableMember: new DisableMemberUseCase(memberRepository),

    enableMember: new EnableMemberUseCase(memberRepository),

    getMemberDetails: new GetMemberDetailsUseCase(memberRepository),

    // Memberships
    createMembership: new CreateMembershipUseCase(
      membershipRepository,
      planRepository,
      idGenerator,
    ),

    renewMembership: renewMembershipUseCase,

    changeMembershipPlan: changeMembershipPlanUseCase,

    processMembershipTransition: processMembershipTransitionUseCase,

    // Plans
    getPlans: new GetPlansUseCase(planRepository),

    createPlan: new CreatePlanUseCase(planRepository, idGenerator),

    updatePlan: new UpdatePlanUseCase(planRepository),

    // Dashboard
    getDashboardStats: new GetDashboardStatsUseCase(database),

    // Payments
    recordPayment: recordPaymentUseCase,

    getPaymentHistory: new GetPaymentHistoryUseCase(paymentRepository),

    getTotalPaid: new GetTotalPaidUseCase(paymentRepository),

    // Due
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

    //Login
    login: new LoginUseCase(userRepository, passwordHasher),
    createOwner: new CreateOwnerUseCase(
      userRepository,
      passwordHasher,
      idGenerator,
    ),
  },
};
