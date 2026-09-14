import { Gym } from '../../domain/entities/Gym';
import { GymRepository } from '../../domain/repositories/GymRepository';

export interface UpdateGymProfileInput {
  name: string;
  logoUri?: string;
  phone?: string;
  email?: string;
  address?: string;
  currency?: string;
}

export class UpdateGymProfileUseCase {
  constructor(private readonly gymRepository: GymRepository) {}

  async execute(input: UpdateGymProfileInput): Promise<Gym> {
    const existingGym = await this.gymRepository.get();

    if (!existingGym) {
      throw new Error('Gym profile not found');
    }

    const name = input.name.trim();

    if (!name) {
      throw new Error('Gym name is required');
    }

    const currency = input.currency?.trim() || existingGym.currency;

    const updatedGym: Gym = {
      ...existingGym,
      name,
      logoUri: input.logoUri?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      email: input.email?.trim() || undefined,
      address: input.address?.trim() || undefined,
      currency,
      updatedAt: new Date().toISOString(),
    };

    await this.gymRepository.update(updatedGym);

    return updatedGym;
  }
}
