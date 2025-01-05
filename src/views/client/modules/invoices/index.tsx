import { Button } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { withSearchAsModel } from "@components/search-bar/utils/as-model";
import { RestTable } from "@components/table-rest";
import { useHasAccess } from "@features/access";
import {
  InvoicesColumns,
  InvoicesFieldsNames,
} from "@features/invoices/configuration";
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
import { useState } from "react";
import { useParams } from "react-router-dom";
import { SearchBar } from "../../../../components/search-bar";
import {
  buildQueryFromMap,
  schemaToSearchFields,
} from "../../../../components/search-bar/utils/utils";
import { InvoiceStatus } from "./components/invoice-status";
import _ from "lodash";

export const InvoicesPage = () => {
  const key = useParams().type;
  return <InvoicesPageContent key={key} />;
};

const InvoicesPageContent = () => {
  const type: Invoices["type"][] = (useParams().type?.split("+") || [
    "invoices",
  ]) as any;

  const tabs = {
    all: { label: "Tous", filter: [] },
    draft: {
      label: "Brouillons",
      filter: buildQueryFromMap({ state: "draft" }),
    },
    sent: {
      label: type.join("").includes("supplier_")
        ? type.includes("supplier_quotes")
          ? "Commandé"
          : "À payer"
        : "Envoyés",
      filter: buildQueryFromMap({
        state: type.includes("supplier_quotes")
          ? ["sent", "purchase_order"]
          : "sent",
      }),
    },
    ...(type.includes("quotes")
      ? {
          purchase_order: {
            label: "Acceptés",
            filter: buildQueryFromMap({ state: "purchase_order" }),
          },
          recurring: {
            label: "Abonnements",
            filter: buildQueryFromMap({ state: "recurring" }),
          },
          completed: {
            label: "À facturer",
            filter: buildQueryFromMap({ state: "completed" }),
          },
        }
      : {}),
    closed: {
      label: "Terminés",
      filter: buildQueryFromMap({ state: ["closed"] }),
    },
  };
  const [activeTab, setActiveTab] = useState("all");
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
    key: type.join("+") + "_" + activeTab,
  });

  const schema = useRestSchema("invoices");
  const navigate = useNavigateAlt();
  const hasAccess = useHasAccess();

  // Counters
  const { invoices: draftInvoices } = useInvoices({
    key: "draftInvoices",
    limit: 1,
    query: [...tabs.draft.filter, ...invoiceFilters.query],
  });
  const { invoices: sentInvoices } = useInvoices({
    key: "sentInvoices",
    limit: 1,
    query: [...tabs.sent.filter, ...invoiceFilters.query],
  });
  const { invoices: inProgressInvoices } = useInvoices({
    key: "inProgressInvoices",
    limit: 1,
    query: [...(tabs.purchase_order?.filter || []), ...invoiceFilters.query],
  });
  const { invoices: recurringInvoices } = useInvoices({
    key: "recurringInvoices",
    limit: 1,
    query: [...invoiceFilters.query, ...(tabs.recurring?.filter || [])],
  });
  const counters = {
    draft: draftInvoices?.data?.total || 0,
    sent: sentInvoices?.data?.total || 0,
    purchase_order: inProgressInvoices?.data?.total || 0,
    recurring: recurringInvoices?.data?.total || 0,
  };

  return (
    <Page
      title={[{ label: getDocumentNamePlurial(type[0]) }]}
      bar={
        <SearchBar
          schema={{
            table: "invoices",
            fields: schemaToSearchFields(schema.data, InvoicesFieldsNames()),
          }}
          onChange={(q) => {
            if (q.valid) {
              setOptions({ ...options, query: q.fields });
              setPagination((pagination) => ({ ...pagination, page: 1 }));
            }
          }}
          suffix={
            hasAccess("INVOICES_WRITE") ? (
              ["supplier_invoices", "supplier_credit_notes"].includes(
                type[0]
              ) ? (
                <>
                  {hasAccess("SUPPLIER_INVOICES_WRITE") && (
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
                        shortcut={
                          type.includes("supplier_invoices") ? ["c"] : []
                        }
                        hideTextOnMobile
                      >
                        Facture fournisseur
                      </Button>
                    </>
                  )}
                </>
              ) : ["supplier_quotes"].includes(type[0]) ? (
                <>
                  {hasAccess("SUPPLIER_QUOTES_WRITE") && (
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
                  )}
                </>
              ) : (
                <>
                  {hasAccess("INVOICES_WRITE") && (
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
                  )}
                  {hasAccess("QUOTES_WRITE") && (
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
                  )}
                  {hasAccess("INVOICES_WRITE") && (
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
                  )}
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
            }}
            value={activeTab}
          >
            <Tabs.List className="flex space-x-2 -mx-3 -mb-px items-center">
              {Object.entries(tabs).map(([key, label]) => (
                <Tabs.Trigger key={key} value={key}>
                  {label.label}
                  {!!(counters as any)?.[key] && (
                    <Badge className="ml-2">
                      {formatNumber((counters as any)?.[key] || 0)}
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
