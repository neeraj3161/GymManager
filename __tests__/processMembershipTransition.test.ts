import { ProcessMembershipTransitionUseCase } from '../src/application/memberships/ProcessMembershipTransition';

function createTransition() {
  const renewMembership = {
    execute: jest.fn().mockResolvedValue({ id: 'new-membership' }),
  };
  const changeMembershipPlan = { execute: jest.fn() };
  const recordPayment = { execute: jest.fn() };
  const writeOffMembershipDue = { execute: jest.fn() };
  const carryForwardMembershipDue = { execute: jest.fn() };

  const transition = new ProcessMembershipTransitionUseCase(
    renewMembership as never,
    changeMembershipPlan as never,
    recordPayment as never,
    writeOffMembershipDue as never,
    carryForwardMembershipDue as never,
  );

  return {
    transition,
    recordPayment,
    renewMembership,
    changeMembershipPlan,
    carryForwardMembershipDue,
  };
}

describe('membership transition payments', () => {
  it('records the amount received against the new membership', async () => {
    const { transition, recordPayment } = createTransition();

    await transition.execute({
      memberId: 'member-1',
      planId: 'plan-1',
      planAmount: 1500,
      previousDueAction: 'none',
      recordedBy: 'staff-1',
      newMembershipPaymentAmount: 600,
      newMembershipPaymentMethod: 'upi',
    });

    expect(recordPayment.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: 'member-1',
        membershipId: 'new-membership',
        amount: 600,
        paymentMethod: 'upi',
      }),
    );
  });

  it('does not create a zero-value payment entry', async () => {
    const { transition, recordPayment } = createTransition();

    await transition.execute({
      memberId: 'member-1',
      planId: 'plan-1',
      planAmount: 1500,
      previousDueAction: 'none',
      recordedBy: 'staff-1',
      newMembershipPaymentAmount: 0,
    });

    expect(recordPayment.execute).not.toHaveBeenCalled();
  });

  it('changes the existing plan even when unused credit is disabled', async () => {
    const { transition, renewMembership, changeMembershipPlan } =
      createTransition();
    changeMembershipPlan.execute.mockResolvedValue({
      membership: { id: 'new-membership' },
      unusedDays: 0,
      unusedCredit: 0,
      finalAmount: 1500,
    });

    await transition.execute({
      memberId: 'member-1',
      planId: 'plan-1',
      planAmount: 1500,
      previousMembershipId: 'old-membership',
      previousDueAction: 'none',
      recordedBy: 'staff-1',
      transitionType: 'change_plan',
      applyUnusedCredit: false,
    });

    expect(changeMembershipPlan.execute).toHaveBeenCalledWith(
      expect.objectContaining({ applyUnusedCredit: false }),
    );
    expect(renewMembership.execute).not.toHaveBeenCalled();
  });

  it('applies credit during renewal when the credit option is enabled', async () => {
    const { transition, renewMembership, changeMembershipPlan } =
      createTransition();
    changeMembershipPlan.execute.mockResolvedValue({
      membership: { id: 'new-membership' },
      unusedDays: 5,
      unusedCredit: 250,
      finalAmount: 1250,
    });

    await transition.execute({
      memberId: 'member-1',
      planId: 'plan-1',
      planAmount: 1500,
      previousMembershipId: 'old-membership',
      previousDueAction: 'none',
      recordedBy: 'staff-1',
      transitionType: 'renew',
      applyUnusedCredit: true,
    });

    expect(changeMembershipPlan.execute).toHaveBeenCalledWith(
      expect.objectContaining({ applyUnusedCredit: true }),
    );
    expect(renewMembership.execute).not.toHaveBeenCalled();
  });

  it('records the new payment after carrying an old balance forward', async () => {
    const {
      transition,
      recordPayment,
      changeMembershipPlan,
      carryForwardMembershipDue,
    } = createTransition();
    changeMembershipPlan.execute.mockResolvedValue({
      membership: { id: 'new-membership' },
      unusedDays: 0,
      unusedCredit: 0,
      finalAmount: 1000,
    });
    carryForwardMembershipDue.execute.mockResolvedValue({ amount: 200 });

    const result = await transition.execute({
      memberId: 'member-1',
      planId: 'plan-1',
      planAmount: 1000,
      previousDue: 200,
      previousDueAction: 'carry_forward',
      previousMembershipId: 'old-membership',
      recordedBy: 'staff-1',
      applyUnusedCredit: true,
      newMembershipPaymentAmount: 100,
      newMembershipPaymentMethod: 'cash',
    });

    expect(recordPayment.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        membershipId: 'new-membership',
        amount: 100,
      }),
    );
    expect(result).toMatchObject({ finalAmount: 1100 });
  });
});
