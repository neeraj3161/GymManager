import {MemberRepository} from '../../domain/repositories/MemberRepository';
import {Member} from '../../domain/entities/Member';
import {IdGenerator} from '../shared/IdGenerator';

export interface AddMemberInput {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
}

export class AddMemberUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: AddMemberInput): Promise<Member> {
    if (!input.firstName.trim()) {
      throw new Error('First name is required');
    }

    if (!input.phone.trim()) {
      throw new Error('Phone number is required');
    }

    const now = new Date().toISOString();
    const id = this.idGenerator.generate();

    const member: Member = {
      id,
      memberNumber: `GYM-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
      firstName: input.firstName.trim(),
      lastName: input.lastName?.trim() || undefined,
      phone: input.phone.trim(),
      email: input.email?.trim() || undefined,
      dateOfBirth: input.dateOfBirth?.trim() || undefined,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await this.memberRepository.save(member);
    return member;
  }
}
