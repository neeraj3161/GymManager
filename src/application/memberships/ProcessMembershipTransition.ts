import { RecordPaymentUseCase } from '../payments/RecordPayment';
import { WriteOffMembershipDueUseCase } from '../payments/WriteOffMembershipDue';
import { CarryForwardMembershipDueUseCase } from '../payments/CarryForwardMembershipDue';
import { RenewMembershipUseCase } from './RenewMembership';
import { ChangeMembershipPlanUseCase } from './ChangeMembershipPlan';

export type PreviousDueAction =
  | 'none'
  | 'collect'
  | 'write_off'
  | 'carry_forward';

export interface ProcessMembershipTransitionInput {
  memberId: string;
  planId: string;

  previousDueAction: PreviousDueAction;

  previousMembershipId?: string;

  collectAmount?: number;
  paymentMethod?: 'cash' | 'upi' | 'card' | 'bank' | 'other';

  writeOffReason?: string;
  writeOffNotes?: string;

  applyUnusedCredit?: boolean;

  recordedBy: string;
}

export class ProcessMembershipTransitionUseCase {
  constructor(
    private readonly renewMembership: RenewMembershipUseCase,
    private readonly changeMembershipPlan: ChangeMembershipPlanUseCase,
    private readonly recordPayment: RecordPaymentUseCase,
    private readonly writeOffMembershipDue: WriteOffMembershipDueUseCase,
    private readonly carryForwardMembershipDue: CarryForwardMembershipDueUseCase,
  ) {}

  async execute(input: ProcessMembershipTransitionInput) {
    if (!input.memberId) {
      throw new Error('Member ID is required');
    }

    if (!input.planId) {
      throw new Error('Membership plan is required');
    }

    if (!input.recordedBy) {
      throw new Error('User ID is required');
    }

    /*
     * 1. Handle the previous membership's outstanding due.
     */

    if (input.previousDueAction === 'collect') {
      if (!input.previousMembershipId) {
        throw new Error('Previous membership is required');
      }

      if (!input.collectAmount || input.collectAmount <= 0) {
        throw new Error('Collection amount must be greater than zero');
      }

      if (!input.paymentMethod) {
        throw new Error('Payment method is required');
      }

      await this.recordPayment.execute({
        memberId: input.memberId,
        membershipId: input.previousMembershipId,
        amount: input.collectAmount,
        paymentMethod: input.paymentMethod,
        recordedBy: input.recordedBy,
        notes: 'Previous membership due collected',
      });
    }

    if (input.previousDueAction === 'write_off') {
      if (!input.previousMembershipId) {
        throw new Error('Previous membership is required');
      }

      if (!input.writeOffReason?.trim()) {
        throw new Error('Write-off reason is required');
      }

      await this.writeOffMembershipDue.execute({
        membershipId: input.previousMembershipId,
        createdBy: input.recordedBy,
        reason: input.writeOffReason,
        notes: input.writeOffNotes,
      });
    }

    /*
     * 2. Create the new membership.
     */

    let result;

    if (input.applyUnusedCredit) {
      result = await this.changeMembershipPlan.execute({
        memberId: input.memberId,
        newPlanId: input.planId,
        applyUnusedCredit: true,
      });
    } else {
      result = await this.renewMembership.execute({
        memberId: input.memberId,
        planId: input.planId,
      });
    }

    /*
     * 3. Carry forward previous due.
     *
     * This happens AFTER the new membership exists.
     */

    if (input.previousDueAction === 'carry_forward') {
      if (!input.previousMembershipId) {
        throw new Error('Previous membership is required');
      }

      const newMembershipId =
        'membership' in result ? result.membership.id : result.id;

      await this.carryForwardMembershipDue.execute({
        previousMembershipId: input.previousMembershipId,
        newMembershipId,
        createdBy: input.recordedBy,
      });
    }

    return result;
  }
}
