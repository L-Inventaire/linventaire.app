import { DropDownMenuType, Menu } from "@atoms/dropdown";
import { useHasAccess } from "@features/access";
import { ScrollArea } from "@radix-ui/themes";
import { useLocation } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { useAccountMenu } from "../account/menu";
import { useSettingsMenu } from "../settings/menu";
import { ResponsiveMenuAtom } from "./header";

const isPrefix = (location: string, prefix: string) => {
  return (
    location.indexOf(prefix) === 0 ||
    ("/" + location.split("/").slice(2).join("/")).indexOf(prefix) === 0
  );
};

export const SecondSideBar = () => {
  const hasAccess = useHasAccess();
  const location = useLocation();
  const settingsMenu = useSettingsMenu(hasAccess);
  const accountMenu = useAccountMenu(hasAccess);
  const menuOpen = useRecoilValue(ResponsiveMenuAtom);

  let menu: DropDownMenuType = [];

  if (isPrefix(location.pathname, settingsMenu.prefix)) {
    menu = settingsMenu.menu;
  }

  if (isPrefix(location.pathname, accountMenu.prefix)) {
    menu = accountMenu.menu;
  }

  if (menu.length === 0) {
    return <></>;
  }

  return (
    <div
      className="w-0 sm:w-64 shrink-0 flex"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={
          "sm:translate-x-0 z-10 absolute sm:relative top-0 h-full transition-all border-r border-slate-500 border-opacity-15 w-64 grow shrink-0 bg-white dark:bg-slate-900 " +
          (menuOpen
            ? " translate-x-0 bg-white border-l "
            : " -translate-x-full ")
        }
      >
        <ScrollArea>
          <div className="p-2">
            <Menu menu={menu} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
