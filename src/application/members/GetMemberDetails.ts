import {Member} from '../../domain/entities/Member';
import {MemberRepository} from '../../domain/repositories/MemberRepository';

export class GetMemberDetailsUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(id: string): Promise<Member | null> {
    return this.memberRepository.getById(id);
  }
}
