export interface Database {
  execute(
    query: string,
    params?: unknown[],
  ): Promise<void>;

  query<T>(
    query: string,
    params?: unknown[],
  ): Promise<T[]>;

  transaction(
    callback: () => Promise<void>,
  ): Promise<void>;
}

export class SQLiteDatabase implements Database {
  async execute(
    _query: string,
    _params: unknown[] = [],
  ): Promise<void> {
    throw new Error(
      'SQLiteDatabase has not been configured yet.',
    );
  }

  async query<T>(
    _query: string,
    _params: unknown[] = [],
  ): Promise<T[]> {
    throw new Error(
      'SQLiteDatabase has not been configured yet.',
    );
  }

  async transaction(
    _callback: () => Promise<void>,
  ): Promise<void> {
    throw new Error(
      'SQLiteDatabase has not been configured yet.',
    );
  }
}
