import { SQLiteDatabase } from '../infrastructure/database/SQLiteDatabase';
import { SQLiteMemberRepository } from '../infrastructure/database/repositories/SQLiteMemberRepository';
import { SQLitePlanRepository } from '../infrastructure/database/repositories/SQLitePlanRepository';
import { SQLiteMembershipRepository } from '../infrastructure/database/repositories/SQLiteMembershipRepository';
import { AddMemberUseCase } from '../application/members/AddMember';
import { DisableMemberUseCase } from '../application/members/DisableMember';
import { EnableMemberUseCase } from '../application/members/EnableMember';
import { GetMemberDetailsUseCase } from '../application/members/GetMemberDetails';
import { CreateMembershipUseCase } from '../application/memberships/CreateMembership';
import { GetPlansUseCase } from '../application/plans/GetPlans';
import { GetDashboardStatsUseCase } from '../application/dashboard/GetDashboardStats';
import { IdGeneratorImpl } from '../infrastructure/storage/IdGeneratorImpl';
import { SQLitePaymentRepository } from '../infrastructure/database/repositories/SQLitePaymentRepository';
import { RecordPaymentUseCase } from '../application/payments/RecordPayment';
import { GetPaymentHistoryUseCase } from '../application/payments/GetPaymentHistory';
import { GetTotalPaidUseCase } from '../application/payments/GetTotalPaid';
import { GetMemberFeeStatusUseCase } from '../application/payments/GetMemberFeeStatus';
import { RenewMembershipUseCase } from '../application/memberships/RenewMembership';
import { CreatePlanUseCase } from '../application/plans/CreatePlan';
import { UpdatePlanUseCase } from '../application/plans/UpdatePlan';

const database = new SQLiteDatabase();
const idGenerator = new IdGeneratorImpl();

const memberRepository = new SQLiteMemberRepository(database);
const planRepository = new SQLitePlanRepository(database);
const membershipRepository = new SQLiteMembershipRepository(database);
const paymentRepository = new SQLitePaymentRepository(database);

export const container = {
  database,

  repositories: {
    member: memberRepository,
    plan: planRepository,
    membership: membershipRepository,
    payment: paymentRepository,
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
    renewMembership: new RenewMembershipUseCase(
      membershipRepository,
      planRepository,
      idGenerator,
    ),
    getPlans: new GetPlansUseCase(planRepository),
    getDashboardStats: new GetDashboardStatsUseCase(database),
    recordPayment: new RecordPaymentUseCase(paymentRepository, idGenerator),
    getPaymentHistory: new GetPaymentHistoryUseCase(paymentRepository),

    getTotalPaid: new GetTotalPaidUseCase(paymentRepository),
    getMemberFeeStatus: new GetMemberFeeStatusUseCase(
      paymentRepository,
      membershipRepository,
    ),
    createPlan: new CreatePlanUseCase(planRepository, idGenerator),

    updatePlan: new UpdatePlanUseCase(planRepository),
  },
};
