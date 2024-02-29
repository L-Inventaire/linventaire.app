import { atom, atomFamily } from "recoil";
import { ClientsUserWithUser, ClientsUsers } from "../types/clients";

export const ClientsState = atom<ClientsUsers[]>({
  key: "ClientsState",
  default: [],
});

export const ClientInvitationsState = atom<ClientsUsers[]>({
  key: "ClientInvitationsState",
  default: [],
});

export const ClientUsersState = atomFamily<ClientsUserWithUser[], string>({
  key: "ClientUsersState",
  default: [],
});

export const DidCreateCompanyOrSignupAtom = atom<boolean>({
  key: "DidCreateCompanyOrSignupAtom",
  default: false,
});
