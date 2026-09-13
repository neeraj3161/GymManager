import {Member} from '../entities/Member';

export interface MemberRepository {
  getById(id: string): Promise<Member | null>;
  getAll(): Promise<Member[]>;
  getActive(): Promise<Member[]>;
  getDisabled(): Promise<Member[]>;
  save(member: Member): Promise<void>;
  update(member: Member): Promise<void>;
}
