import {Membership} from '../entities/Membership';

export interface MembershipRepository {
  getById(id: string): Promise<Membership | null>;
  getByMemberId(memberId: string): Promise<Membership | null>;
  save(membership: Membership): Promise<void>;
}
