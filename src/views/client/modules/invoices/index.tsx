import { Button } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { withSearchAsModel } from "@components/search-bar/utils/as-model";
import { RestTable } from "@components/table-rest";
import { useHasAccess } from "@features/access";
import { InvoicesColumns } from "@features/invoices/configuration";
import { useInvoices } from "@features/invoices/hooks/use-invoices";
import { Invoices } from "@features/invoices/types/types";
import { getDocumentNamePlurial } from "@features/invoices/utils";
import { ROUTES, getRoute } from "@features/routes";
import { formatNumber } from "@features/utils/format/strings";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  RestOptions,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { ArrowUturnLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@molecules/table/table";
import { Badge, Tabs } from "@radix-ui/themes";
import { Page } from "@views/client/_layout/page";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { SearchBar } from "../../../../components/search-bar";
import {
  buildQueryFromMap,
  schemaToSearchFields,
} from "../../../../components/search-bar/utils/utils";
import { InvoiceStatus } from "./components/invoice-status";

const activeFilter = [
  {
    key: "state",
    not: true,
    values: [
      {
        op: "equals",
        value: "closed",
      },
      {
        op: "equals",
        value: "recurring",
      },
    ],
  },
];

export const InvoicesPage = () => {
  const type: Invoices["type"][] = (useParams().type?.split("+") || [
    "invoices",
  ]) as any;

  const tabs = {
    active: { label: "Actifs", filter: activeFilter },
    ...(type.includes("quotes")
      ? {
          recurring: {
            label: "En abonnement",
            filter: buildQueryFromMap({ state: "recurring" }),
          },
        }
      : {}),
    closed: {
      label: "Terminés",
      filter: buildQueryFromMap({ state: "closed" }),
    },
    all: { label: "Tous", filter: [] },
  };
  const [activeTab, setActiveTab] = useState("active");
  const [didSelectTab, setDidSelectTab] = useState(false);
  const [pagination, setPagination] = useState<
    Omit<Pagination, "total"> & { total?: number }
  >({
    page: 1,
    perPage: 20,
    order: "ASC",
  });

  const [options, setOptions] = useState<RestOptions<Invoices>>({
    limit: 20,
    offset: 0,
    query: [],
  });

  const invoiceFilters = {
    ...options,
    index: "state_order,emit_date desc",
    query: [...((options?.query as any) || []), ...buildQueryFromMap({ type })],
  };

  const { invoices } = useInvoices({
    ...invoiceFilters,
    query: [
      ...invoiceFilters.query,
      ...((tabs as any)[activeTab]?.filter || []),
    ],
    asc: true,
  });

  const schema = useRestSchema("invoices");
  const navigate = useNavigateAlt();
  const hasAccess = useHasAccess();

  // Counters
  const { invoices: draftInvoices } = useInvoices({
    key: "draftInvoices",
    limit: 1,
    query: [...buildQueryFromMap({ state: "draft" }), ...invoiceFilters.query],
  });
  const { invoices: activeInvoices } = useInvoices({
    key: "activeInvoices",
    limit: 1,
    query: [...invoiceFilters.query, ...activeFilter],
  });
  const { invoices: recurringInvoices } = useInvoices({
    key: "recurringInvoices",
    limit: 1,
    query: [...invoiceFilters.query, ...(tabs.recurring?.filter || [])],
  });

  if (
    !draftInvoices.isPending &&
    !activeInvoices.isPending &&
    !invoices.isPending &&
    activeInvoices?.data?.total === 0 &&
    (draftInvoices?.data?.total || 0) > 0 &&
    activeTab === "active" &&
    !didSelectTab
  ) {
    setActiveTab("active");
  }

  return (
    <Page
      title={[{ label: getDocumentNamePlurial(type[0]) }]}
      bar={
        <SearchBar
          schema={{
            table: "invoices",
            fields: schemaToSearchFields(schema.data, {
              tags: {
                label: "Étiquettes",
                keywords: "tags étiquettes label",
              },
              updated_at: "Date de mise à jour",
              updated_by: {
                label: "Mis à jour par",
                keywords: "updated_by mis à jour par auteur utilisateur user",
              },
              type: {
                label: "Type",
                keywords: "type devis avoirs factures",
              },
            }),
          }}
          onChange={(q) => {
            q.valid && setOptions({ ...options, query: q.fields });
            setPagination((pagination) => ({ ...pagination, page: 1 }));
          }}
          suffix={
            hasAccess("INVOICES_WRITE") ? (
              ["supplier_invoices", "supplier_credit_notes"].includes(
                type[0]
              ) ? (
                <>
                  <Button
                    size="sm"
                    theme="outlined"
                    to={withSearchAsModel(
                      getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                      schema.data,
                      { type: "supplier_credit_notes" }
                    )}
                    icon={(p) => <ArrowUturnLeftIcon {...p} />}
                    hideTextOnMobile
                  >
                    Avoir fournisseur
                  </Button>
                  <Button
                    size="sm"
                    to={withSearchAsModel(
                      getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                      schema.data,
                      { type: "supplier_invoices" }
                    )}
                    icon={(p) => <PlusIcon {...p} />}
                    shortcut={type.includes("supplier_invoices") ? ["c"] : []}
                    hideTextOnMobile
                  >
                    Facture fournisseur
                  </Button>
                </>
              ) : ["supplier_quotes"].includes(type[0]) ? (
                <>
                  <Button
                    size="sm"
                    to={withSearchAsModel(
                      getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                      schema.data,
                      { type: "supplier_quotes" }
                    )}
                    icon={(p) => <PlusIcon {...p} />}
                    shortcut={type.includes("supplier_quotes") ? ["c"] : []}
                    hideTextOnMobile
                  >
                    Commande
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    theme="outlined"
                    to={withSearchAsModel(
                      getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                      schema.data,
                      { type: "credit_notes" }
                    )}
                    icon={(p) => <ArrowUturnLeftIcon {...p} />}
                    shortcut={type.includes("credit_notes") ? ["c"] : []}
                    hideTextOnMobile
                  >
                    Avoir
                  </Button>
                  <Button
                    size="sm"
                    to={withSearchAsModel(
                      getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                      schema.data,
                      { type: "quotes" }
                    )}
                    icon={(p) => <PlusIcon {...p} />}
                    shortcut={type.includes("quotes") ? ["c"] : []}
                  >
                    Devis
                  </Button>
                  <Button
                    size="sm"
                    to={withSearchAsModel(
                      getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                      schema.data,
                      { type: "invoices" }
                    )}
                    icon={(p) => <PlusIcon {...p} />}
                    shortcut={type.includes("invoices") ? ["c"] : []}
                  >
                    Facture
                  </Button>
                </>
              )
            ) : undefined
          }
        />
      }
    >
      <div className="-m-3 overflow-auto max-w-[100vw]">
        <div className="px-3 min-h-7 w-full bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <Tabs.Root
            onValueChange={(v) => {
              setActiveTab(v);
              setDidSelectTab(true);
            }}
            value={activeTab}
          >
            <Tabs.List className="flex space-x-2 -mx-3 -mb-px items-center">
              {Object.entries(tabs).map(([key, label]) => (
                <Tabs.Trigger key={key} value={key}>
                  {label.label}
                  {["active", "recurring"].includes(key) && (
                    <Badge className="ml-2">
                      {key === "recurring"
                        ? formatNumber(recurringInvoices?.data?.total || 0)
                        : formatNumber(activeInvoices?.data?.total || 0)}
                    </Badge>
                  )}
                </Tabs.Trigger>
              ))}
              <div className="grow" />
              <Info className="pr-3">
                {formatNumber(invoices?.data?.total || 0)} documents trouvés
              </Info>
            </Tabs.List>
          </Tabs.Root>
        </div>

        <RestTable
          groupBy="state"
          groupByRender={(row) => (
            <div className="mt-px">
              <InvoiceStatus
                size="xs"
                readonly
                value={row.state}
                type={row.type}
              />
            </div>
          )}
          entity="invoices"
          onClick={({ id }, event) =>
            navigate(getRoute(ROUTES.InvoicesView, { id }), { event })
          }
          data={invoices}
          showPagination="full"
          onRequestData={async (page) => {
            setOptions({
              ...options,
              limit: page.perPage,
              offset: (page.page - 1) * page.perPage,
              asc: page.order === "ASC",
            });
          }}
          columns={InvoicesColumns.filter(
            (a) =>
              !(
                // If Quotes, we have only the client related
                (
                  type.includes("quotes")
                    ? ["supplier", "origin"]
                    : // If not supplier related then we filter out supplier
                    type.includes("invoices") || type.includes("credit_notes")
                    ? ["supplier"]
                    : []
                ).includes(a.id || "")
              )
          )}
          controlledPagination={pagination}
          setControlledPagination={setPagination}
        />
      </div>
    </Page>
  );
};
