import { Button } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { withSearchAsModel } from "@components/search-bar/utils/as-model";
import { RestTable } from "@components/table-rest";
import { useHasAccess } from "@features/access";
import {
  InvoicesColumns,
  InvoicesFieldsNames,
} from "@features/invoices/configuration";
import { Invoices } from "@features/invoices/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { formatNumber } from "@features/utils/format/strings";
import { useNavigateAlt } from "@features/utils/navigate";
import { ArrowUturnLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Badge, Tabs } from "@radix-ui/themes";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { SearchBar } from "../../../../../components/search-bar";
import { schemaToSearchFields } from "../../../../../components/search-bar/utils/utils";
import { InvoiceTabs, TabInvoices } from "../hooks/use-tab-invoices";

// Document creation buttons, specific to the type of documents being listed
const CreateButtons = ({
  types,
  schema,
}: {
  types: Invoices["type"][];
  schema: any;
}) => {
  const hasAccess = useHasAccess();
  if (!hasAccess("INVOICES_WRITE")) return null;

  if (["supplier_invoices", "supplier_credit_notes"].includes(types[0])) {
    return hasAccess("SUPPLIER_INVOICES_WRITE") ? (
      <>
        <Button
          size="sm"
          theme="outlined"
          to={withSearchAsModel(getRoute(ROUTES.InvoicesEdit, { id: "new" }), schema, {
            type: "supplier_credit_notes",
          })}
          icon={(p) => <ArrowUturnLeftIcon {...p} />}
          hideTextOnMobile
        >
          Avoir fournisseur
        </Button>
        <Button
          size="sm"
          to={withSearchAsModel(getRoute(ROUTES.InvoicesEdit, { id: "new" }), schema, {
            type: "supplier_invoices",
          })}
          icon={(p) => <PlusIcon {...p} />}
          shortcut={types.includes("supplier_invoices") ? ["c"] : []}
          hideTextOnMobile
        >
          Facture fournisseur
        </Button>
      </>
    ) : null;
  }

  if (types[0] === "supplier_quotes") {
    return hasAccess("SUPPLIER_QUOTES_WRITE") ? (
      <Button
        size="sm"
        to={withSearchAsModel(getRoute(ROUTES.InvoicesEdit, { id: "new" }), schema, {
          type: "supplier_quotes",
        })}
        icon={(p) => <PlusIcon {...p} />}
        shortcut={types.includes("supplier_quotes") ? ["c"] : []}
        hideTextOnMobile
      >
        Commande
      </Button>
    ) : null;
  }

  return (
    <>
      {hasAccess("INVOICES_WRITE") && (
        <Button
          size="sm"
          theme="outlined"
          to={withSearchAsModel(getRoute(ROUTES.InvoicesEdit, { id: "new" }), schema, {
            type: "credit_notes",
          })}
          icon={(p) => <ArrowUturnLeftIcon {...p} />}
          shortcut={types.includes("credit_notes") ? ["c"] : []}
          hideTextOnMobile
        >
          Avoir
        </Button>
      )}
      {hasAccess("QUOTES_WRITE") && (
        <Button
          size="sm"
          to={withSearchAsModel(getRoute(ROUTES.InvoicesEdit, { id: "new" }), schema, {
            type: "quotes",
          })}
          icon={(p) => <PlusIcon {...p} />}
          shortcut={types.includes("quotes") ? ["c"] : []}
        >
          Devis
        </Button>
      )}
      {hasAccess("INVOICES_WRITE") && (
        <Button
          size="sm"
          to={withSearchAsModel(getRoute(ROUTES.InvoicesEdit, { id: "new" }), schema, {
            type: "invoices",
          })}
          icon={(p) => <PlusIcon {...p} />}
          shortcut={types.includes("invoices") ? ["c"] : []}
        >
          Facture
        </Button>
      )}
    </>
  );
};

export const InvoicesListView = ({
  types,
  title,
  tabs,
  counters,
  activeTab,
  setActiveTab,
  list,
  showCreate = true,
}: {
  types: Invoices["type"][];
  title: string;
  tabs: InvoiceTabs;
  counters: Record<string, number | undefined>;
  activeTab: string;
  setActiveTab: (v: string) => void;
  list: TabInvoices;
  showCreate?: boolean;
}) => {
  const navigate = useNavigateAlt();
  const {
    options,
    setOptions,
    groupBy,
    setGroupBy,
    resetToFirstPage,
    invoicesQueryOptions,
    invoices,
    schema,
    exporter,
  } = list;

  const tableOrder =
    options.index?.split(",")?.filter((a) => a !== groupBy)?.[0] || "";
  const labelColToOrderColMap = {
    state: "state_order",
    "total.total": "(total->>'total')::numeric",
  };

  return (
    <Page
      title={[{ label: title }]}
      bar={
        <SearchBar
          schema={{
            table: "invoices",
            fields: schemaToSearchFields(schema.data, InvoicesFieldsNames()),
          }}
          loading={schema.isPending}
          display={{
            orderBy: (options.index || "")
              .split(",")
              .filter((a) => a !== groupBy),
            groupBy: [groupBy],
            availableOrderBy: ["state", "reference", "emit_date", "total.total"],
            availableGroupBy: ["state"],
            labelColToOrderColMap,
          }}
          onChangeDisplay={(d) => {
            setGroupBy(activeTab === "all" ? "" : d.groupBy[0]);
            setOptions({
              ...options,
              index: _.uniq([d.groupBy, ...d.orderBy].filter(Boolean)).join(","),
            });
            resetToFirstPage.current();
          }}
          onChange={(q, _) => {
            if (q.valid) {
              setOptions({
                ...options,
                query: q.fields,
              });
              resetToFirstPage.current();
            }
          }}
          suffix={
            showCreate ? (
              <CreateButtons types={types} schema={schema.data} />
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
              {Object.entries(tabs).map(([key, tab]) => (
                <Tabs.Trigger key={key} value={key}>
                  {tab.label}
                  {!!counters?.[key] && (
                    <Badge className="ml-2">
                      {formatNumber(counters?.[key] || 0)}
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
          resetToFirstPage={(f) => (resetToFirstPage.current = f)}
          order={{
            orderBy: tableOrder?.split(" ")?.[0],
            order:
              tableOrder?.split(" ")?.[1]?.toLocaleLowerCase() === "asc"
                ? "ASC"
                : "DESC",
          }}
          groupBy={activeTab === "all" ? undefined : groupBy}
          groupByRender={(row) =>
            InvoicesColumns.find(
              (a) =>
                a.id === groupBy ||
                a.id === _.findKey(labelColToOrderColMap, (a) => a === groupBy),
            )?.render?.(row, {})
          }
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
              ...(page.orderBy
                ? {
                    index: [
                      groupBy,
                      page.orderBy
                        ? page.orderBy +
                          ((page.order || "").toLowerCase() !== "desc"
                            ? " asc"
                            : " desc")
                        : "",
                    ]
                      .filter(Boolean)
                      .join(","),
                  }
                : {}),
              asc: true,
            });
          }}
          columns={InvoicesColumns.filter(
            (a) =>
              !(
                types.includes("quotes")
                  ? ["supplier", "origin"]
                  : types.includes("invoices") || types.includes("credit_notes")
                    ? ["supplier"]
                    : []
              ).includes(a.id || ""),
          )}
          onFetchExportData={exporter(invoicesQueryOptions)}
        />
      </div>
    </Page>
  );
};
