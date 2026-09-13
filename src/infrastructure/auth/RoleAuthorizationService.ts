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
