import { Member } from '../../domain/entities/Member';
import { MemberRepository } from '../../domain/repositories/MemberRepository';

export interface BirthdayMember {
  member: Member;
  birthday: Date;
  age: number;
  daysUntil: number;
}

export class GetUpcomingBirthdaysUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(daysAhead: number = 30): Promise<BirthdayMember[]> {
    const members = await this.memberRepository.getActive();

    const today = new Date();

    // Remove time so birthday comparisons are date-only.
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const results: BirthdayMember[] = [];

    for (const member of members) {
      if (!member.dateOfBirth) {
        continue;
      }

      const birthDate = new Date(member.dateOfBirth);

      if (Number.isNaN(birthDate.getTime())) {
        continue;
      }

      let birthday = new Date(
        todayDate.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate(),
      );

      // If this year's birthday has already passed,
      // use next year's birthday.
      if (birthday < todayDate) {
        birthday = new Date(
          todayDate.getFullYear() + 1,
          birthDate.getMonth(),
          birthDate.getDate(),
        );
      }

      const millisecondsPerDay = 24 * 60 * 60 * 1000;

      const daysUntil = Math.round(
        (birthday.getTime() - todayDate.getTime()) / millisecondsPerDay,
      );

      if (daysUntil > daysAhead) {
        continue;
      }

      let age = birthday.getFullYear() - birthDate.getFullYear();

      results.push({
        member,
        birthday,
        age,
        daysUntil,
      });
    }

    results.sort((a, b) => {
      if (a.daysUntil !== b.daysUntil) {
        return a.daysUntil - b.daysUntil;
      }

      return a.member.firstName.localeCompare(b.member.firstName);
    });

    return results;
  }
}
