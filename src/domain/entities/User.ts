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
