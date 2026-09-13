import {SQLiteDatabase} from '../infrastructure/database/SQLiteDatabase';
import {SQLiteMemberRepository} from '../infrastructure/database/repositories/SQLiteMemberRepository';

import {AddMemberUseCase} from '../application/members/AddMember';
import {DisableMemberUseCase} from '../application/members/DisableMember';
import {EnableMemberUseCase} from '../application/members/EnableMember';
import {GetMemberDetailsUseCase} from '../application/members/GetMemberDetails';

import {IdGeneratorImpl} from '../infrastructure/storage/IdGeneratorImpl';

const database = new SQLiteDatabase();

const memberRepository =
  new SQLiteMemberRepository(database);

const idGenerator =
  new IdGeneratorImpl();

export const container = {
  database,

  repositories: {
    member: memberRepository,
  },

  useCases: {
    addMember:
      new AddMemberUseCase(
        memberRepository,
        idGenerator,
      ),

    disableMember:
      new DisableMemberUseCase(
        memberRepository,
      ),

    enableMember:
      new EnableMemberUseCase(
        memberRepository,
      ),

    getMemberDetails:
      new GetMemberDetailsUseCase(
        memberRepository,
      ),
  },
};
