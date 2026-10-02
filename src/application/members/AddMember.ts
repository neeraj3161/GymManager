import { MemberRepository } from '../../domain/repositories/MemberRepository';
import { Member } from '../../domain/entities/Member';
import { parseDateOnly, startOfToday } from '../../shared/utils/date';
import { IdGenerator } from '../shared/IdGenerator';

export class DuplicateMemberPhoneError extends Error {
  constructor(readonly existingMember: Member) {
    const name = [existingMember.firstName, existingMember.lastName]
      .filter(Boolean)
      .join(' ');

    super(`This phone number is already registered to ${name}.`);
    this.name = 'DuplicateMemberPhoneError';
  }
}

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

    const phone = normalizePhone(input.phone);

    if (!phone) {
      throw new Error('Phone number is required');
    }

    const existingMember = await this.memberRepository.getByPhone(phone);

    if (existingMember) {
      throw new DuplicateMemberPhoneError(existingMember);
    }

    if (input.dateOfBirth) {
      const dob = parseDateOnly(input.dateOfBirth);

      if (!dob) {
        throw new Error('Invalid date of birth.');
      }

      const today = startOfToday();

      if (dob > today) {
        throw new Error('Date of birth cannot be in the future.');
      }
    }

    const now = new Date().toISOString();

    const member: Member = {
      id: this.idGenerator.generate(),
      memberNumber: `GYM-${Date.now()}`,

      firstName: input.firstName.trim(),
      lastName: input.lastName?.trim(),

      phone,

      email: input.email?.trim(),

      dateOfBirth: input.dateOfBirth,

      status: 'active',

      createdAt: now,
      updatedAt: now,
    };

    await this.memberRepository.save(member);

    return member;
  }
}

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  // Indian numbers:
  // 9876543210
  // 09876543210
  // 919876543210
  if (digits.length === 10) {
    return digits;
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.substring(1);
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.substring(2);
  }

  return digits;
}
