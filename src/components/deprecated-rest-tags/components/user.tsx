import Avatar from "@atoms/avatar/avatar";
import { Tag } from "@atoms/badge/tag";
import { getFullName } from "@features/auth/utils";
import { useClientUsers } from "@features/clients/state/use-client-users";
import { useClients } from "@features/clients/state/use-clients";
import { PublicCustomer } from "@features/customers/types/customers";
import { getServerUri } from "@features/utils/format/strings";
import { twMerge } from "tailwind-merge";

export const RestUserTag = ({
  size,
  id,
  user,
  ...props
}: {
  size: "md" | "md";
  id: string;
  user?: PublicCustomer;
  dataTooltip?: string;
  className?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  heads?: boolean;
}) => {
  if (user) {
    return <UserTagRender {...props} size={size} user={user} />;
  }
  return <UserTagServer {...props} size={size} id={id} />;
};

const UserTagRender = ({
  size,
  user,
  icon,
  ...props
}: {
  size: "md" | "md";
  user: PublicCustomer;
  dataTooltip?: string;
  className?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  heads?: boolean;
}) => {
  if (!user) return null;

  const name = user?.full_name ? getFullName(user) : user.email || "-";
  const avatar = user?.avatar;
  return (
    <Tag
      icon={
        icon ? (
          icon
        ) : (
          <Avatar
            className={twMerge("mr-1", size === "md" ? "-ml-0.5" : "-ml-1")}
            fallback={name}
            avatar={getServerUri(avatar)}
            size={size === "md" ? 4 : 5}
          />
        )
      }
      size={size}
      noColor
      {...props}
      className={twMerge(
        "bg-white dark:bg-slate-900 rounded-full",
        props.heads && "pr-0 text-[0px]",
        props.className
      )}
    >
      {name}
    </Tag>
  );
};

const UserTagServer = ({
  size,
  id,
  ...props
}: {
  size: "md" | "md";
  id: string;
  dataTooltip?: string;
  className?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}) => {
  const { client } = useClients();
  const { users } = useClientUsers(client?.client_id || "");
  const user = users.find((a) => a.user_id === id);
  return (
    <UserTagRender size={size} user={user?.user as PublicCustomer} {...props} />
  );
};
