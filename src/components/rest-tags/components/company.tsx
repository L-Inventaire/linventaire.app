import Avatar from "@atoms/avatar/avatar";
import { Tag } from "@atoms/badge/tag";
import { useClients } from "@features/clients/state/use-clients";
import { Clients } from "@features/clients/types/clients";
import { twMerge } from "tailwind-merge";

export const RestCompanyTag = ({
  size,
  id,
  company,
}: {
  size: "md" | "sm";
  id: string;
  company?: Clients;
}) => {
  if (company) {
    return <CompanyTagRender size={size} company={company} />;
  }
  return <CompanyTagServer size={size} id={id} />;
};

const CompanyTagServer = ({ size, id }: { size: "md" | "sm"; id: string }) => {
  const { clients } = useClients();
  const client = clients.find((a) => a.client_id === id);
  return <CompanyTagRender size={size} company={client?.client} />;
};

const CompanyTagRender = ({
  size,
  company,
}: {
  size: "md" | "sm";
  company?: Clients;
}) => {
  return (
    <Tag size={size} noColor className="bg-white dark:bg-slate-900 pr-1">
      <Avatar
        shape="square"
        className={twMerge("mr-1", size === "sm" ? "-ml-0.5" : "-ml-1")}
        fallback={company?.company.name || "-"}
        avatar={company?.preferences.logo}
        size={size === "sm" ? 4 : 5}
      />
      {company?.company.name || "-"}
    </Tag>
  );
};
