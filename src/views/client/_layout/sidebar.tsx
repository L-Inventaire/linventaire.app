import Avatar from "@atoms/avatar/avatar";
import { DropDownAtom, DropDownMenuType } from "@atoms/dropdown";
import Link from "@atoms/link";
import { useAuth } from "@features/auth/state/use-auth";
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
import { useSetRecoilState } from "recoil";
import { PlusIcon } from "@heroicons/react/outline";
import { StarIcon } from "@heroicons/react/solid";

export const SideBar = () => {
  const { user } = useAuth();

  return (
    <div className="hidden sm:block bg-wood-50 dark:bg-wood-990 w-20 overflow-hidden fixed h-screen">
      <SimpleBar style={{ maxHeight: "100%" }}>
        {/* Space for avatar */}
        <div className="h-16 mb-2" />

        <MenuItem
          icon={(p) => <ViewGridIcon {...p} />}
          menu={[
            {
              label: "Tableau de bord",
            },
          ]}
        />
        <MenuItem
          icon={(p) => <InboxIcon {...p} />}
          menu={[
            {
              label: "Notifications",
            },
            {
              label: "Évènements",
            },
          ]}
        />
        <MenuItem
          icon={(p) => <UserIcon {...p} />}
          menu={[
            {
              label: "Nouveau contact",
              icon: (p) => <PlusIcon {...p} />,
              shortcut: ["shift+C"],
            },
            {
              type: "divider",
            },
            {
              label: "Contacts",
              shortcut: ["C"],
            },
            {
              label: "Fournisseurs",
            },
            {
              label: "Clients",
            },
          ]}
        />
        <MenuItem
          active
          icon={(p) => <DocumentIcon {...p} />}
          menu={[
            {
              label: "Nouvelle facture",
              icon: (p) => <PlusIcon {...p} />,
              shortcut: ["shift+F"],
            },
            {
              label: "Nouveau devis",
              icon: (p) => <PlusIcon {...p} />,
              shortcut: ["shift+D"],
            },
            {
              type: "divider",
            },
            {
              label: "Factures",
              shortcut: ["F"],
            },
            {
              label: "Devis",
              shortcut: ["D"],
            },
            {
              label: "Abonnements",
              shortcut: ["F"],
            },
          ]}
        />
        <MenuItem
          icon={(p) => <ShoppingCartIcon {...p} />}
          menu={[
            {
              label: "Démarrer une commande",
              icon: (p) => <PlusIcon {...p} />,
              shortcut: ["shift+S"],
            },
            {
              type: "divider",
            },
            {
              label: "Commandes",
              shortcut: ["S"],
            },
          ]}
        />
        <MenuItem
          icon={(p) => <DownloadIcon {...p} />}
          menu={[
            {
              label: "Démarrer la réception",
              icon: (p) => <PlusIcon {...p} />,
              shortcut: ["shift+R"],
            },
            {
              type: "divider",
            },
            {
              label: "Réceptions",
              shortcut: ["R"],
            },
          ]}
        />
        <MenuItem
          icon={(p) => <ViewBoardsIcon {...p} />}
          menu={[
            {
              label: "Stock",
            },
          ]}
        />
        <MenuItem
          icon={(p) => <ClockIcon {...p} />}
          menu={[
            {
              label: "Entrer un temps",
              icon: (p) => <PlusIcon {...p} />,
              shortcut: ["shift+T"],
            },
            {
              type: "divider",
            },
            {
              label: "Temps sur site",
              shortcut: ["T"],
            },
          ]}
        />
        <MenuItem
          icon={(p) => <TagIcon {...p} />}
          menu={[
            {
              label: "Créer un article",
              icon: (p) => <PlusIcon {...p} />,
              shortcut: ["shift+P"],
            },
            {
              type: "divider",
            },
            {
              label: "Articles",
              shortcut: ["P"],
            },
          ]}
        />
        <MenuItem
          icon={(p) => <ChartSquareBarIcon {...p} />}
          menu={[
            {
              label: "Statistiques",
            },
          ]}
        />
        <MenuItem
          icon={(p) => <AdjustmentsIcon {...p} />}
          menu={[
            {
              label: "Paramètres de L'inventaire",
            },
            {
              label: "Paramètres de l'entreprise",
            },
            {
              label: "Collaborateurs",
            },
            {
              type: "divider",
            },
            {
              label: "Paiements et plans",
              icon: (p) => (
                <StarIcon className="h-4 w-h-4 text-orange-500 mr-1" />
              ),
            },
          ]}
        />

        {/* Space for logo */}
        <div className="h-20" />
      </SimpleBar>

      <div className="absolute top-0 w-full pt-6 pb-3 bg-wood-50 dark:bg-wood-990 backdrop-blur-sm bg-opacity-25">
        <div className="w-20 flex items-center justify-center">
          <Avatar
            size={8}
            fallback={user?.full_name || ""}
            avatar={user?.preferences?.avatar || ""}
          />
        </div>
      </div>

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
}: {
  active?: boolean;
  className?: string;
  icon: (p: any) => React.ReactNode;
  menu?: DropDownMenuType;
}) => {
  const setMenu = useSetRecoilState(DropDownAtom);
  return (
    <div
      className={
        "inline-flex items-center justify-center w-20 h-14 " + (className || "")
      }
    >
      <div
        onMouseEnter={(e) => {
          setMenu({
            target: menu ? e.currentTarget : null,
            position: "right",
            menu: menu || [],
          });
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
