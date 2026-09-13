import {Member} from '../../domain/entities/Member';
import {MemberRepository} from '../../domain/repositories/MemberRepository';
import {IdGenerator} from '../shared/IdGenerator';

export interface AddMemberInput {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  gender?: string;
  photoUri?: string;
}

export class AddMemberUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: AddMemberInput): Promise<Member> {
    const firstName = input.firstName.trim();
    const phone = input.phone.trim();

    if (!firstName) {
      throw new Error('First name is required');
    }

    if (!phone) {
      throw new Error('Phone number is required');
    }

    const now = new Date().toISOString();

    const member: Member = {
      id: this.idGenerator.generate(),
      memberNumber: `GYM-${Date.now()}`,
      firstName,
      lastName: input.lastName?.trim(),
      phone,
      email: input.email?.trim(),
      dateOfBirth: input.dateOfBirth,
      address: input.address?.trim(),
      gender: input.gender,
      photoUri: input.photoUri,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await this.memberRepository.save(member);

    return member;
  }
}
