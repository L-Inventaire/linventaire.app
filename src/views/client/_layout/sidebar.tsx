import { DropDownAtom, DropDownMenuType } from "@atoms/dropdown";
import Link from "@atoms/link";
import { InfoSmall } from "@atoms/text";
import Env from "@config/environment";
import { ROUTES, getRoute } from "@features/routes";
import {
  AdjustmentsIcon,
  ChartSquareBarIcon,
  ClockIcon,
  DocumentIcon,
  DownloadIcon,
  InboxIcon,
  PlusIcon,
  ShoppingCartIcon,
  TagIcon,
  UserIcon,
  ViewBoardsIcon,
  ViewGridIcon,
} from "@heroicons/react/outline";
import { StarIcon } from "@heroicons/react/solid";
import { useSetRecoilState } from "recoil";
import SimpleBar from "simplebar-react";
import { Account } from "./account";

export const SideBar = () => {
  return (
    <div className="hidden sm:block bg-wood-50 dark:bg-wood-990 w-20 overflow-hidden fixed h-screen">
      <SimpleBar style={{ maxHeight: "100%" }}>
        {/* Space for avatar */}
        <div className="h-16 mb-2" />

        <MenuItem
          to={getRoute(ROUTES.Home)}
          icon={(p) => <ViewGridIcon {...p} />}
          menu={[
            {
              label: "Tableau de bord",
              to: ROUTES.Home,
            },
          ]}
        />
        <MenuItem
          to={getRoute(ROUTES.Notifications)}
          icon={(p) => <InboxIcon {...p} />}
          menu={[
            {
              label: "Notifications",
              to: ROUTES.Notifications,
            },
            {
              label: "Évènements",
              to: ROUTES.Events,
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
              shortcut: ["shift+C"],
              to: getRoute(ROUTES.ContactsEdit, { id: "new" }),
            },
            {
              type: "divider",
            },
            {
              label: "Contacts",
              shortcut: ["C"],
              to: ROUTES.Contacts,
            },
            {
              label: "Fournisseurs",
              to: ROUTES.Contacts + "?type=supplier",
            },
            {
              label: "Clients",
              to: ROUTES.Contacts + "?type=client",
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
              shortcut: ["shift+F"],
              to: getRoute(ROUTES.InvoicesEdit, { id: "new" }),
            },
            {
              label: "Nouveau devis",
              icon: (p) => <PlusIcon {...p} />,
              shortcut: ["shift+D"],
              to: getRoute(ROUTES.QuotesEdit, { id: "new" }),
            },
            {
              type: "divider",
            },
            {
              label: "Factures",
              shortcut: ["F"],
              to: ROUTES.Invoices,
            },
            {
              label: "Devis",
              shortcut: ["D"],
              to: ROUTES.Quotes,
            },
            {
              label: "Abonnements",
              shortcut: ["F"],
              to: ROUTES.Subscriptions,
            },
          ]}
        />
        <MenuItem
          to={getRoute(ROUTES.Orders)}
          icon={(p) => <ShoppingCartIcon {...p} />}
          menu={[
            {
              label: "Démarrer une commande",
              icon: (p) => <PlusIcon {...p} />,
              shortcut: ["shift+S"],
              to: getRoute(ROUTES.OrdersEdit, { id: "new" }),
            },
            {
              type: "divider",
            },
            {
              label: "Commandes",
              shortcut: ["S"],
              to: ROUTES.Orders,
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
              shortcut: ["shift+R"],
              to: getRoute(ROUTES.ReceiptsEdit, { id: "new" }),
            },
            {
              type: "divider",
            },
            {
              label: "Réceptions",
              shortcut: ["R"],
              to: ROUTES.Receipts,
            },
          ]}
        />
        <MenuItem
          to={getRoute(ROUTES.Stock)}
          icon={(p) => <ViewBoardsIcon {...p} />}
          menu={[
            {
              label: "Stock",
              to: ROUTES.Stock,
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
              shortcut: ["shift+T"],
              to: getRoute(ROUTES.ConsultingEdit, { id: "new" }),
            },
            {
              type: "divider",
            },
            {
              label: "Temps sur site",
              shortcut: ["T"],
              to: ROUTES.Consulting,
            },
          ]}
        />
        <MenuItem
          to={getRoute(ROUTES.Products)}
          icon={(p) => <TagIcon {...p} />}
          menu={[
            {
              label: "Créer un article",
              icon: (p) => <PlusIcon {...p} />,
              shortcut: ["shift+P"],
              to: getRoute(ROUTES.ProductsEdit, { id: "new" }),
            },
            {
              type: "divider",
            },
            {
              label: "Articles",
              shortcut: ["P"],
              to: ROUTES.Products,
            },
          ]}
        />
        <MenuItem
          to={getRoute(ROUTES.Statistics)}
          icon={(p) => <ChartSquareBarIcon {...p} />}
          menu={[
            {
              label: "Statistiques",
              to: ROUTES.Statistics,
            },
          ]}
        />
        <MenuItem
          to={getRoute(ROUTES.SettingsPreferences)}
          icon={(p) => <AdjustmentsIcon {...p} />}
          menu={[
            {
              label: "Paramètres de L'inventaire",
              to: ROUTES.SettingsPreferences,
            },
            {
              label: "Paramètres de l'entreprise",
              to: ROUTES.SettingsCompany,
            },
            {
              label: "Collaborateurs",
              to: ROUTES.SettingsUsers,
            },
            {
              type: "divider",
            },
            {
              label: "Paiements et plans",
              to: ROUTES.SettingsBilling,
              icon: (p) => (
                <StarIcon className="h-4 w-h-4 text-orange-500 mr-1" />
              ),
            },
          ]}
        />

        {/* Space for logo */}
        <div className="h-20" />
      </SimpleBar>

      <Account />

      <div className="absolute bottom-0 w-full h-20 bg-wood-50 dark:bg-wood-990 backdrop-blur-sm bg-opacity-25">
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
  const setMenu = useSetRecoilState(DropDownAtom);
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
          setMenu({ target: menu ? e.currentTarget : null, menu: [] });
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
      src="/medias/logo-black.svg"
      className="dark:hidden block h-7"
      alt="L'inventaire"
    />
    <img
      src="/medias/logo.svg"
      className="dark:block hidden h-7"
      alt="L'inventaire"
    />
    <InfoSmall>v{Env.version}</InfoSmall>
  </Link>
);
