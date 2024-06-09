import { Button } from "@atoms/button/button";
import Link from "@atoms/link";
import { Base } from "@atoms/text";
import { ROUTES } from "@features/routes";
import {
  Bars3Icon,
  BookOpenIcon,
  ComputerDesktopIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { LifebuoyIcon, MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import {
  MoonIcon as MoonIconOutline,
  SunIcon as SunIconOutline,
} from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  atom,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import { Search } from "./search";
import { DropDownAtom } from "@atoms/dropdown";
import { useTheme } from "@features/utils/theme";

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

export const ResponsiveMenuAtom = atom<boolean>({
  key: "ResponsiveMenuAtom",
  default: false,
});

export const Header = () => {
  const title = useRecoilValue(LayoutTitleAtom);
  const setMenu = useSetRecoilState(DropDownAtom);
  const { setTheme, theme } = useTheme();
  const [menuOpen, setMenuOpen] = useRecoilState(ResponsiveMenuAtom);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <div
      className={
        "relative flex flex-row justify-center lg:items-center px-16 sm:pr-2 sm:pl-0 min-h-12 shrink-0 z-60 transition-all " +
        (menuOpen ? "pointer-events-none opacity-25 " : "opacity-100")
      }
    >
      <div
        className={
          "z-10 sm:hidden absolute transition-all h-full flex items-center justify-center left-4  "
        }
      >
        <Bars3Icon
          onClick={() => setMenuOpen(true)}
          className="h-6 w-6 dark:text-white"
        />
      </div>

      <div className="transition-all text-center lg:text-left min-h-11 w-full">
        <div className="my-2 inline-block text-center sm:text-left relative -bottom-1 min-h-8">
          <Link to={ROUTES.Home} noColor>
            <Base className="inline opacity-50 font-medium">
              L'inventaire{title.length ? " / " : ""}
            </Base>
          </Link>
          {title.map((t, i) => (
            <Link to={t.to} href={t.href} noColor key={i}>
              {i === title.length - 1 ? (
                <div className="inline-flex space-x-1 items-center">
                  <Base className="inline font-semibold">{t.label}</Base>
                  <Button
                    data-tooltip="Ajouter/Retirer des favoris"
                    data-position="right"
                    className="opacity-50 -mt-0.5"
                    size="sm"
                    theme="invisible"
                    icon={(p) => <StarIcon {...p} />}
                  />
                </div>
              ) : (
                <Base className="inline opacity-50 font-medium">
                  {t.label || "L'inventaire"}
                  {title.length > 1 ? " / " : ""}
                </Base>
              )}
            </Link>
          ))}
        </div>
      </div>

      <div className="hidden lg:inline-flex flex items-start justify-center w-96 shrink-0">
        <Search />
      </div>

      <div className="hidden lg:inline w-full text-right space-x-2 mr-1">
        <Button
          data-tooltip="Support"
          data-position="left"
          className="rounded-lg"
          size="sm"
          theme="outlined"
          icon={(p) => <LifebuoyIcon {...p} />}
        />
        <Button
          data-tooltip="Guides"
          data-position="left"
          className="rounded-lg"
          size="sm"
          theme="outlined"
          icon={(p) => <BookOpenIcon {...p} />}
        />
        <Button
          data-tooltip="Mode sombre/clair"
          data-position="left"
          className="rounded-lg"
          size="sm"
          theme="outlined"
          icon={(p) =>
            theme === "dark" ? <MoonIcon {...p} /> : <SunIcon {...p} />
          }
          onClick={(e) =>
            setMenu({
              target: e.currentTarget,
              position: "bottom",
              menu: [
                {
                  label: "Mode sombre",
                  icon: (p) => <MoonIconOutline {...p} />,
                  onClick: () => setTheme("dark"),
                },
                {
                  label: "Mode clair",
                  icon: (p) => <SunIconOutline {...p} />,
                  onClick: () => setTheme("light"),
                },
                {
                  label: "Automatique",
                  icon: (p) => <ComputerDesktopIcon {...p} />,
                  onClick: () => setTheme(""),
                },
              ],
            })
          }
        />
      </div>
    </div>
  );
};
