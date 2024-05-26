import { DropDownAtom, DropDownMenuType } from "@atoms/dropdown";
import Link from "@atoms/link";
import Env from "@config/environment";
import { useHasAccess } from "@features/access";
import { ROUTES, getRoute } from "@features/routes";
import { DefaultScrollbars } from "@features/utils/scrollbars";
import { Shortcut, useShortcuts } from "@features/utils/shortcuts";
import {
  AdjustmentsIcon,
  ChartSquareBarIcon,
  ClockIcon,
  CubeIcon,
  DocumentIcon,
  DownloadIcon,
  InboxIcon,
  PlusIcon,
  ShoppingCartIcon,
  UserIcon,
  ViewBoardsIcon,
  ViewGridIcon,
} from "@heroicons/react/outline";
import { StarIcon } from "@heroicons/react/solid";
import { useLocation, useNavigate } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { Account } from "./account";
import { ResponsiveMenuAtom } from "./header";

export const SideBar = () => {
  const hasAccess = useHasAccess();
  const menuOpen = useRecoilValue(ResponsiveMenuAtom);

  return (
    <div
      className={
        "print:hidden sm:translate-x-0 z-10 py-2 sm:border-none border-r dark:border-r-950 transition-all sm:block w-20 overflow-hidden fixed h-screen " +
        (menuOpen ? " translate-x-0 " : " -translate-x-full ")
      }
    >
      <DefaultScrollbars>
        {/* Space for avatar */}
        <div className="h-16" />

        <MenuItem
          to={getRoute(ROUTES.Home)}
          icon={(p) => <ViewGridIcon {...p} />}
          menu={[
            {
              label: "Tableau de bord",
              to: getRoute(ROUTES.Home),
            },
          ]}
        />
        <MenuItem
          to={getRoute(ROUTES.Notifications)}
          icon={(p) => <InboxIcon {...p} />}
          menu={[
            {
              label: "Notifications",
              to: getRoute(ROUTES.Notifications),
            },
            {
              label: "Évènements",
              to: getRoute(ROUTES.Events),
            },
          ]}
        />
        <MenuItem
          to={getRoute(ROUTES.Contacts)}
          icon={(p) => <UserIcon {...p} />}
          menu={[
            {
              label: "Nouveau contact",
              icon: (p) => <PlusIcon {...p} />,
              shortcut: ["ctrl+alt+c"],
              to: getRoute(ROUTES.ContactsEdit, { id: "new" }),
            },
            {
              type: "divider",
            },
            {
              label: "Tous les contacts",
              shortcut: ["alt+c"],
              to: getRoute(ROUTES.Contacts),
            },
            {
              label: "Fournisseurs",
              to: getRoute(ROUTES.Contacts) + "?q=fournisseur%3A1+",
            },
            {
              label: "Clients",
              to: getRoute(ROUTES.Contacts) + "?q=client%3A1+",
            },
          ]}
        />
        <MenuItem
          to={getRoute(ROUTES.Invoices)}
          icon={(p) => <DocumentIcon {...p} />}
          menu={[
            {
              label: "Nouvelle facture",
              icon: (p) => <PlusIcon {...p} />,
              shortcut: ["shift+f"],
              to: getRoute(ROUTES.InvoicesEdit, { id: "new" }),
            },
            {
              label: "Nouveau devis",
              icon: (p) => <PlusIcon {...p} />,
              shortcut: ["shift+d"],
              to: getRoute(ROUTES.InvoicesEdit, { id: "new" }),
            },
            {
              type: "divider",
            },
            {
              label: "Devis",
              shortcut: ["d"],
              to: getRoute(ROUTES.Invoices) + '?q=type%3A"quotes"+',
            },
            {
              label: "Factures",
              shortcut: ["f"],
              to: getRoute(ROUTES.Invoices) + '?q=type%3A"invoices"+',
            },
            {
              label: "Abonnements",
              shortcut: ["f"],
              to:
                getRoute(ROUTES.Invoices) +
                '?q=type%3A"invoices"+subscription_enabled%3A1+',
            },
            {
              label: "Avoirs",
              shortcut: [],
              to: getRoute(ROUTES.Invoices) + '?q=type%3A"credit_notes"+',
            },
          ]}
        />
        <MenuItem
          to={getRoute(ROUTES.Consulting)}
          icon={(p) => <ClockIcon {...p} />}
          menu={[
            {
              label: "Entrer un temps",
              icon: (p) => <PlusIcon {...p} />,
              shortcut: ["shift+t"],
              to: getRoute(ROUTES.ConsultingEdit, { id: "new" }),
            },
            {
              type: "divider",
            },
            {
              label: "Temps sur site",
              shortcut: ["t"],
              to: getRoute(ROUTES.Consulting),
            },
          ]}
        />
        <MenuItem
          to={getRoute(ROUTES.Orders)}
          icon={(p) => <ShoppingCartIcon {...p} />}
          menu={[
            {
              label: "Créer une commande",
              icon: (p) => <PlusIcon {...p} />,
              shortcut: ["shift+s"],
              to: getRoute(ROUTES.OrdersEdit, { id: "new" }),
            },
            {
              type: "divider",
            },
            {
              label: "Bons de commande",
              shortcut: ["s"],
              to: getRoute(ROUTES.Orders),
            },
          ]}
        />
        <MenuItem
          to={getRoute(ROUTES.Receipts)}
          icon={(p) => <DownloadIcon {...p} />}
          menu={[
            {
              label: "Démarrer la réception",
              icon: (p) => <PlusIcon {...p} />,
              shortcut: ["shift+r"],
              to: getRoute(ROUTES.ReceiptsEdit, { id: "new" }),
            },
            {
              type: "divider",
            },
            {
              label: "Réceptions",
              shortcut: ["r"],
              to: getRoute(ROUTES.Receipts),
            },
          ]}
        />
        <MenuItem
          to={getRoute(ROUTES.Stock)}
          icon={(p) => <ViewBoardsIcon {...p} />}
          menu={[
            {
              label: "Stock",
              to: getRoute(ROUTES.Stock),
            },
          ]}
        />
        <MenuItem
          to={getRoute(ROUTES.Products)}
          icon={(p) => <CubeIcon {...p} />}
          menu={[
            {
              label: "Créer un article",
              icon: (p) => <PlusIcon {...p} />,
              shortcut: ["shift+p"],
              to: getRoute(ROUTES.ProductsEdit, { id: "new" }),
            },
            {
              type: "divider",
            },
            {
              label: "Articles",
              shortcut: ["p"],
              to: getRoute(ROUTES.Products),
            },
          ]}
        />
        <MenuItem
          to={getRoute(ROUTES.Statistics)}
          icon={(p) => <ChartSquareBarIcon {...p} />}
          menu={[
            {
              label: "Statistiques",
              to: getRoute(ROUTES.Statistics),
            },
          ]}
        />
        {(hasAccess("CLIENT_READ") || hasAccess("USERS_READ")) && (
          <MenuItem
            icon={(p) => <AdjustmentsIcon {...p} />}
            to={getRoute(ROUTES.Settings)}
            menu={[
              ...(hasAccess("CLIENT_READ")
                ? ([
                    {
                      label: "Tous les paramètres",
                      to: getRoute(ROUTES.SettingsPreferences),
                    },
                    {
                      label: "Votre entreprise",
                      to: getRoute(ROUTES.SettingsCompany),
                    },
                  ] as DropDownMenuType)
                : []),
              ...(hasAccess("USERS_READ")
                ? ([
                    {
                      label: "Collaborateurs",
                      to: getRoute(ROUTES.SettingsUsers),
                    },
                  ] as DropDownMenuType)
                : []),
              ...(hasAccess("CLIENT_READ")
                ? ([
                    {
                      type: "divider",
                    },
                    {
                      label: "Paiements et plans",
                      to: getRoute(ROUTES.SettingsBilling),
                      icon: () => (
                        <StarIcon className="h-4 w-h-4 text-orange-500 mr-1" />
                      ),
                    },
                  ] as DropDownMenuType)
                : []),
            ]}
          />
        )}

        {/* Space for logo */}
        <div className="h-16" />
      </DefaultScrollbars>

      <Account />

      <div className="absolute bottom-0 w-full h-16 bg-wood-50 dark:bg-wood-990">
        <div className="w-20 h-16 flex items-center justify-center">
          <Logo />
        </div>
      </div>
    </div>
  );
};

const MenuItem = ({
  active,
  icon,
  className,
  menu,
  to,
}: {
  active?: boolean;
  className?: string;
  icon: (p: any) => React.ReactNode;
  menu?: DropDownMenuType;
  to?: string;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const setMenu = useSetRecoilState(DropDownAtom);
  if (to && location.pathname.indexOf(to) === 0) {
    active = true;
  }

  useShortcuts(
    ((menu || []).reduce(
      (acc, m) => [...(m.shortcut || []), ...acc] as any,
      []
    ) || []) as Shortcut[],
    (_e, shortcut) => {
      const dest = menu?.find((m) => m.shortcut?.includes(shortcut))?.to || to;
      if (dest) navigate(dest);
    }
  );

  return (
    <div
      className={
        "inline-flex items-center justify-center w-20 h-14 " + (className || "")
      }
    >
      <Link
        to={to}
        noColor
        onMouseEnter={(e: any) => {
          setMenu({
            target: menu ? e.currentTarget : null,
            position: "right",
            menu: menu || [],
          });
        }}
        onClick={(e: any) => {
          to && setMenu({ target: menu ? e.currentTarget : null, menu: [] });
        }}
        className={
          "cursor-pointer w-12 h-12 flex items-center justify-center hover:bg-wood-100 dark:hover:bg-wood-800 rounded-lg " +
          (active
            ? "bg-wood-100 dark:bg-wood-800 "
            : "opacity-75 hover:opacity-100 ")
        }
      >
        {icon({
          className: "w-6 h-6 text-slate-900 dark:text-slate-100 ",
        })}
      </Link>
    </div>
  );
};

const Logo = () => (
  <Link
    to={getRoute(ROUTES.Home)}
    noColor
    className="flex-col space-y-2 items-center mx-auto flex"
  >
    <img
      data-tooltip={"L'inventaire v" + Env.version}
      data-position="right"
      src="/medias/logo-black.svg"
      className="dark:hidden block h-5"
      alt="L'inventaire"
    />
    <img
      data-tooltip={"L'inventaire v" + Env.version}
      data-position="right"
      src="/medias/logo.svg"
      className="dark:block hidden h-5"
      alt="L'inventaire"
    />
  </Link>
);
