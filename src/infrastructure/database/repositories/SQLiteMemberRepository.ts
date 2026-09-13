import {MemberRepository} from '../../../domain/repositories/MemberRepository';
import {Member} from '../../../domain/entities/Member';
import {Database} from '../SQLiteDatabase';

type MemberRow = {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string | null;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  address: string | null;
  gender: string | null;
  photo_uri: string | null;
  status: 'active' | 'disabled';
  created_at: string;
  updated_at: string;
};

function toMember(row: MemberRow): Member {
  return {
    id: row.id,
    memberNumber: row.member_number,
    firstName: row.first_name,
    lastName: row.last_name ?? undefined,
    phone: row.phone,
    email: row.email ?? undefined,
    dateOfBirth: row.date_of_birth ?? undefined,
    address: row.address ?? undefined,
    gender: row.gender ?? undefined,
    photoUri: row.photo_uri ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SQLiteMemberRepository implements MemberRepository {
  constructor(private readonly database: Database) {}

  async getById(id: string): Promise<Member | null> {
    const rows = await this.database.query<MemberRow>(
      'SELECT * FROM members WHERE id = ? LIMIT 1',
      [id],
    );
    return rows[0] ? toMember(rows[0]) : null;
  }

  async getAll(): Promise<Member[]> {
    const rows = await this.database.query<MemberRow>(
      'SELECT * FROM members ORDER BY first_name, last_name',
    );
    return rows.map(toMember);
  }

  async getActive(): Promise<Member[]> {
    const rows = await this.database.query<MemberRow>(
      `SELECT * FROM members WHERE status = 'active'
       ORDER BY first_name, last_name`,
    );
    return rows.map(toMember);
  }

  async getDisabled(): Promise<Member[]> {
    const rows = await this.database.query<MemberRow>(
      `SELECT * FROM members WHERE status = 'disabled'
       ORDER BY first_name, last_name`,
    );
    return rows.map(toMember);
  }

  async save(member: Member): Promise<void> {
    await this.database.execute(
      `INSERT INTO members
       (id, member_number, first_name, last_name, phone, email, date_of_birth,
        address, gender, photo_uri, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        member.id,
        member.memberNumber,
        member.firstName,
        member.lastName ?? null,
        member.phone,
        member.email ?? null,
        member.dateOfBirth ?? null,
        member.address ?? null,
        member.gender ?? null,
        member.photoUri ?? null,
        member.status,
        member.createdAt,
        member.updatedAt,
      ],
    );
  }

  async update(member: Member): Promise<void> {
    await this.database.execute(
      `UPDATE members SET
       member_number = ?, first_name = ?, last_name = ?, phone = ?, email = ?,
       date_of_birth = ?, address = ?, gender = ?, photo_uri = ?, status = ?,
       updated_at = ?
       WHERE id = ?`,
      [
        member.memberNumber,
        member.firstName,
        member.lastName ?? null,
        member.phone,
        member.email ?? null,
        member.dateOfBirth ?? null,
        member.address ?? null,
        member.gender ?? null,
        member.photoUri ?? null,
        member.status,
        member.updatedAt,
        member.id,
      ],
    );
  }
}
