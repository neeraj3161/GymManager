import {IdGenerator} from '../../application/shared/IdGenerator';

export class IdGeneratorImpl implements IdGenerator {
  generate(): string {
    return `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 11)}`;
  }
}
