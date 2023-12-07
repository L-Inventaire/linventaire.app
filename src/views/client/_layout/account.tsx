import Avatar from "@atoms/avatar/avatar";
import Link from "@atoms/link";
import { BaseSmall } from "@atoms/text";
import { useAuth } from "@features/auth/state/use-auth";
import { ChevronDownIcon } from "@heroicons/react/outline";
import { useSetRecoilState } from "recoil";
import { AccountModalAtom } from "../account/modal";

export const Account = () => {
  const { user } = useAuth();
  const setAccountModal = useSetRecoilState(AccountModalAtom);
  return (
    <div className="relative flex items-center">
      <Link
        onClick={() => setAccountModal(true)}
        noColor
        className="inline-flex flex-row items-center"
      >
        <Avatar
          size={8}
          avatar={user?.preferences.avatar}
          fallback={user?.full_name}
          className="h-8 w-8 mr-1 md:mr-2 shrink-0"
        />
        <BaseSmall
          noColor
          className="hidden sm:block mr-1 md:mr-2"
          onClick={() => setAccountModal(true)}
        >
          {user?.full_name}
        </BaseSmall>
        <ChevronDownIcon
          className="h-4 w-4"
          onClick={() => setAccountModal(true)}
        />
      </Link>
    </div>
  );
};
