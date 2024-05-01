import Avatar from "@atoms/avatar/avatar";
import { Tag } from "@atoms/badge/tag";
import { getFullName } from "@features/auth/utils";
import { useClientUsers } from "@features/clients/state/use-client-users";
import { useClients } from "@features/clients/state/use-clients";
import { PublicCustomer } from "@features/customers/types/customers";
import { twMerge } from "tailwind-merge";

export const RestUserTag = ({
  size,
  id,
  user,
}: {
  size: "md" | "sm";
  id: string;
  user?: PublicCustomer;
}) => {
  if (user) {
    return <UserTagRender size={size} user={user} />;
  }
  return <UserTagServer size={size} id={id} />;
};

const UserTagRender = ({
  size,
  user,
}: {
  size: "md" | "sm";
  user: PublicCustomer;
}) => {
  const name = user?.full_name ? getFullName(user) : user.email || "-";
  const avatar = user?.avatar;
  return (
    <Tag
      icon={
        <Avatar
          className={twMerge("mr-1", size === "sm" ? "-ml-0.5" : "-ml-1")}
          fallback={name}
          avatar={avatar}
          size={size === "sm" ? 4 : 5}
        />
      }
      size={size}
      noColor
      className="bg-white dark:bg-slate-900 rounded-full"
    >
      {name}
    </Tag>
  );
};

const UserTagServer = ({ size, id }: { size: "md" | "sm"; id: string }) => {
  const { client } = useClients();
  const { users } = useClientUsers(client?.client_id || "");
  const user = users.find((a) => a.user_id === id);
  return <UserTagRender size={size} user={user?.user as PublicCustomer} />;
};
