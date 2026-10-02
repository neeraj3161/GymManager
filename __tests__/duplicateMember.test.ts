import {
  AddMemberUseCase,
  DuplicateMemberPhoneError,
} from '../src/application/members/AddMember';
import { Member } from '../src/domain/entities/Member';
import { MemberRepository } from '../src/domain/repositories/MemberRepository';
import { SQLiteMemberRepository } from '../src/infrastructure/database/repositories/SQLiteMemberRepository';
import { Database } from '../src/infrastructure/database/SQLiteDatabase';

const existingMember: Member = {
  id: 'member-1',
  memberNumber: 'GYM-1',
  firstName: 'Asha',
  lastName: 'Kumar',
  phone: '9876543210',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('duplicate member phone handling', () => {
  it('maps the phone lookup row into a domain member', async () => {
    const database = {
      query: jest.fn().mockResolvedValue([
        {
          id: existingMember.id,
          member_number: existingMember.memberNumber,
          first_name: existingMember.firstName,
          last_name: existingMember.lastName,
          phone: existingMember.phone,
          email: null,
          date_of_birth: null,
          address: null,
          gender: null,
          photo_uri: null,
          status: 'active',
          created_at: existingMember.createdAt,
          updated_at: existingMember.updatedAt,
        },
      ]),
    } as unknown as Database;

    await expect(
      new SQLiteMemberRepository(database).getByPhone(existingMember.phone),
    ).resolves.toMatchObject(existingMember);
  });

  it('includes the existing member in the duplicate-phone error', async () => {
    const repository = {
      getByPhone: jest.fn().mockResolvedValue(existingMember),
    } as unknown as MemberRepository;
    const useCase = new AddMemberUseCase(repository, {
      generate: () => 'new-member-id',
    });

    await expect(
      useCase.execute({ firstName: 'Asha', phone: existingMember.phone }),
    ).rejects.toMatchObject({
      name: 'DuplicateMemberPhoneError',
      message: 'This phone number is already registered to Asha Kumar.',
      existingMember,
    } satisfies Partial<DuplicateMemberPhoneError>);
  });
});
