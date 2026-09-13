export type MemberStatus = 'active' | 'disabled';

export interface Member {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  gender?: string;
  photoUri?: string;
  status: MemberStatus;
  createdAt: string;
  updatedAt: string;
}
