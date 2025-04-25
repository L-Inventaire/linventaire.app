import { atom } from "recoil";
import { ClientsUsers } from "../types/clients";

export const ClientsState = atom<ClientsUsers[]>({
  key: "ClientsState",
  default: [],
});

export const ClientInvitationsState = atom<ClientsUsers[]>({
  key: "ClientInvitationsState",
  default: [],
});

export const DidCreateCompanyOrSignupAtom = atom<boolean>({
  key: "DidCreateCompanyOrSignupAtom",
  default: false,
});
