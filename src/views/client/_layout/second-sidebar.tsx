import { DropDownMenuType, Menu } from "@atoms/dropdown";
import { useHasAccess } from "@features/access";
import { useLocation } from "react-router-dom";
import { SettingsMenu } from "../settings/menu";
import { AccountMenu } from "../account/menu";

const isPrefix = (location: string, prefix: string) => {
  return (
    location.indexOf(prefix) === 0 ||
    ("/" + location.split("/").slice(2).join("/")).indexOf(prefix) === 0
  );
};

export const SecondSideBar = () => {
  const hasAccess = useHasAccess();
  const location = useLocation();
  const settingsMenu = SettingsMenu(hasAccess);
  const accountMenu = AccountMenu(hasAccess);

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
    <div className="sm:block hidden border-r border-slate-500 border-opacity-15 w-64 shrink-0 p-2 bg-wood-25 dark:bg-slate-950">
      <Menu menu={menu} />
    </div>
  );
};
