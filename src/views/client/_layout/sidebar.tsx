import { Button } from "@atoms/button/button";
import { MenuItem, MenuSection } from "@atoms/dropdown/components";
import Link from "@atoms/link";
import Env from "@config/environment";
import { useHasAccess } from "@features/access";
import { ROUTES, getRoute } from "@features/routes";
import { DefaultScrollbars } from "@features/utils/scrollbars";
import { DocumentIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  BookOpenIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CubeIcon,
  DocumentCheckIcon,
  HomeIcon,
  InboxIcon,
  ReceiptRefundIcon,
  ShoppingCartIcon,
  UserIcon,
  UsersIcon,
  ViewColumnsIcon,
  WalletIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/solid";
import { useRecoilValue } from "recoil";
import { Account } from "./account";
import { ResponsiveMenuAtom } from "./header";

export const SideBar = () => {
  const hasAccess = useHasAccess();
  const menuOpen = useRecoilValue(ResponsiveMenuAtom);

  return (
    <div
      className={
        "print:hidden sm:translate-x-0 z-10 sm:border-none border-r dark:border-r-950 transition-all sm:block w-64 overflow-hidden fixed h-screen " +
        (menuOpen ? " translate-x-0 " : " -translate-x-full ")
      }
    >
      <DefaultScrollbars>
        {/* Space for avatar */}
        <div className="h-14 px-2 flex items-center">
          <Account />
        </div>

        <div className="px-2 space-y-1">
          <MenuItem
            to={getRoute(ROUTES.Home)}
            label="Tableau de bord"
            icon={(p) => <HomeIcon {...p} />}
          />
          <MenuItem
            to={getRoute(ROUTES.Notifications)}
            label="Notifications"
            icon={(p) => <InboxIcon {...p} />}
          />
          <MenuItem
            to={getRoute(ROUTES.Statistics)}
            label="Statistiques"
            icon={(p) => <ChartBarIcon {...p} />}
          />

          <MenuSection
            className="!mt-6"
            label="Contacts"
            suffix={
              <Button
                size="sm"
                theme="invisible"
                icon={(p) => <PlusIcon {...p} />}
              />
            }
            show={hasAccess("CONTACTS_READ")}
          >
            <MenuItem
              to={getRoute(ROUTES.Contacts)}
              label="Tous les contacts"
              icon={(p) => <WalletIcon {...p} />}
            />
            <MenuItem
              to={getRoute(ROUTES.Contacts) + "?q=client%3A1+"}
              label="Clients"
              icon={(p) => <UserIcon {...p} />}
            />
            <MenuItem
              to={getRoute(ROUTES.Contacts) + "?q=fournisseur%3A1+"}
              label="Fournisseurs"
              icon={(p) => <BuildingStorefrontIcon {...p} />}
            />
          </MenuSection>

          <MenuSection
            className="!mt-6"
            label="Documents"
            suffix={
              <Button
                size="sm"
                theme="invisible"
                icon={(p) => <PlusIcon {...p} />}
              />
            }
            show={hasAccess("INVOICES_READ")}
          >
            <MenuItem
              to={getRoute(ROUTES.Invoices) + "?type=quotes"}
              label="Devis"
              icon={(p) => <DocumentIcon {...p} />}
            />
            <MenuItem
              to={getRoute(ROUTES.Invoices) + "?type=invoices"}
              label="Factures"
              icon={(p) => <DocumentCheckIcon {...p} />}
            />
            <MenuItem
              to={
                getRoute(ROUTES.Invoices) +
                "?type=invoices&q=subscription_enabled%3A1+&map=%7B%7D"
              }
              label="Abonnements"
              icon={(p) => <CalendarDaysIcon {...p} />}
            />
            <MenuItem
              to={getRoute(ROUTES.Invoices) + "?type=credit_notes"}
              label="Avoirs"
              icon={(p) => <ReceiptRefundIcon {...p} />}
            />
          </MenuSection>

          <MenuSection
            className="!mt-6"
            label="Service"
            show={hasAccess("ONSITE_READ")}
          >
            <MenuItem
              to={getRoute(ROUTES.Contacts)}
              label="Service sur site"
              icon={(p) => <ClipboardDocumentListIcon {...p} />}
              show={hasAccess("ONSITE_READ")}
            />
          </MenuSection>

          <MenuSection
            className="!mt-6"
            label="Stock"
            show={
              hasAccess("ARTICLES_READ") ||
              hasAccess("ORDERS_READ") ||
              hasAccess("STOCK_READ")
            }
          >
            <MenuItem
              to={getRoute(ROUTES.Orders)}
              label="Commandes"
              icon={(p) => <ShoppingCartIcon {...p} />}
              show={hasAccess("ORDERS_READ")}
            />
            <MenuItem
              to={getRoute(ROUTES.Stock)}
              label="Stock"
              icon={(p) => <ViewColumnsIcon {...p} />}
              show={hasAccess("STOCK_READ")}
            />
            <MenuItem
              to={getRoute(ROUTES.Products)}
              label="Articles"
              icon={(p) => <CubeIcon {...p} />}
              show={hasAccess("ARTICLES_READ")}
            />
          </MenuSection>

          <MenuSection className="!mt-6" label="Comptabilité">
            <MenuItem
              to={getRoute(ROUTES.Contacts)}
              label="Comptes"
              icon={(p) => <BookOpenIcon {...p} />}
            />
          </MenuSection>

          <MenuSection
            className="!mt-6"
            label="Entreprise"
            show={hasAccess("CLIENT_READ") || hasAccess("USERS_READ")}
          >
            <MenuItem
              to={getRoute(ROUTES.SettingsUsers)}
              label="Utilisateurs"
              icon={(p) => <UsersIcon {...p} />}
              show={hasAccess("USERS_READ")}
            />
            <MenuItem
              to={getRoute(ROUTES.Settings)}
              label="Paramètres"
              icon={(p) => <Cog6ToothIcon {...p} />}
              show={hasAccess("CLIENT_READ")}
            />
            <MenuItem
              to={getRoute(ROUTES.DevPage)}
              label="DevPage"
              icon={(p) => <CodeBracketIcon {...p} />}
              show={document.location.host.indexOf("localhost") > -1}
            />
          </MenuSection>
        </div>

        {/* Space for logo */}
        <div className="h-16" />
      </DefaultScrollbars>

      {false && (
        <div className="absolute bottom-0 w-full h-16 bg-slate-50 dark:bg-slate-950">
          <div className="w-64 h-16 flex items-center justify-center">
            <Logo />
          </div>
        </div>
      )}
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
