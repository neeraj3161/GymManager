import { MemberRepository } from '../../domain/repositories/MemberRepository';

export class DeleteMemberUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(id: string): Promise<void> {
    const member = await this.memberRepository.getById(id);

    if (!member) {
      throw new Error('Member not found');
    }

    await this.memberRepository.delete(id);
  }
}
