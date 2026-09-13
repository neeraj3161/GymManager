import {MemberRepository} from '../../domain/repositories/MemberRepository';

export class DisableMemberUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const member = await this.memberRepository.getById(id);

    if (!member) {
      throw new Error('Member not found');
    }

    await this.memberRepository.update({
      ...member,
      status: 'disabled',
      updatedAt: new Date().toISOString(),
    });
  }
}
