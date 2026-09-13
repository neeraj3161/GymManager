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
