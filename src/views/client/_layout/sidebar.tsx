import { Button } from "@atoms/button/button";
import { MenuItem, MenuSection } from "@atoms/dropdown/components";
import { withSearchAsModel } from "@components/search-bar/utils/as-model";
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
  CodeBracketIcon,
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
} from "@heroicons/react/24/solid";
import { useLocation } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { Account } from "./account";
import { ResponsiveMenuAtom } from "./header";

export const SideBar = () => {
  const hasAccess = useHasAccess();
  const menuOpen = useRecoilValue(ResponsiveMenuAtom);
  const location = useLocation();

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
                to={getRoute(ROUTES.ContactsEdit, { id: "new" })}
              />
            }
            show={hasAccess("CONTACTS_READ")}
          >
            <MenuItem
              to={getRoute(ROUTES.Contacts)}
              label="Tous les contacts"
              icon={(p) => <WalletIcon {...p} />}
              active={
                location.pathname.indexOf(getRoute(ROUTES.Contacts)) === 0 &&
                location.search.indexOf("is_client%3A1") === -1 &&
                location.search.indexOf("is_supplier%3A1") === -1
              }
            />
            <MenuItem
              to={getRoute(ROUTES.Contacts) + "?q=is_client%3A1"}
              label="Clients"
              icon={(p) => <UserIcon {...p} />}
              active={
                location.pathname.indexOf(getRoute(ROUTES.Contacts)) === 0 &&
                location.search.indexOf("is_client%3A1") !== -1
              }
            />
            <MenuItem
              to={getRoute(ROUTES.Contacts) + "?q=is_supplier%3A1"}
              label="Fournisseurs"
              icon={(p) => <BuildingStorefrontIcon {...p} />}
              active={
                location.pathname.indexOf(getRoute(ROUTES.Contacts)) === 0 &&
                location.search.indexOf("is_supplier%3A1") !== -1
              }
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
                to={withSearchAsModel(
                  getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                  undefined,
                  {
                    type: "invoices",
                  }
                )}
              />
            }
            show={hasAccess("INVOICES_READ")}
          >
            <MenuItem
              to={getRoute(ROUTES.Invoices) + '?q=type%3A"quotes"'}
              label="Devis"
              icon={(p) => <DocumentIcon {...p} />}
              active={
                location.pathname.indexOf(getRoute(ROUTES.Invoices)) === 0 &&
                location.search.indexOf("type%3A%22quotes%22") !== -1
              }
            />
            <MenuItem
              to={getRoute(ROUTES.Invoices) + '?q=type%3A"invoices"'}
              label="Factures"
              icon={(p) => <DocumentCheckIcon {...p} />}
              active={
                location.pathname.indexOf(getRoute(ROUTES.Invoices)) === 0 &&
                location.search.indexOf("type%3A%22invoices%22") !== -1 &&
                location.search.indexOf("subscription_enabled%3A1") === -1
              }
            />
            <MenuItem
              to={
                getRoute(ROUTES.Invoices) +
                '?q=type%3A"invoices"+subscription_enabled%3A1'
              }
              label="Abonnements"
              icon={(p) => <CalendarDaysIcon {...p} />}
              active={
                location.pathname.indexOf(getRoute(ROUTES.Invoices)) === 0 &&
                location.search.indexOf("subscription_enabled%3A1") !== -1
              }
            />
            <MenuItem
              to={getRoute(ROUTES.Invoices) + '?q=type%3A"credit_notes"'}
              label="Avoirs"
              icon={(p) => <ReceiptRefundIcon {...p} />}
              active={
                location.pathname.indexOf(getRoute(ROUTES.Invoices)) === 0 &&
                location.search.indexOf("type%3A%22credit_notes%22") !== -1
              }
            />
          </MenuSection>

          <MenuSection
            className="!mt-6"
            label="Service"
            show={hasAccess("ONSITE_READ")}
          >
            <MenuItem
              to={getRoute(ROUTES.Consulting)}
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
              to={getRoute(ROUTES.Accounting)}
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
              active={
                location.pathname.indexOf(getRoute(ROUTES.Settings)) === 0 &&
                location.pathname.indexOf(getRoute(ROUTES.SettingsUsers)) !== 0
              }
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
        <div className="h-2" />
      </DefaultScrollbars>
    </div>
  );
};
