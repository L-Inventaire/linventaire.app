import { atom, atomFamily } from "recoil";
import { MethodType } from "../api-client/mfa-api-client";
import { PublicCustomer } from "../types/customers";

export const CustomerMfaState = atom<MethodType[]>({
  key: "CustomerMfaState",
  default: [],
});

export const PublicCustomerAtom = atomFamily<PublicCustomer | null, string>({
  key: "PublicCustomerAtom",
  default: null,
});

export const PublicCustomersAtom = atomFamily<
  PublicCustomer[] | null,
  string[]
>({
  key: "PublicCustomersAtom",
  default: null,
});
