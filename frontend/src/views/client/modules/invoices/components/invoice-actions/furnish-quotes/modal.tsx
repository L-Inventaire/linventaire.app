import { Button } from "@atoms/button/button";
import { InputDecorationIcon } from "@atoms/input/input-decoration-icon";
import { Input } from "@atoms/input/input-text";
import Link from "@atoms/link";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { Base, Info } from "@atoms/text";
import { Articles } from "@features/articles/types/types";
import { getContactName } from "@features/contacts/types/types";
import { applySearchFilter } from "@features/utils/format/strings";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { Heading, Separator } from "@radix-ui/themes";
import { useState } from "react";
import { useRecoilState } from "recoil";
import { FurnishQuotesArticle } from "../../../types";
import { ActionButtons, QuantitySlider } from "./modal-components";
import { FurnishQuotesModalAtom, useFurnishArticle } from "./modal-hooks";

export const FurnishQuotesModal = () => {
  const [state, setState] = useRecoilState(FurnishQuotesModalAtom);
  return (
    <Modal
      open={state.open}
      onClose={() => setState((data) => ({ ...data, open: false }))}
    >
      {state && state.id && state.article && (
        <FurnishQuotesModalContent
          id={state.id}
          article={state.article}
          onClose={() => setState((data) => ({ ...data, open: false }))}
        />
      )}
    </Modal>
  );
};

export const FurnishQuotesModalContent = ({
  id,
  article,
  onClose,
}: {
  id: string;
  article: Articles & FurnishQuotesArticle;
  onClose: () => void;
}) => {
  const {
    quote,
    articleFurnishes,
    addSupplier,
    addStock,
    setArticleQuantity,
    getLineDetails,
  } = useFurnishArticle(id, article);

  const [supplierFilter, setSuplierFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  const allOptions = (articleFurnishes ?? []).map((fur) => {
    return {
      fur,
      ...getLineDetails(fur),
    };
  });
  const suppliersOptions = allOptions.filter((a) => a.supplier);
  const filteredSuppliersOptions = suppliersOptions.filter(
    (a) =>
      !a.supplier ||
      applySearchFilter(supplierFilter, getContactName(a.supplier!) || "")
  );

  const stocksOptions = allOptions.filter((a) => a.stock);
  const filteredStocksOptions = stocksOptions.filter((a) =>
    applySearchFilter(stockFilter, a.stock?.serial_number || "")
  );

  return (
    <ModalContent title={"Fournir"}>
      <div key={article.id} className="mb-1">
        <Base className="block">
          Fournir <b>{article.name}</b> pour <b>{quote?.reference}</b>
        </Base>
        <div className="mt-2">
          {(articleFurnishes ?? []).length === 0 && (
            <div>
              <Info>
                Aucun stock ou fournisseur défini pour l'article, cliquer
                ci-dessous pour modifier l'article ou gérer le stock.
              </Info>
            </div>
          )}

          {!!suppliersOptions.length && (
            <div className="mt-4">
              <Separator size="4" className="mb-4" />
              <div className="flex items-center justify-between">
                <Heading size="2" className="grow">
                  Fournisseurs (créer une commande)
                </Heading>
                <InputDecorationIcon
                  className="w-1/3"
                  prefix={(p) => <MagnifyingGlassIcon {...p} />}
                  input={({ className }) => (
                    <Input
                      className={className}
                      placeholder="Filtrer"
                      value={supplierFilter}
                      onChange={(e) => setSuplierFilter(e.target.value)}
                    />
                  )}
                />
              </div>
              <div className="mt-2">
                {filteredSuppliersOptions.map(
                  ({
                    fur,
                    supplier,
                    supplierDetails,
                    furnishText,
                    maxFurnishable,
                    totalValueText,
                  }) => (
                    <div key={fur.ref} className="mb-2">
                      <QuantitySlider
                        title={
                          supplier
                            ? getContactName(supplier)
                            : "Nom du fournisseur inconnu"
                        }
                        supplierDetails={supplierDetails}
                        furnish={fur}
                        furnishText={furnishText}
                        maxFurnishable={maxFurnishable}
                        onSetQuantity={setArticleQuantity}
                      />
                    </div>
                  )
                )}
              </div>
              {suppliersOptions.length > filteredSuppliersOptions.length && (
                <Link
                  onClick={() => setSuplierFilter("")}
                  className="block my-2"
                >
                  Retirer le filtre pour afficher tous les résultats
                </Link>
              )}
            </div>
          )}

          {!!stocksOptions.length && (
            <div className="mt-4">
              <Separator size="4" className="mb-4" />
              <div className="flex items-center justify-between">
                <Heading size="2" className="grow">
                  Stock disponible
                </Heading>
                <InputDecorationIcon
                  className="w-1/3"
                  prefix={(p) => <MagnifyingGlassIcon {...p} />}
                  input={({ className }) => (
                    <Input
                      className={className}
                      placeholder="Filtrer"
                      value={stockFilter}
                      onChange={(e) => setStockFilter(e.target.value)}
                    />
                  )}
                />
              </div>
              <div className="mt-2">
                {filteredStocksOptions.map(
                  ({ fur, stock, furnishText, maxFurnishable }) => (
                    <div key={fur.ref} className="mb-2">
                      <QuantitySlider
                        title={`${
                          stock?.serial_number
                            ? "#" + stock?.serial_number
                            : "Pas de numéro de série"
                        }`}
                        furnish={fur}
                        furnishText={furnishText}
                        maxFurnishable={maxFurnishable}
                        onSetQuantity={setArticleQuantity}
                      />
                    </div>
                  )
                )}
              </div>
              {stocksOptions.length > filteredStocksOptions.length && (
                <Link onClick={() => setStockFilter("")} className="block my-2">
                  Retirer le filtre pour afficher tous les résultats
                </Link>
              )}
            </div>
          )}

          <Separator size="4" className="mb-4" />

          <ActionButtons
            articleId={article.id}
            onAddSupplier={addSupplier}
            onAddStock={addStock}
          />

          <div className="flex justify-end items-center mt-6 w-full">
            <Button size="md" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </ModalContent>
  );
};
