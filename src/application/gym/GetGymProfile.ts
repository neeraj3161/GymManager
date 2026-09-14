import { Gym } from '../../domain/entities/Gym';
import { GymRepository } from '../../domain/repositories/GymRepository';

export class GetGymProfileUseCase {
  constructor(private readonly gymRepository: GymRepository) {}

  async execute(): Promise<Gym | null> {
    return this.gymRepository.get();
  }
}
