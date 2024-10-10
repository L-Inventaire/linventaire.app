import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { getUnitLabel, Unit } from "@atoms/input/input-unit";
import Link from "@atoms/link";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { FormInput } from "@components/form/fields";
import { RestDocumentsInput } from "@components/input-rest";
import { useArticle } from "@features/articles/hooks/use-articles";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { useStockItems } from "@features/stock/hooks/use-stock-items";
import { StockItems } from "@features/stock/types/types";
import { Blockquote, Callout, Separator, Tabs } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { atom, useRecoilState } from "recoil";
import { StockItemStatus } from "./stock-item-status";
import toast from "react-hot-toast";
import _ from "lodash";
import { getRoute, ROUTES } from "@features/routes";
import { useNavigate } from "react-router-dom";
import { getArticleIcon } from "../../articles/components/article-icon";
import { Articles } from "@features/articles/types/types";
import { useTranslation } from "react-i18next";

export const SubdivideStockModalAtom = atom<{
  open: boolean;
  item?: StockItems;
}>({
  key: "SubdivideStockModalAtom",
  default: {
    open: false,
  },
});

export const SubdivideStockModal = () => {
  const [modal, setModal] = useRecoilState(SubdivideStockModalAtom);
  return (
    <Modal
      open={modal.open}
      onClose={() => {
        setModal({ open: false });
      }}
    >
      {modal.open && <SubdivideStockModalContent />}
    </Modal>
  );
};

const SubdivideStockModalContent = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"subdivide" | "piece">("subdivide");
  const [seeMore, setSeeMore] = useState(false);
  const navigate = useNavigate();

  const [modal, setModal] = useRecoilState(SubdivideStockModalAtom);
  const [quantity, setQuantity] = useState<number>(0);
  const [reference, setReference] = useState<string>(
    modal.item?.serial_number || ""
  );
  const [status, setStatus] = useState<string>(modal.item?.state || "");
  const [articleId, setArticleId] = useState<string>(modal.item?.article || "");
  const [location, setLocation] = useState<string>(modal.item?.location || "");
  const [client, setClient] = useState<string>(modal.item?.client || "");
  const { article } = useArticle(
    mode === "piece" ? articleId : modal?.item?.article || ""
  );

  const { invoice: quote } = useInvoice(modal.item?.for_rel_quote || "");
  const { invoice: order } = useInvoice(
    modal.item?.from_rel_supplier_quote || ""
  );

  const [loading, setLoading] = useState(false);
  const { create, update } = useStockItems();

  useEffect(() => {
    if (mode === "piece") {
      setReference("");
      setQuantity(1);
    } else {
      setQuantity(0);
      setReference(modal.item?.serial_number || "");
    }
  }, [mode]);

  return (
    <ModalContent title="Subdiviser le stock">
      <div className="space-y-4">
        <Tabs.Root value={mode} onValueChange={setMode as any}>
          <Tabs.List>
            <Tabs.Trigger value="subdivide">Subdiviser</Tabs.Trigger>
            <Tabs.Trigger value="piece">Pièce détachée</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>

        {mode === "subdivide" && (
          <Blockquote>
            Vous êtes sur le point de subdiviser un stock. C'est à dire créer un
            nouveau élément dans le stock et diminuer la quantité de l'élément
            d'origine.
          </Blockquote>
        )}

        {mode === "piece" && (
          <Blockquote>
            Vous êtes sur le point de créer une pièce détachée. C'est à dire
            créer un nouvel élément dans le stock sans diminuer la quantité de
            l'élément d'origine.
          </Blockquote>
        )}

        {mode === "piece" && (
          <RestDocumentsInput
            className="w-full"
            entity="articles"
            value={articleId}
            onChange={setArticleId}
            placeholder="Aucun article"
            label="Article"
            icon={(p, article) =>
              getArticleIcon((article as Articles)?.type)(p)
            }
            size="lg"
          />
        )}

        <div className="flex flex-row space-x-2">
          <FormInput
            disabled={loading}
            label={"Quantité (" + getUnitLabel(article?.unit, t) + ")"}
            type="number"
            value={quantity}
            onChange={setQuantity}
          />
        </div>

        {mode === "subdivide" && (
          <Callout.Root>
            <p>
              L'élément original passera à{" "}
              <b>
                {(modal.item?.quantity || 0) - quantity}{" "}
                <Unit unit={article?.unit} />{" "}
              </b>
              après l'opération.
            </p>
          </Callout.Root>
        )}

        <FormInput
          disabled={loading}
          label="Référence"
          type="text"
          placeholder="Référence"
          value={reference}
          onChange={setReference}
        />

        {!seeMore && (
          <Link className="block" onClick={() => setSeeMore(true)}>
            Afficher les autres réglages
          </Link>
        )}

        {seeMore && (
          <>
            <Separator size="4" />

            <InputLabel
              label="Status"
              input={
                <StockItemStatus
                  readonly={loading}
                  value={status as any}
                  onChange={setStatus}
                  size="sm"
                />
              }
            />

            <InputLabel
              label="Localisation"
              input={
                <RestDocumentsInput
                  disabled={loading}
                  className="w-full"
                  size="lg"
                  entity="stock_locations"
                  value={location}
                  onChange={setLocation}
                  placeholder="Aucune localisation"
                  label="Localisation de l'élément"
                />
              }
            />

            <InputLabel
              label="Chez le contact"
              input={
                <RestDocumentsInput
                  disabled={loading}
                  className="w-full"
                  size="lg"
                  entity="contacts"
                  filter={
                    quote || order
                      ? ({
                          id: [
                            quote?.client,
                            quote?.contact,
                            order?.supplier,
                          ].filter(Boolean),
                        } as any)
                      : {}
                  }
                  value={client}
                  onChange={setClient}
                  placeholder="N'est pas chez un contact"
                  label="Chez le contact"
                />
              }
            />
          </>
        )}

        <Separator size="4" />

        <Button
          disabled={
            quantity <= 0 ||
            (quantity > (modal.item?.quantity || 0) && mode === "subdivide") ||
            !article
          }
          loading={loading}
          onClick={async () => {
            setLoading(true);
            try {
              const res = await create.mutateAsync({
                ..._.omit(modal.item, "id"),
                article: mode === "subdivide" ? modal.item?.article : articleId,
                original_quantity: quantity,
                quantity,
                serial_number: reference,
                state: status as any,
                location,
                client,
                from_rel_original_stock_item: modal.item?.id,
                notes: "",
                documents: [],
              });
              if (res.id) {
                if (mode === "subdivide") {
                  await update.mutateAsync({
                    id: modal.item?.id,
                    quantity: (modal.item?.quantity || 0) - quantity,
                  });
                }
                navigate(getRoute(ROUTES.StockView, { id: res.id }));
                setModal({ open: false });
              } else {
                throw new Error("Erreur lors de la subdivision du stock");
              }
            } catch (e) {
              console.error(e);
              toast.error("Erreur lors de la subdivision du stock");
            } finally {
              setLoading(false);
            }
          }}
        >
          {mode === "subdivide" ? "Subdiviser" : "Créer une pièce détachée"}
        </Button>
      </div>
    </ModalContent>
  );
};
