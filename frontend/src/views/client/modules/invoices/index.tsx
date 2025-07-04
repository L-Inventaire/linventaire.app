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
import {
  getDocumentName,
  getDocumentNamePlurial,
} from "@features/invoices/utils";
import { ROUTES, getRoute } from "@features/routes";
import { formatNumber } from "@features/utils/format/strings";
import { useRouterState } from "@features/utils/hooks/use-router-state";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  RestOptions,
  RestSearchQuery,
  useRestExporter,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { ArrowUturnLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@molecules/table/table";
import { Badge, Tabs } from "@radix-ui/themes";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { SearchBar } from "../../../../components/search-bar";
import {
  buildQueryFromMap,
  schemaToSearchFields,
} from "../../../../components/search-bar/utils/utils";
import { computePaymentDelayDate, getInvoiceStatusPrettyName } from "./utils";

export const InvoicesPage = () => {
  const key = useParams().type;
  return <InvoicesPageContent key={key} />;
};

const InvoicesPageContent = () => {
  const type: Invoices["type"][] = (useParams().type?.split("+") || [
    "invoices",
  ]) as any;

  const tabs = {
    all: {
      label:
        type.includes("invoices") || type.includes("credit_notes")
          ? "Comptabilisé"
          : "Tous",
      filter:
        type.includes("invoices") || type.includes("credit_notes")
          ? buildQueryFromMap({ state: "draft" }).map((a) => ({
              ...a,
              not: true,
            }))
          : [],
    },
    draft: {
      label: "Brouillons",
      filter: buildQueryFromMap({ state: "draft" }),
    },
    ...(!type.includes("invoices")
      ? {
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
        }
      : {}),
    ...(type.includes("invoices")
      ? {
          sent: {
            label: "Envoyés",
            filter: [
              ...buildQueryFromMap({
                state: "sent",
              }),
              {
                key: "payment_information.computed_date",
                values: [
                  {
                    value: new Date(new Date().setHours(0, 0, 0, 1)).getTime(),
                    op: "gte",
                  },
                ],
              } as RestSearchQuery,
            ],
          },
          late: {
            label: "Impayés",
            filter: [
              ...buildQueryFromMap({
                state: "sent",
              }),
              {
                key: "payment_information.computed_date",
                values: [
                  {
                    value: new Date(new Date().setHours(0, 0, 0, 0)).getTime(),
                    op: "lte",
                  },
                ],
              } as RestSearchQuery,
            ],
          },
        }
      : {}),
    ...(type.includes("supplier_quotes")
      ? {
          completed: {
            label: "À payer",
            filter: buildQueryFromMap({ state: "completed" }),
          },
        }
      : {}),
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
  const [activeTab, setActiveTab] = useRouterState("tab", "all");

  const [options, setOptions] = useState<RestOptions<Invoices>>({
    index:
      type[0] === "quotes" || type[0] === "supplier_quotes"
        ? activeTab === "all"
          ? "emit_date desc"
          : "state_order,emit_date desc"
        : activeTab === "all"
        ? "reference desc"
        : "state_order,reference desc",
    limit: 20,
    offset: 0,
    query: [],
  });
  const [groupBy, setGroupBy] = useState<string>(
    activeTab === "all" ? "" : "state_order"
  );

  const invoiceFilters = {
    ...options,
    query: [...((options?.query as any) || []), ...buildQueryFromMap({ type })],
  };

  const invoicesQueryOptions = {
    ...invoiceFilters,
    query: [
      ...invoiceFilters.query,
      ...((tabs as any)[activeTab]?.filter || []),
    ],
    asc: true,
    key: "main-" + type.join("+") + "_" + activeTab,
  };
  const { invoices } = useInvoices(invoicesQueryOptions);
  const restExporter = useRestExporter<Invoices>("invoices");

  // Isolated exporter function that conditionally includes fields based on document type
  const exporter =
    (options: RestOptions<Invoices>) =>
    async (pagination: Pick<Pagination, "page" | "perPage">) => {
      const invoices = await restExporter(options)(pagination);
      return invoices.map((invoice) => {
        // Base fields included for all document types
        const baseFields = {
          id: invoice.id,
          reference: invoice.reference,
          type: getDocumentName(invoice.type),
          status: getInvoiceStatusPrettyName(invoice.state, invoice.type),
          emit_date: new Date(invoice.emit_date).toISOString().slice(0, 10),
          name: invoice.name,
          content: (invoice.content || []).map((line) => line.name).join(", "),
          partner: invoice.cache?.partner_names || "",
          partner_id: invoice.client || invoice.supplier,
          partner_recipients: (invoice.recipients || [])
            .map((r) => r.email)
            .join(", "),
          price_currency: invoice.currency,
          price_before_discounts: invoice.total?.initial || 0,
          price_discount: invoice.total?.discount || 0,
          price_taxes: invoice.total?.taxes || 0,
          price_total_ht: invoice.total?.total || 0,
          price_total_ttc: invoice.total?.total_with_taxes || 0,
        };

        // Fields specific to different document types
        const typeSpecificFields: Record<string, any> = {};

        // Due date calculation varies by document type
        typeSpecificFields.due_date =
          invoice.type === "quotes"
            ? computePaymentDelayDate(invoice)
                .toJSDate()
                .toISOString()
                .slice(0, 10)
            : new Date(invoice.payment_information.computed_date)
                .toISOString()
                .slice(0, 10);

        // Payment methods for all types that have payment_information
        if (invoice.payment_information?.mode) {
          typeSpecificFields.payment_methods = (
            invoice.payment_information.mode || []
          ).join(", ");
        }

        // Fields specific to quotes in recurring state
        if (invoice.type === "quotes" && invoice.state === "recurring") {
          typeSpecificFields.recurrence_next_invoice =
            invoice.subscription_next_invoice_date;
        }

        // Fields specific to invoices with subscription information
        if (invoice.from_subscription) {
          typeSpecificFields.recurrence_frequency =
            invoice.from_subscription.frequency || "";

          if (invoice.from_subscription.from) {
            typeSpecificFields.recurrence_period_from = new Date(
              invoice.from_subscription.from
            )
              .toISOString()
              .slice(0, 10);
          }

          if (invoice.from_subscription.to) {
            typeSpecificFields.recurrence_period_to = new Date(
              invoice.from_subscription.to
            )
              .toISOString()
              .slice(0, 10);
          }
        }

        // Fields specific to invoices and credit notes
        if (invoice.type === "invoices" || invoice.type === "credit_notes") {
          typeSpecificFields.paid = invoice?.transactions?.percentage >= 100;

          if (invoice.from_rel_quote && invoice.from_rel_quote.length > 0) {
            typeSpecificFields.from_quotes_id =
              invoice.from_rel_quote.join(", ");
            typeSpecificFields.from_quotes_reference =
              invoice.cache?.from_rel_quote_ref || "";
          }
        }

        // Return combined object with only the fields relevant to this document type
        return { ...baseFields, ...typeSpecificFields };
      });
    };

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
    query: [...tabs.sent!.filter, ...invoiceFilters.query],
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
  const { invoices: completedInvoices } = useInvoices({
    key: "completedInvoices",
    limit: 1,
    query: [...invoiceFilters.query, ...(tabs.completed?.filter || [])],
  });
  const { invoices: lateInvoices } = useInvoices({
    key: "lateInvoices",
    limit: 1,
    query: [...invoiceFilters.query, ...(tabs.late?.filter || [])],
  });
  const counters = {
    draft: draftInvoices?.data?.total || 0,
    sent: sentInvoices?.data?.total || 0,
    purchase_order: inProgressInvoices?.data?.total || 0,
    recurring: recurringInvoices?.data?.total || 0,
    completed: completedInvoices?.data?.total || 0,
    late: lateInvoices?.data?.total || 0,
  };

  const resetToFirstPage = useRef(() => {});

  const tableOrder =
    options.index?.split(",")?.filter((a) => a !== groupBy)?.[0] || "";
  const labelColToOrderColMap = {
    state: "state_order",
    "total.total": "(total->>'total')::numeric",
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
          loading={schema.isPending}
          display={{
            orderBy: (options.index || "")
              .split(",")
              .filter((a) => a !== groupBy),
            groupBy: [groupBy],
            availableOrderBy: [
              "state",
              "reference",
              "emit_date",
              "total.total",
            ],
            availableGroupBy: ["state"],
            labelColToOrderColMap,
          }}
          onChangeDisplay={(d) => {
            setGroupBy(activeTab === "all" ? "" : d.groupBy[0]);
            setOptions({
              ...options,
              index: _.uniq([d.groupBy, ...d.orderBy].filter(Boolean)).join(
                ","
              ),
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
                a.id === _.findKey(labelColToOrderColMap, (a) => a === groupBy)
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
          onFetchExportData={exporter(invoicesQueryOptions)}
        />
      </div>
    </Page>
  );
};
