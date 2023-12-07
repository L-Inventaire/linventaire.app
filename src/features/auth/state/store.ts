import { Customer } from "@features/customers/types/customers";
import { atom } from "recoil";

export type AuthType = {
  isLoggedIn: boolean;
  //Authorization
  authorization: string;
  //Information about the user we save in the local storage
  userCached: {
    id: string;
    email: string;
    avatar: string;
    fullName: string;
  } | null;
  //Information about the user we get from the server
  user: Customer | null;
};

export const AuthState = atom<AuthType>({
  key: "AuthState",
  default: {
    isLoggedIn: false,
    authorization: JSON.parse(
      localStorage.getItem("user_authorization") || "null"
    ),
    userCached: JSON.parse(localStorage.getItem("cache_AuthState") || "null"),
    user: null,
  },
});
