import Link from "@atoms/link";
import { ROUTES } from "@features/routes";
import {
  AdjustmentsIcon,
  ChartSquareBarIcon,
  ClockIcon,
  DocumentIcon,
  DownloadIcon,
  InboxIcon,
  ShoppingCartIcon,
  TagIcon,
  UserIcon,
  ViewBoardsIcon,
  ViewGridIcon,
} from "@heroicons/react/outline";
import SimpleBar from "simplebar-react";

export const SideBar = () => {
  return (
    <div className="hidden sm:block bg-wood-50 w-20 overflow-hidden ">
      <SimpleBar style={{ maxHeight: "100%" }}>
        <div className="w-20 h-16 mt-4 flex items-center justify-center">
          <Logo />
        </div>
        <MenuItem icon={(p) => <ViewGridIcon {...p} />} />
        <MenuItem icon={(p) => <InboxIcon {...p} />} />
        <MenuItem icon={(p) => <UserIcon {...p} />} />
        <MenuItem active icon={(p) => <DocumentIcon {...p} />} />
        <MenuItem icon={(p) => <ShoppingCartIcon {...p} />} />
        <MenuItem icon={(p) => <DownloadIcon {...p} />} />
        <MenuItem icon={(p) => <ViewBoardsIcon {...p} />} />
        <MenuItem icon={(p) => <ClockIcon {...p} />} />
        <MenuItem icon={(p) => <TagIcon {...p} />} />
        <MenuItem icon={(p) => <ChartSquareBarIcon {...p} />} />
        <MenuItem icon={(p) => <AdjustmentsIcon {...p} />} />
      </SimpleBar>
    </div>
  );
};

const MenuItem = ({
  active,
  icon,
  className,
}: {
  active?: boolean;
  className?: string;
  icon: (p: any) => React.ReactNode;
}) => {
  return (
    <div
      className={
        "inline-flex items-center justify-center w-20 h-16 " + (className || "")
      }
    >
      <div
        className={
          "cursor-pointer w-12 h-12 flex items-center justify-center hover:bg-wood-100 rounded-lg " +
          (active ? "bg-wood-100 " : "opacity-75 hover:opacity-100 ")
        }
      >
        {icon({
          className: "w-7 h-7 text-slate-900 dark:text-slate-100 ",
        })}
      </div>
    </div>
  );
};

const Logo = () => (
  <Link to={ROUTES.Home} noColor className="flex-row items-center mx-auto flex">
    <img
      src="/medias/logo-black.svg"
      className="dark:hidden block h-7"
      alt="L'inventaire"
    />
    <img
      src="/medias/logo.svg"
      className="dark:block hidden h-7"
      alt="L'inventaire"
    />
  </Link>
);
