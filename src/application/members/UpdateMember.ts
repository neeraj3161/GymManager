import { Member } from '../../domain/entities/Member';
import { MemberRepository } from '../../domain/repositories/MemberRepository';

export interface UpdateMemberInput {
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
  status: Member['status'];
  createdAt: string;
  updatedAt: string;
}

type MemberRepositoryWithPhoneLookup = MemberRepository & {
  getByPhone?: (phone: string) => Promise<Member | null>;
};

export class UpdateMemberUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(input: UpdateMemberInput): Promise<void> {
    if (!input.id) {
      throw new Error('Member ID is required.');
    }

    if (!input.firstName.trim()) {
      throw new Error('First name is required.');
    }

    if (!input.phone.trim()) {
      throw new Error('Phone number is required.');
    }

    if (input.dateOfBirth) {
      const dob = new Date(input.dateOfBirth);

      if (Number.isNaN(dob.getTime())) {
        throw new Error('Invalid date of birth.');
      }

      if (dob > new Date()) {
        throw new Error('Date of birth cannot be in the future.');
      }
    }

    const existing = await this.memberRepository.getById(input.id);

    if (!existing) {
      throw new Error('Member not found.');
    }

    const repository = this.memberRepository as MemberRepositoryWithPhoneLookup;

    if (repository.getByPhone) {
      const duplicate = await repository.getByPhone(input.phone.trim());

      if (duplicate && duplicate.id !== input.id) {
        throw new Error(
          'This phone number is already registered to another member.',
        );
      }
    }

    await this.memberRepository.update({
      ...existing,
      memberNumber: input.memberNumber,
      firstName: input.firstName.trim(),
      lastName: input.lastName?.trim() || undefined,
      phone: input.phone.trim(),
      email: input.email?.trim() || undefined,
      dateOfBirth: input.dateOfBirth,
      address: input.address?.trim() || undefined,
      gender: input.gender?.trim() || undefined,
      photoUri: input.photoUri,
      status: input.status,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    });
  }
}
