# Gym Manager Usage Guide

This guide covers the main workflows available in the Gym Manager app. Screen names below match the labels shown in the app.

## First-Time Setup and Sign-In

1. On first launch, create the owner account and enter the gym name. Owner name, username, password, and confirmation are required. Phone, email, and address are optional.
2. On later launches, sign in with the saved username and password.
3. To sign out, open **Settings** and tap **Log out**.

## Recommended Setup

Before adding members, create the plans your gym offers:

1. Open **Plans** from the Dashboard shortcut or Settings.
2. Tap **Add** and enter a plan name, duration in whole months, price, and optional description.
3. Save the plan. Only active plans can be assigned to new memberships.

You can edit a plan later. Disabling a plan prevents it from being selected for new memberships; it does not change existing memberships.

## Dashboard

The Dashboard summarizes member counts, fees due, memberships that are expired or expiring soon, and birthdays today. Tap a card to open the related member list. Use the shortcuts to open Members, Add Member, Payments Received, or Plans. Pull down to refresh the dashboard.

To show monthly and yearly payment totals on the Dashboard, open **Settings** and enable **Show Collections on Dashboard**.

## Add a Member

1. Tap **+** on the Dashboard or **+ Add** in Members.
2. Enter the member's first name, phone number, and date of birth. The app requires these details; last name and contact details such as email are optional.
3. Select an active membership plan. The plan amount can be edited for this member.
4. Enter a start date in `YYYY-MM-DD` format. The calculated membership end date appears below the field.
5. Enter the amount actually received today. It starts at ₹0. Use **Full amount** to fill in the membership price, or enter a partial payment. Choose the payment method.
6. Tap **Add member**.

The remaining due is the membership amount minus the initial payment. A zero payment is not saved as a payment transaction.

## Find and Manage Members

Open **Members** to search by name, phone number, or member number. Use the filters for all, active, disabled, and fees due. The Dashboard also links directly to expired/expiring members and birthdays.

Tap a member to open **Member Details**. The screen shows their membership dates and price, fee status, amount taken, payment history, and contact details. From here you can edit member details, record a payment, renew or change the membership plan, disable or enable the member, or delete the member.

In the Fees Due and Expired / Expiring lists, long-press a member to open reminder actions. Call, SMS, and WhatsApp actions open the corresponding phone app; review the message or call in that app before sending.

## Record a Payment

1. Open the member's details and tap **Record Payment**.
2. Enter the amount received and select the payment method. Add optional notes if useful.
3. Tap the record/save action.

Payments must be greater than zero and cannot exceed the current membership's remaining balance. Payment History lists actual payment transactions.

## Renew or Change a Membership

Open the member's details and choose **Renew Membership** or **Change Plan**. Select the plan, review or edit its amount, and choose when the membership starts: the previous plan end date, today, or a custom date entered as `YYYY-MM-DD`.

If an unused-credit option is available, turn it on to apply eligible credit or leave it off. The summary updates to show the resulting amount.

When there is a previous outstanding balance, the default action is **Carry Forward**. You can instead choose **Collect** or **Write Off**. Collection records a payment against the previous membership; write-off requires a reason. Review the summary before confirming.

**Plan price and amount received are different:** the plan amount is the membership charge, not proof of payment. In Change Plan, use **Amount received now** to record money collected for the new membership; leave it at ₹0 if nothing was received. The Renew screen currently has no separate new-plan payment field, so use **Record Payment** after renewal to record a payment for the renewed membership.

## Birthdays

Open **Birthdays** from the Dashboard to see active members with birthdays in the next 30 days. Tap **Contact** to call the member, open an SMS draft, or open WhatsApp with a birthday message. The message is not sent until you send it from the other app.

## Payments Received and Collection Reports

The Dashboard's **Payments** shortcut opens **Payments Received**, which lists recorded cash/payment transactions. Write-offs and other balance adjustments are not cash payments and do not increase the collected total.

To download a report, open **Settings** and choose **Download Monthly Collection** or **Download Yearly Collection**. The PDF lists payment transactions and adjustment transactions, including write-offs, carry-forwards, and membership credits. **Total Collected** counts actual payments only; adjustments are listed separately. Save or share the generated PDF using the system document/share prompt.

## Settings and Data Safety

- **Gym profile:** Edit the gym name, phone, email, address, and currency, then save.
- **Collections:** Control whether monthly and yearly received-payment totals appear on the Dashboard.
- **Check for updates:** Check for a newer app version. The update manifest URL is an advanced setting; leave it unchanged unless your administrator provides a replacement.
- **Backup & Restore:** Export the complete database as a `.sql` file. A full backup restore replaces the local database. A members-only SQL import adds member records and leaves matching existing records unchanged. Confirm the selected file and restore mode carefully; make a backup before restoring.

## Staff Screen

The Staff screen currently displays sample roles. Adding or managing staff accounts is not available yet; the **Add** button is a placeholder.
