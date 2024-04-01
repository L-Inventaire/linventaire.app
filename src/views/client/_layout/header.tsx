import Link from "@atoms/link";
import { BaseSmall, Info, Title } from "@atoms/text";
import { ROUTES } from "@features/routes";
import { useTranslation } from "react-i18next";
import { atom, useRecoilState, useRecoilValue } from "recoil";
import { Search } from "./search";
import { MenuIcon } from "@heroicons/react/outline";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

export const LayoutTitleAtom = atom<
  {
    label?: string;
    href?: string;
    to?: string;
  }[]
>({
  key: "LayoutTitleAtom",
  default: [{}],
});

export const LayoutActionsAtom = atom<React.ReactNode | null>({
  key: "LayoutActionsAtom",
  default: null,
});

export const ResponsiveMenuAtom = atom<boolean>({
  key: "ResponsiveMenuAtom",
  default: false,
});

export const Header = () => {
  const title = useRecoilValue(LayoutTitleAtom);
  const actions = useRecoilValue(LayoutActionsAtom);
  const [menuOpen, setMenuOpen] = useRecoilState(ResponsiveMenuAtom);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <div
      className={
        "relative bg-wood-50 dark:bg-wood-950 border-b border-opacity-10 border-slate-500 lg:pt-4 flex flex-row justify-center lg:items-center px-16 sm:px-4 min-h-0 shrink-0 z-60 transition-all " +
        (menuOpen ? "pointer-events-none opacity-25 " : "opacity-100")
      }
    >
      <div
        className={
          "z-10 sm:hidden absolute transition-all h-full flex items-center justify-center left-4  "
        }
      >
        <MenuIcon
          onClick={() => setMenuOpen(true)}
          className="h-6 w-6 dark:text-white"
        />
      </div>

      <div className="lg:mr-4 transition-all text-center sm:mt-4 lg:text-left lg:mt-0 min-h-11 ">
        <div className="my-2 inline-block text-center sm:text-left lg:mr-4 relative -bottom-1 min-h-8">
          <Link to={ROUTES.Home} noColor>
            <Info className="inline">
              L'inventaire{title.length ? " / " : ""}
            </Info>
          </Link>
          {title.map((t, i) => (
            <Link to={t.to} href={t.href} noColor key={i}>
              {i === title.length - 1 ? (
                <Title className="inline">{t.label}</Title>
              ) : (
                <Info className="inline">
                  {t.label || "L'inventaire"}
                  {title.length > 1 ? " / " : ""}
                </Info>
              )}
            </Link>
          ))}
        </div>
        {actions && (
          <div className="flex my-2 lg:inline-flex space-x-2 justify-center">
            {actions}
          </div>
        )}
      </div>

      <div className="hidden lg:inline-flex grow flex items-start justify-center"></div>

      <div className="hidden lg:inline-flex flex flex-row items-center justify-center ml-4">
        <Links />
      </div>

      <div className="hidden lg:inline max-w-md w-full">
        <Search />
      </div>
    </div>
  );
};

const Links = () => {
  const { t } = useTranslation();
  return (
    <>
      <Link target="_BLANK" href="https://google.com" className="flex-row">
        <BaseSmall noColor>{t("header.guides")}</BaseSmall>
      </Link>
      <Separator />
      <Link target="_BLANK" href="mailto:" className="flex-row">
        <BaseSmall noColor>{t("header.support")}</BaseSmall>
      </Link>
      <Separator />
    </>
  );
};

const Separator = () => (
  <div className="hidden md:inline h-5 mx-4 border-solid border-r border-slate-500 opacity-25 inline-block"></div>
);
