import { useClientUsers } from "@features/clients/state/use-client-users";
import { formatTime } from "@features/utils/format/dates";
import { Tooltip } from "@atoms/tooltip";
import { Badge } from "@radix-ui/themes";

export const formatDate = (value: number | null | undefined, fallback = "-") =>
  value ? formatTime(value, { keepDate: true, keepTime: true }) : fallback;

export const useUserName = (clientId: string) => {
  const { users } = useClientUsers(clientId);
  return (id: string) => {
    const user = users.find((u) => u.user_id === id)?.user as any;
    return user?.full_name || user?.email || id;
  };
};

// Api keys and webhooks only work if their owner has the API_ACCESS permission
export const useUserHasApiAccess = (clientId: string) => {
  const { users } = useClientUsers(clientId);
  return (id: string) => {
    const roles = users.find((u) => u.user_id === id)?.roles?.list || [];
    // Unknown until the users are loaded
    if (!users.length) return true;
    return roles.includes("CLIENT_MANAGE") || roles.includes("API_ACCESS");
  };
};

export const SuspendedBadge = ({ label = "Suspendu" }: { label?: string }) => (
  <Tooltip content="Le propriétaire n'a pas la permission « Accès à l'API et aux webhooks »">
    <Badge color="orange">{label}</Badge>
  </Tooltip>
);

export const HttpStatus = ({ status }: { status: number | null }) => {
  if (!status) return <Badge color="gray">-</Badge>;
  return (
    <Badge color={status < 300 ? "green" : status < 500 ? "orange" : "red"}>
      {status}
    </Badge>
  );
};

export const formatSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} o` : `${(bytes / 1024).toFixed(1)} Ko`;

// Pretty prints JSON when possible (bodies are stored truncated)
export const CodeBlock = ({ value }: { value: any }) => {
  let text: string;
  if (value === null || value === undefined || value === "") {
    text = "(vide)";
  } else if (typeof value === "string") {
    try {
      text = JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      text = value;
    }
  } else {
    text = JSON.stringify(value, null, 2);
  }
  return (
    <pre className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-3 overflow-auto max-h-80 whitespace-pre-wrap break-all">
      {text}
    </pre>
  );
};
