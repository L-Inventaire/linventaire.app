import { BaseSmall, Info } from "@atoms/text";
import { Tooltip } from "@atoms/tooltip";
import { useIsSysAdmin } from "@features/admin/hooks";
import { Tenant } from "@features/admin/types";
import { formatTime } from "@features/utils/format/dates";
import { Badge, Callout } from "@radix-ui/themes";
import { formatDistance } from "date-fns";
import { ReactNode } from "react";

const DAY = 24 * 60 * 60 * 1000;

export const formatDate = (value: number | null | undefined, fallback = "-") =>
  value ? formatTime(value, { keepDate: true, hideTime: true }) : fallback;

export const LastActivity = ({ value }: { value: number | null }) => {
  if (!value) return <Info>Jamais</Info>;
  return (
    <Tooltip content={formatTime(value, { keepDate: true, keepTime: true })}>
      <span>
        {formatDistance(new Date(value), new Date(), { addSuffix: true })}
      </span>
    </Tooltip>
  );
};

export const getActivityStatus = (
  tenant: Pick<Tenant, "activity">,
): {
  key: string;
  label: string;
  color: "green" | "blue" | "orange" | "gray";
} => {
  const last = tenant.activity.last_activity_at;
  if (!last) return { key: "never", label: "Jamais utilisée", color: "gray" };
  const days = (Date.now() - last) / DAY;
  if (days <= 7) return { key: "active", label: "Active", color: "green" };
  if (days <= 30) return { key: "recent", label: "Peu active", color: "blue" };
  return { key: "inactive", label: "Inactive", color: "orange" };
};

export const ActivityStatus = ({
  tenant,
}: {
  tenant: Pick<Tenant, "activity">;
}) => {
  const status = getActivityStatus(tenant);
  return <Badge color={status.color}>{status.label}</Badge>;
};

export const StatTile = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) => (
  <div className="border border-slate-200 dark:border-slate-700 rounded-md px-4 py-3">
    <BaseSmall className="block text-gray-500">{label}</BaseSmall>
    <div className="text-xl font-semibold tabular-nums">{value}</div>
    {hint && <BaseSmall className="block text-gray-500">{hint}</BaseSmall>}
  </div>
);

// Only platform administrators (SYSADMIN role) can see these pages
export const SysAdminOnly = ({ children }: { children: ReactNode }) => {
  const isSysAdmin = useIsSysAdmin();
  if (!isSysAdmin) {
    return (
      <Callout.Root color="orange" className="mt-6 max-w-4xl mx-auto">
        <Callout.Text>
          Cette page est réservée aux administrateurs de la plateforme. Si ce
          rôle vient de vous être attribué, déconnectez-vous puis
          reconnectez-vous.
        </Callout.Text>
      </Callout.Root>
    );
  }
  return <>{children}</>;
};
