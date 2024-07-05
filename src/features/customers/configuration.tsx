import { getFullName } from "@features/auth/utils";
import { useClientUsers } from "@features/clients/state/use-client-users";
import { useCurrentClient } from "@features/clients/state/use-clients";
import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES, getRoute } from "@features/routes";
import { Customer, PublicCustomer } from "./types/customers";
import Fuse from "fuse.js";
import Avatar from "@atoms/avatar/avatar";
import { Info } from "@atoms/text";
import { validateEmail } from "@features/utils/format/strings";
import { useNavigate } from "react-router-dom";

export const useUsersDefaultModel: () => Partial<Customer> = () => ({});

export const useCustomersConfiguration = () => {
  const { id } = useCurrentClient();
  const { users: source } = useClientUsers(id!);
  const navigate = useNavigate();

  const users = source
    .filter((a: any) => a.user?.id)
    .map((user) => user.user as PublicCustomer);

  registerCtrlKRestEntity<PublicCustomer>("users", {
    onCreate: (query) => ({
      callback: async (a) => navigate(getRoute(ROUTES.SettingsUsers)),
      label: validateEmail(query) ? `Inviter "${query}"` : "",
    }),
    resultList: async (query) => {
      const list = query
        ? new Fuse(users, {
            includeScore: true,
            threshold: 0.6,
            keys: ["email", "full_name"],
          })
            .search(query)
            .map((a: any) => a.item)
        : users;

      return { total: list.length, list };
    },
    renderResult: (item) => (
      <div className="flex items-center space-x-2">
        <Avatar fallback={getFullName(item)} avatar={item.avatar} size={5} />
        <span> {getFullName(item)}</span>
        <Info>{item.email}</Info>
      </div>
    ),
    viewRoute: ROUTES.SettingsUsers,
  });
};
