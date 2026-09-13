import {create} from 'zustand';
import {Member} from '../domain/entities/Member';

interface MemberState {
  members: Member[];
  setMembers(members: Member[]): void;
  addMember(member: Member): void;
  updateMember(member: Member): void;
}

export const useMemberStore = create<MemberState>(
  set => ({
    members: [],

    setMembers: members =>
      set({members}),

    addMember: member =>
      set(state => ({
        members: [
          ...state.members,
          member,
        ],
      })),

    updateMember: member =>
      set(state => ({
        members: state.members.map(item =>
          item.id === member.id
            ? member
            : item,
        ),
      })),
  }),
);
