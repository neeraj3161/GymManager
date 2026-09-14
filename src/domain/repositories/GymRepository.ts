import { Gym } from '../entities/Gym';

export interface GymRepository {
  get(): Promise<Gym | null>;
  save(gym: Gym): Promise<void>;
  update(gym: Gym): Promise<void>;
}
