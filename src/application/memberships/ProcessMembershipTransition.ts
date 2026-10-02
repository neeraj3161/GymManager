import { RecordPaymentUseCase } from '../payments/RecordPayment';
import { WriteOffMembershipDueUseCase } from '../payments/WriteOffMembershipDue';
import { CarryForwardMembershipDueUseCase } from '../payments/CarryForwardMembershipDue';
import { RenewMembershipUseCase } from './RenewMembership';
import { ChangeMembershipPlanUseCase } from './ChangeMembershipPlan';
import type { PaymentMethod } from '../../domain/entities/Payment';

export type PreviousDueAction =
  | 'none'
  | 'collect'
  | 'write_off'
  | 'carry_forward';
export type MembershipTransitionType = 'change_plan' | 'renew';

export interface ProcessMembershipTransitionInput {
  memberId: string;
  planId: string;
  planAmount?: number;

  previousDue?: number;
  previousDueAction: PreviousDueAction;

  previousMembershipId?: string;

  collectAmount?: number;
  paymentMethod?: 'cash' | 'upi' | 'card' | 'bank' | 'other';
  newMembershipPaymentAmount?: number;
  newMembershipPaymentMethod?: PaymentMethod;

  writeOffReason?: string;
  writeOffNotes?: string;

  applyUnusedCredit?: boolean;
  previousMembershipFullyPaid?: boolean;
  transitionType?: MembershipTransitionType;

  recordedBy: string;
  startDate?: string;
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

    const newMembershipPaymentAmount = input.newMembershipPaymentAmount ?? 0;

    if (
      !Number.isFinite(newMembershipPaymentAmount) ||
      newMembershipPaymentAmount < 0
    ) {
      throw new Error('Payment amount must be zero or greater');
    }

    if (newMembershipPaymentAmount > 0 && !input.newMembershipPaymentMethod) {
      throw new Error(
        'Payment method is required for the new membership payment',
      );
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

      const maxCollectable = input.previousDue ?? input.collectAmount;

      if (input.collectAmount > maxCollectable) {
        throw new Error('Collection amount cannot exceed the outstanding due.');
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

    if (input.transitionType === 'change_plan' || input.applyUnusedCredit) {
      result = await this.changeMembershipPlan.execute({
        memberId: input.memberId,
        newPlanId: input.planId,
        amount: input.planAmount,
        applyUnusedCredit: input.applyUnusedCredit ?? true,
        previousMembershipFullyPaid: input.previousMembershipFullyPaid,
        startDate: input.startDate,
      });
    } else {
      result = await this.renewMembership.execute({
        memberId: input.memberId,
        planId: input.planId,
        amount: input.planAmount,
        startDate: input.startDate,
      });
    }

    /*
     * 3. Carry forward previous due.
     *
     * This happens AFTER the new membership exists.
     */

    const newMembershipId =
      'membership' in result ? result.membership.id : result.id;
    let newMembershipBalance =
      'finalAmount' in result ? result.finalAmount : input.planAmount ?? 0;

    if (
      input.previousDueAction === 'carry_forward' ||
      (input.previousDueAction === 'collect' && input.previousDue)
    ) {
      if (!input.previousMembershipId) {
        throw new Error('Previous membership is required');
      }

      const previousDueAmount = input.previousDue ?? 0;

      const transferAmount =
        input.previousDueAction === 'carry_forward'
          ? previousDueAmount
          : Math.max(previousDueAmount - (input.collectAmount ?? 0), 0);

      if (transferAmount > 0) {
        const transferIn = await this.carryForwardMembershipDue.execute({
          previousMembershipId: input.previousMembershipId,
          newMembershipId,
          createdBy: input.recordedBy,
          amount: transferAmount,
        });
        newMembershipBalance += transferIn.amount;

        if ('finalAmount' in result) {
          result = {
            ...result,
            finalAmount: newMembershipBalance,
          };
        }
      }
    }

    if (newMembershipPaymentAmount > newMembershipBalance) {
      throw new Error('Payment amount cannot exceed the amount due.');
    }

    if (newMembershipPaymentAmount > 0) {
      await this.recordPayment.execute({
        memberId: input.memberId,
        membershipId: newMembershipId,
        amount: newMembershipPaymentAmount,
        paymentMethod: input.newMembershipPaymentMethod!,
        recordedBy: input.recordedBy,
        notes: 'Payment received during membership plan change',
      });

      if ('finalAmount' in result) {
        result = {
          ...result,
          finalAmount: Math.max(
            newMembershipBalance - newMembershipPaymentAmount,
            0,
          ),
        };
      }
    }

    return result;
  }
}
