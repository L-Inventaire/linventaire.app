import environment from "@config/environment";
import { Customer, PublicCustomer } from "@features/customers/types/customers";

export const getFullName = (user: Customer | PublicCustomer) => {
  return user.full_name;
};

export const getAvatarFullUrl = (src?: string) => {
  if (!src) return null;
  if (src.startsWith("http") || src.startsWith("data:image")) return src;
  return environment.server.replace(/\/$/, "") + src;
};
