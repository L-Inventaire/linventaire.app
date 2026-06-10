import { Invoices } from "@features/invoices/types/types";
import { getDocumentNamePlurial } from "@features/invoices/utils";
import {
  RestSearchQuery,
  useRestCount,
} from "@features/utils/rest/hooks/use-rest";
import { buildQueryFromMap } from "../../../../../components/search-bar/utils/utils";
import { InvoiceTabs } from "./use-tab-invoices";

export type InvoicesTabsResult = {
  types: Invoices["type"][];
  title: string;
  tabs: InvoiceTabs;
  counters: Record<string, number | undefined>;
};

const useCount = (key: string, query: RestSearchQuery[]) =>
  useRestCount("invoices", { key, query }).data || 0;

/** Devis */
export const useQuotesTabs = (): InvoicesTabsResult => {
  const types: Invoices["type"][] = ["quotes"];
  const base = buildQueryFromMap({ type: types });
  const tabs: InvoiceTabs = {
    all: { label: "Tous", filter: [] },
    draft: { label: "Brouillons", filter: buildQueryFromMap({ state: "draft" }) },
    sent: { label: "Envoyés", filter: buildQueryFromMap({ state: "sent" }) },
    purchase_order: {
      label: "Acceptés",
      filter: buildQueryFromMap({ state: "purchase_order" }),
    },
    completed: {
      label: "À facturer",
      filter: buildQueryFromMap({ state: "completed" }),
    },
    closed: { label: "Terminés", filter: buildQueryFromMap({ state: ["closed"] }) },
  };
  const counters = {
    draft: useCount("quotes-draft", [...base, ...tabs.draft.filter]),
    sent: useCount("quotes-sent", [...base, ...tabs.sent.filter]),
    purchase_order: useCount("quotes-purchase_order", [
      ...base,
      ...tabs.purchase_order.filter,
    ]),
    completed: useCount("quotes-completed", [...base, ...tabs.completed.filter]),
  };
  return { types, title: "Devis", tabs, counters };
};

/** Abonnements (devis récurrents + rappels de vérification) */
export const useSubscriptionsTabs = (): InvoicesTabsResult => {
  const types: Invoices["type"][] = ["quotes"];
  const base = buildQueryFromMap({ type: types });
  // "À vérifier" only concerns active subscriptions whose review date has
  // passed. Note: the upper bound is the start of the day (a stable value) and
  // not `Date.now()` which would change on every render and trigger an infinite
  // refetch loop.
  const reviewFilter: RestSearchQuery[] = [
    ...buildQueryFromMap({ state: "recurring" }),
    { key: "next_review_date", values: [{ value: 1, op: "gte" }] },
    {
      key: "next_review_date",
      values: [
        {
          value: new Date(new Date().setHours(0, 0, 0, 1)).getTime(),
          op: "lte",
        },
      ],
    },
  ];
  const closedFilter: RestSearchQuery[] = [
    ...buildQueryFromMap({ state: "closed" }),
    ...buildQueryFromMap({ has_subscription: true }),
  ];
  const tabs: InvoiceTabs = {
    active: {
      label: "Actifs",
      filter: buildQueryFromMap({ state: "recurring" }),
    },
    review: { label: "À vérifier", filter: reviewFilter },
    closed: { label: "Terminés", filter: closedFilter },
  };
  const counters = {
    active: useCount("subscriptions-active", [...base, ...tabs.active.filter]),
    review: useCount("subscriptions-review", [...base, ...reviewFilter]),
    closed: useCount("subscriptions-closed", [...base, ...closedFilter]),
  };
  return { types, title: "Abonnements", tabs, counters };
};

/** Factures et avoirs */
export const useDocumentsTabs = (
  documentType: "invoices" | "credit_notes",
): InvoicesTabsResult => {
  const types: Invoices["type"][] = [documentType];
  const base = buildQueryFromMap({ type: types });
  const isInvoices = documentType === "invoices";
  const tabs: InvoiceTabs = {
    all: {
      label: "Comptabilisé",
      filter: buildQueryFromMap({ state: "draft" }).map((a) => ({
        ...a,
        not: true,
      })),
    },
    draft: { label: "Brouillons", filter: buildQueryFromMap({ state: "draft" }) },
    sent: {
      label: "Envoyés",
      filter: isInvoices
        ? [
            ...buildQueryFromMap({ state: "sent" }),
            {
              key: "payment_information.computed_date",
              values: [
                {
                  value: new Date(new Date().setHours(0, 0, 0, 1)).getTime(),
                  op: "gte",
                },
              ],
            },
          ]
        : buildQueryFromMap({ state: "sent" }),
    },
    ...(isInvoices
      ? {
          late: {
            label: "Impayés",
            filter: [
              ...buildQueryFromMap({ state: "sent" }),
              {
                key: "payment_information.computed_date",
                values: [
                  {
                    value: new Date(new Date().setHours(0, 0, 0, 0)).getTime(),
                    op: "lte",
                  },
                ],
              },
            ],
          },
        }
      : {}),
    closed: { label: "Terminés", filter: buildQueryFromMap({ state: ["closed"] }) },
  };
  const draftCount = useCount(documentType + "-draft", [
    ...base,
    ...tabs.draft.filter,
  ]);
  const sentCount = useCount(documentType + "-sent", [
    ...base,
    ...tabs.sent.filter,
  ]);
  const lateCount = useCount(documentType + "-late", [
    ...base,
    ...((tabs as any).late?.filter || []),
  ]);
  const counters = {
    draft: draftCount,
    sent: sentCount,
    late: isInvoices ? lateCount : undefined,
  };
  return { types, title: getDocumentNamePlurial(documentType), tabs, counters };
};

/** Commandes fournisseur */
export const useSupplierQuotesTabs = (): InvoicesTabsResult => {
  const types: Invoices["type"][] = ["supplier_quotes"];
  const base = buildQueryFromMap({ type: types });
  const tabs: InvoiceTabs = {
    all: { label: "Tous", filter: [] },
    draft: { label: "Brouillons", filter: buildQueryFromMap({ state: "draft" }) },
    sent: {
      label: "Commandé",
      filter: buildQueryFromMap({ state: ["sent", "purchase_order"] }),
    },
    completed: {
      label: "À payer",
      filter: buildQueryFromMap({ state: "completed" }),
    },
    closed: { label: "Terminés", filter: buildQueryFromMap({ state: ["closed"] }) },
  };
  const counters = {
    draft: useCount("supplier_quotes-draft", [...base, ...tabs.draft.filter]),
    sent: useCount("supplier_quotes-sent", [...base, ...tabs.sent.filter]),
    completed: useCount("supplier_quotes-completed", [
      ...base,
      ...tabs.completed.filter,
    ]),
  };
  return { types, title: "Commandes", tabs, counters };
};

/** Factures et avoirs fournisseur */
export const useSupplierDocumentsTabs = (): InvoicesTabsResult => {
  const types: Invoices["type"][] = ["supplier_invoices", "supplier_credit_notes"];
  const base = buildQueryFromMap({ type: types });
  const tabs: InvoiceTabs = {
    all: { label: "Tous", filter: [] },
    draft: { label: "Brouillons", filter: buildQueryFromMap({ state: "draft" }) },
    sent: { label: "À payer", filter: buildQueryFromMap({ state: "sent" }) },
    closed: { label: "Terminés", filter: buildQueryFromMap({ state: ["closed"] }) },
  };
  const counters = {
    draft: useCount("supplier_invoices-draft", [...base, ...tabs.draft.filter]),
    sent: useCount("supplier_invoices-sent", [...base, ...tabs.sent.filter]),
  };
  return {
    types,
    title: getDocumentNamePlurial("supplier_invoices"),
    tabs,
    counters,
  };
};
