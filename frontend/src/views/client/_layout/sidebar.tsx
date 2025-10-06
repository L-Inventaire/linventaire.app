import { Button } from "@atoms/button/button";
import { MenuItem, MenuSection } from "@atoms/dropdown/components";
import { withSearchAsModel } from "@components/search-bar/utils/as-model";
import { useHasAccess } from "@features/access";
import { registerRootNavigation } from "@features/ctrlk";
import { ROUTES, getRoute } from "@features/routes";
import { useDashboard } from "@features/statistics/hooks";
import { AtSymbolIcon, ListBulletIcon } from "@heroicons/react/16/solid";
import { DocumentIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  BriefcaseIcon,
  ChartBarIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  CubeIcon,
  DocumentArrowDownIcon,
  DocumentCheckIcon,
  HomeIcon,
  InboxIcon,
  ReceiptRefundIcon,
  ShoppingCartIcon,
  UsersIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/solid";
import { ScrollArea } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { Account } from "./account";
import { ResponsiveMenuAtom } from "./header";

export const SideBar = () => {
  const { t } = useTranslation();
  const hasAccess = useHasAccess();
  const menuOpen = useRecoilValue(ResponsiveMenuAtom);
  const location = useLocation();

  const { counters, unreadNotifications } = useDashboard();

  return (
    <div
      className={
        "print:hidden sm:translate-x-0 z-10 sm:border-none border-r dark:border-r-950 transition-all sm:block w-64 overflow-hidden fixed h-screen " +
        (menuOpen
          ? " bg-white dark:bg-slate-950 translate-x-0 "
          : " -translate-x-full ")
      }
    >
      <ScrollArea scrollbars="vertical">
        {/* Space for avatar */}
        <div className="h-14 px-2 flex items-center">
          <Account />
        </div>

        <div className="px-2 space-y-1">
          {hasAccess("ACCOUNTING_READ") && (
            <SideMenuItem
              to={getRoute(ROUTES.Home)}
              label={t("menu.dashboard")}
              icon={(p) => <HomeIcon {...p} />}
            />
          )}

          <SideMenuItem
            to={getRoute(ROUTES.Notifications)}
            label={t("menu.notifications")}
            icon={(p) => <InboxIcon {...p} />}
            badge={unreadNotifications || undefined}
          />

          <MenuSection
            className="!mt-6"
            label={t("menu.sell_title")}
            suffix={
              <Button
                size="md"
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
            show={hasAccess("QUOTES_READ") || hasAccess("INVOICES_READ")}
          >
            <SideMenuItem
              to={getRoute(ROUTES.Invoices, { type: "quotes" })}
              label={t("menu.quotes")}
              icon={(p) => <DocumentIcon {...p} />}
              badge={counters?.quotes?.purchase_order || undefined}
              active={
                location.pathname.indexOf(
                  getRoute(ROUTES.Invoices, { type: "quotes" })
                ) === 0
              }
              show={hasAccess("QUOTES_READ")}
            />
            <SideMenuItem
              to={getRoute(ROUTES.Invoices, { type: "invoices" })}
              label={t("menu.invoices")}
              icon={(p) => <DocumentCheckIcon {...p} />}
              active={
                location.pathname.indexOf(
                  getRoute(ROUTES.Invoices, { type: "invoices" })
                ) === 0
              }
              badge={counters?.invoices?.late || undefined}
              show={hasAccess("INVOICES_READ")}
            />
            <SideMenuItem
              to={getRoute(ROUTES.Invoices, { type: "credit_notes" })}
              label={t("menu.credit_notes")}
              icon={(p) => <ReceiptRefundIcon {...p} />}
              show={hasAccess("INVOICES_READ")}
            />
          </MenuSection>

          <MenuSection
            className="!mt-6"
            label={t("menu.buy_title")}
            suffix={
              <Button
                size="md"
                theme="invisible"
                icon={(p) => <PlusIcon {...p} />}
                to={getRoute(ROUTES.Invoices, {
                  id: "new",
                  type: "supplier_quotes",
                })}
              />
            }
            show={
              hasAccess("SUPPLIER_QUOTES_READ") ||
              hasAccess("SUPPLIER_INVOICES_READ")
            }
          >
            <SideMenuItem
              to={getRoute(ROUTES.Invoices, { type: "supplier_quotes" })}
              label={t("menu.supplier_quotes")}
              badge={counters?.supplier_quotes?.transit || undefined}
              icon={(p) => <ShoppingCartIcon {...p} />}
              show={hasAccess("SUPPLIER_QUOTES_READ")}
            />
            <SideMenuItem
              to={getRoute(ROUTES.Invoices, {
                type: "supplier_invoices+supplier_credit_notes",
              })}
              label={t("menu.supplier_invoices")}
              badge={counters?.supplier_invoices?.sent || undefined}
              icon={(p) => <DocumentArrowDownIcon {...p} />}
              show={hasAccess("SUPPLIER_INVOICES_READ")}
            />
          </MenuSection>

          <MenuSection className="!mt-6" label={t("menu.activity_title")}>
            <SideMenuItem
              to={getRoute(ROUTES.ServiceItems)}
              label={t("menu.consulting")}
              icon={(p) => <BriefcaseIcon {...p} />}
              show={hasAccess("ONSITE_SERVICES_READ")}
            />
            <SideMenuItem
              to={getRoute(ROUTES.Stock)}
              label={t("menu.stock")}
              icon={(p) => <ViewColumnsIcon {...p} />}
              show={hasAccess("STOCK_READ")}
            />
            <SideMenuItem
              to={getRoute(ROUTES.Products)}
              label={t("menu.products")}
              icon={(p) => <CubeIcon {...p} />}
              show={hasAccess("ARTICLES_READ")}
            />
            <SideMenuItem
              to={getRoute(ROUTES.Contacts)}
              label={t("menu.contacts")}
              icon={(p) => <UsersIcon {...p} />}
              active={
                location.pathname.indexOf(getRoute(ROUTES.Contacts)) === 0
              }
              show={hasAccess("CONTACTS_READ")}
            />
            <SideMenuItem
              to={getRoute(ROUTES.CRM)}
              label={t("menu.crm")}
              icon={(p) => <AtSymbolIcon {...p} />}
              active={location.pathname.indexOf(getRoute(ROUTES.CRM)) === 0}
              show={hasAccess("CRM_READ")}
            />
          </MenuSection>

          <MenuSection
            className="!mt-6"
            label="Comptabilité"
            show={hasAccess("ACCOUNTING_READ")}
          >
            <SideMenuItem
              to={getRoute(ROUTES.Accounting)}
              label={t("menu.accounting")}
              icon={(p) => <ListBulletIcon {...p} />}
            />
            <SideMenuItem
              to={getRoute(ROUTES.Statistics)}
              label={t("menu.statistics")}
              icon={(p) => <ChartBarIcon {...p} />}
            />
          </MenuSection>

          <MenuSection
            className="!mt-6"
            label={t("menu.settings_title")}
            show={hasAccess("CLIENT_READ") || hasAccess("USERS_READ")}
          >
            <SideMenuItem
              to={getRoute(ROUTES.SettingsUsers)}
              label={t("menu.users")}
              icon={(p) => <UsersIcon {...p} />}
              show={hasAccess("USERS_READ")}
            />
            <SideMenuItem
              to={getRoute(ROUTES.Settings)}
              label={t("menu.settings_parent")}
              icon={(p) => <Cog6ToothIcon {...p} />}
              show={hasAccess("CLIENT_READ")}
              active={
                location.pathname.indexOf(getRoute(ROUTES.Settings)) === 0 &&
                location.pathname.indexOf(getRoute(ROUTES.SettingsUsers)) !== 0
              }
            />
            <SideMenuItem
              to={getRoute(ROUTES.DevPage)}
              label="DevPage"
              icon={(p) => <CodeBracketIcon {...p} />}
              show={document.location.host.indexOf("localhost") > -1}
            />
          </MenuSection>
        </div>

        {/* Space for logo */}
        <div className="h-2" />
      </ScrollArea>
    </div>
  );
};

const SideMenuItem = ({
  to,
  label,
  icon,
  active,
  show,
  badge,
}: {
  to: string;
  label: string;
  icon: (p: any) => React.ReactNode;
  active?: boolean;
  show?: boolean;
  badge?: string | number;
}) => {
  if (show !== false) {
    registerRootNavigation({
      label,
      keywords: [],
      to,
    });
  }
  return (
    <MenuItem
      to={to}
      label={label}
      icon={icon}
      active={active}
      show={show}
      badge={badge?.toString()}
    />
  );
};
