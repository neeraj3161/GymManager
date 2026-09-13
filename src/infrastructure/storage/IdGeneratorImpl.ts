import {IdGenerator} from '../../application/shared/IdGenerator';

export class IdGeneratorImpl implements IdGenerator {
  generate(): string {
    return `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .substring(2, 14)}-${Math.random()
      .toString(36)
      .substring(2, 14)}`;
  }
}