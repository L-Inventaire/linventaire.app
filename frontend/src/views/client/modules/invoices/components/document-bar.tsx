import { Button } from "@atoms/button/button";
import { DocumentBar } from "@components/document-bar";
import { withModel } from "@components/search-bar/utils/as-model";
import { useHasAccess } from "@features/access";
import { useClients } from "@features/clients/state/use-clients";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { Invoices } from "@features/invoices/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import _ from "lodash";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPdfPreview } from "../components/invoices-preview/invoices-preview";

export const InvoicesDocumentBar = ({
  id,
  readonly,
  onClose,
  onSave,
  onChangeMode,
}: {
  id: string;
  readonly?: boolean;
  onClose?: () => void;
  onSave?: () => Promise<void>;
  onChangeMode?: (mode: "write" | "read") => void;
}) => {
  const { invoice, isPending, remove, restore } = useInvoice(id || "");
  const navigate = useNavigate();
  const { client: clientId } = useParams();
  const hasAccess = useHasAccess();

  if (readonly) {
    if (!invoice) return <></>;

    // Invoices has a special access right system
    const hasWriteType =
      invoice.type === "invoices" || invoice.type === "credit_notes"
        ? hasAccess("INVOICES_WRITE")
        : invoice.type === "quotes"
        ? hasAccess("QUOTES_WRITE")
        : invoice.type === "supplier_invoices" ||
          invoice.type === "supplier_credit_notes"
        ? hasAccess("SUPPLIER_INVOICES_WRITE")
        : hasAccess("SUPPLIER_QUOTES_WRITE");

    return (
      <DocumentBar
        loading={isPending && !invoice}
        entity={"invoices"}
        document={invoice || { id }}
        mode={"read"}
        backRoute={getRoute(ROUTES.Invoices, { type: invoice.type })}
        editRoute={hasWriteType ? ROUTES.InvoicesEdit : undefined}
        viewRoute={ROUTES.InvoicesView}
        onPrint={async () => getPdfPreview(invoice)}
        onClose={onClose}
        onChangeMode={onChangeMode}
        onRemove={
          invoice?.id && invoice?.state === "draft" && hasWriteType
            ? async () => remove.mutateAsync(invoice?.id)
            : undefined
        }
        onRestore={
          invoice?.id && hasWriteType
            ? async () => restore.mutateAsync(invoice?.id)
            : undefined
        }
        suffix={
          hasWriteType ? (
            <>
              {invoice.type === "quotes" &&
                (invoice.content ?? []).some(
                  (line) =>
                    line.type === "product" || line.type === "consumable"
                ) && (
                  <>
                    <Button
                      theme="outlined"
                      size="sm"
                      shortcut={["f"]}
                      onClick={() => {
                        navigate(
                          getRoute(ROUTES.FurnishQuotes, {
                            client: clientId,
                            id,
                          })
                        );
                      }}
                    >
                      Fournir les produits
                    </Button>
                  </>
                )}
              {invoice.type === "invoices" && (
                <Button
                  size="sm"
                  theme="outlined"
                  shortcut={["shift+a"]}
                  disabled={["draft"].includes(invoice.state)}
                  to={withModel(getRoute(ROUTES.InvoicesEdit, { id: "new" }), {
                    ..._.omit(
                      invoice,
                      "id",
                      "emit_date",
                      "reference_preferred_value"
                    ),
                    from_rel_quote: invoice.from_rel_quote,
                    from_rel_invoice: [invoice.id],
                    type: "credit_notes",
                    state: "draft",
                    id: "",
                  })}
                >
                  Créer un avoir
                </Button>
              )}
            </>
          ) : undefined
        }
      />
    );
  }

  return (
    <InvoicesDocumentBarEdition
      id={id}
      onClose={onClose}
      onSave={onSave}
      onChangeMode={onChangeMode}
    />
  );
};

const InvoicesDocumentBarEdition = ({
  id,
  onClose,
  onSave,
  onChangeMode,
}: {
  id: string;
  onClose?: () => void;
  onSave?: () => Promise<void>;
  onChangeMode?: (mode: "write" | "read") => void;
}) => {
  const { refresh, loading } = useClients();

  useEffect(() => {
    refresh();
  }, []);

  id = id === "new" ? "" : id || "";

  const { isInitiating, save, draft, remove, restore } =
    useReadDraftRest<Invoices>("invoices", id || "new", false);

  return (
    <DocumentBar
      loading={isInitiating || loading}
      entity={"invoices"}
      document={draft}
      mode={"write"}
      onSave={async () => {
        if (onSave) {
          await onSave?.();
        } else {
          await save();
        }
      }}
      onClose={onClose}
      onChangeMode={onChangeMode}
      backRoute={getRoute(ROUTES.Invoices, { type: draft.type })}
      viewRoute={ROUTES.InvoicesView}
      editRoute={ROUTES.InvoicesEdit}
      onRemove={draft.id ? remove : undefined}
      onRestore={draft.id ? restore : undefined}
    />
  );
};
