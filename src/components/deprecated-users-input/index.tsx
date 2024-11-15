import Avatar from "@atoms/avatar/avatar";
import { Button } from "@atoms/button/button";
import { InputWithSuggestions } from "@atoms/input/input-with-suggestion";
import { DelayedLoader, Loader } from "@atoms/loader";
import { Info } from "@atoms/text";
import { RestUserTag } from "@components/deprecated-rest-tags/components/user";
import { getFullName } from "@features/auth/utils";
import { useClientUsers } from "@features/clients/state/use-client-users";
import { useClients } from "@features/clients/state/use-clients";
import { PublicCustomer } from "@features/customers/types/customers";
import { TrashIcon } from "@heroicons/react/24/solid";
import _ from "lodash";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

export const UsersInput = (props: {
  value: string[];
  className?: string;
  size?: "md" | "md";
  max?: number;
  onChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const { client } = useClients();
  const { users: _users, loading } = useClientUsers(client?.client_id || "");
  const users: { user: PublicCustomer; user_id: string }[] = (
    _users || []
  ).filter((u) => (u.user as PublicCustomer)?.id) as any;
  const [focused, setFocused] = useState(false);
  const selectedUsers = _.sortBy(
    (users || []).filter((user) => (props.value || []).includes(user.user_id)),
    "name"
  );

  const size = props.size || "md";

  if (loading) return <DelayedLoader />;

  return (
    <div
      className={twMerge(
        props.className,
        (selectedUsers.length || !props.disabled) && "-m-1"
      )}
    >
      {selectedUsers.map((user) => (
        <RestUserTag
          size={size}
          id={user.user_id}
          user={user.user}
          className={twMerge(
            !props.disabled ? "cursor-pointer inline-flex items-center" : "",
            "m-1 group/user",
            !props.disabled &&
              "hover:opacity-75 active:opacity-50 hover:border-red-500"
          )}
          onClick={() =>
            !props.disabled &&
            props.onChange?.(
              (props.value || []).filter((a) => a !== user.user_id)
            )
          }
          icon={
            !props.disabled ? (
              <div
                className={twMerge(
                  "-left-0.5 w-4 h-4 relative mr-0.5 overflow-hidden shrink-0"
                )}
              >
                <TrashIcon className="w-3 h-3 top-0.5 left-0.5 opacity-0 absolute group-hover/user:translate-y-0 group-hover/user:opacity-100 -translate-y-full transition-all" />
                <Avatar
                  className={twMerge(
                    "absolute group-hover/user:translate-y-full translate-y-0 transition-all"
                  )}
                  fallback={getFullName(user.user) || user.user.email || "-"}
                  avatar={user.user.avatar}
                  size={4}
                />
              </div>
            ) : undefined
          }
          key={user.user_id}
          data-tooltip={!props.disabled ? "Retirer l'utilisateur" : undefined}
        />
      ))}
      {props.disabled && !selectedUsers.length && (
        <Info>Aucun utilisateur</Info>
      )}
      {!props.disabled &&
        !focused &&
        props.value?.length < (props.max || 100) && (
          <Button
            className="align-top m-1"
            size="md"
            theme="default"
            onClick={() => setFocused(true)}
          >
            + Ajouter
          </Button>
        )}
      {!props.disabled && focused && (
        <>
          <InputWithSuggestions
            placeholder="Ajouter un utilisateur"
            autoFocus
            onBlur={() => setFocused(false)}
            size="md"
            wrapperClassName="align-top m-1 inline-block w-max"
            className="max-w-24"
            options={[
              ...(users || [])
                .filter((a) => !(props.value || []).includes(a.user_id))
                .map((a) => ({
                  label: getFullName(a.user) || a.user.email || "-",
                  value: a.user_id,
                })),
            ]}
            onSelect={async (value: string) => {
              const user = (users || [])?.find((a) => a.user_id === value);
              if (user) {
                props.onChange?.([
                  ...(props.value || []).slice(0, (props.max || 100) - 1),
                  user.user_id,
                ]);
              } else {
                setFocused(false);
              }
            }}
            render={(e) => (
              <RestUserTag
                size="md"
                id={e.value}
                className="-mx-1"
                user={(users || [])?.find((a) => a.user_id === e.value)?.user}
              />
            )}
          />
        </>
      )}
    </div>
  );
};
