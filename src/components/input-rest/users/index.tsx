import Avatar from "@atoms/avatar/avatar";
import { Tag } from "@atoms/badge/tag";
import { InputOutlinedDefaultBorders } from "@atoms/styles/inputs";
import { FormControllerType } from "@components/form/formcontext";
import { RestDocumentsInput } from "@components/input-rest";
import { getFullName } from "@features/auth/utils";
import { useSearchUsers } from "@features/customers/configuration";
import { PublicCustomer } from "@features/customers/types/customers";
import { UserCircleIcon } from "@heroicons/react/20/solid";
import { twMerge } from "tailwind-merge";

export const UsersInput = ({
  value,
  onChange,
  size,
  max,
  withName,
  disabled,
  ...props
}: {
  size?: "sm" | "md" | "md";
  ctrl?: FormControllerType<string[] | null | never[]>;
  value?: string[];
  onChange?: (value: string[]) => void;
  max?: number;
  withName?: boolean;
  disabled?: boolean;
  "data-tooltip"?: string;
}) => {
  const searchUsers = useSearchUsers();

  return (
    <RestDocumentsInput
      disabled={disabled}
      className="rounded-full"
      entity={"users"}
      data-tooltip={props["data-tooltip"]}
      size={size}
      icon={(p: any) => <UserCircleIcon {...p} />}
      ctrl={props.ctrl}
      value={value}
      onChange={onChange}
      noWrapper
      queryFn={searchUsers}
      max={max || 10}
      render={
        ((user: PublicCustomer) => (
          <Tag
            className={twMerge(
              InputOutlinedDefaultBorders,
              "rounded-full pl-1",
              !withName && "h-7 w-7 p-0",
              !withName && size === "sm" && "h-6 w-6 p-0"
            )}
            size={size}
            data-tooltip={getFullName(user)}
          >
            <div className="flex items-center justify-center space-x-1">
              <Avatar
                fallback={getFullName(user)}
                avatar={user.avatar}
                size={size === "md" ? 5 : 4}
              />
              {withName && <span> {getFullName(user)}</span>}
            </div>
          </Tag>
        )) as any
      }
    />
  );
};
