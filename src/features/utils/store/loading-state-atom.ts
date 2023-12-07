import { atomFamily } from "recoil";

export const LoadingState = atomFamily({
  key: "LoadingState",
  //It is possible to set here what loaders should init as loading
  default: (type: string) => ["useAuth"].includes(type) || false,
});
