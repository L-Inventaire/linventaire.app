import { Button } from "@atoms/button/button";
import { Input } from "@atoms/input/input-text";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { Base, Info } from "@atoms/text";
import { Articles } from "@features/articles/types/types";
import { getContactName } from "@features/contacts/types/types";
import { useEditFromCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { useFurnishQuotes } from "@features/invoices/hooks/use-furnish-quotes";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { StockItems } from "@features/stock/types/types";
import { debounce } from "@features/utils/debounce";
import { formatAmount } from "@features/utils/format/strings";
import { CircleStackIcon, UserIcon } from "@heroicons/react/16/solid";
import { Slider } from "@radix-ui/themes";
import _ from "lodash";
import { useCallback } from "react";
import { atom, useRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";
import { FurnishQuotesArticle, FurnishQuotesFurnish } from "../../types";

export type FurnishQuotesModalType = {
  open: boolean;
  id: string;
  article: (Articles & FurnishQuotesArticle) | null;
};

export const FurnishQuotesModalAtom = atom<FurnishQuotesModalType>({
  key: "FurnishQuotesModalAtom",
  default: {
    open: false,
    id: "",
    article: null,
  },
});

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
}: {
  id: string;
  article: Articles & FurnishQuotesArticle;
  onClose: () => void;
}) => {
  const quote = useInvoice(id || "");
  const edit = useEditFromCtrlK();

  const {
    furnishQuotes,
    suppliers,
    stocks,
    modifiedFurnishes,
    setFurnishesOverride,
    furnishesTextValues,
    setFurnishesTextValues,
    refetchFurnishQuotes,
  } = useFurnishQuotes(quote.invoice ? [quote.invoice] : []);

  const addSupplier = async (articleID: string) => {
    edit<Articles>("articles", articleID, {}, async () => {
      await refetchFurnishQuotes();
    });
  };
  const addStock = async (articleID: string) => {
    edit<StockItems>(
      "stock_items",
      "",
      {
        article: articleID,
      },
      async () => {
        await refetchFurnishQuotes();
      }
    );
  };

  const setArticleQuantity = useCallback(
    (fur: FurnishQuotesFurnish, value: number) => {
      if (value < 0) return;

      setFurnishesTextValues((data) =>
        data.map((f) =>
          f.ref === fur.ref ? { ref: fur.ref, value: value.toString() } : f
        )
      );

      debounce(
        () => {
          setFurnishesOverride((data) => {
            const found = data.find((f) => f.ref === fur.ref);
            if (found) {
              return data.map((f) =>
                f.ref === fur.ref ? { ...f, quantity: value } : f
              );
            }
            return [...data, { ...fur, quantity: value }];
          });
        },
        {
          key: "furnish:quotes:set",
          timeout: 1000,
          doInitialCall: true,
        }
      );
    },
    [furnishesTextValues, furnishQuotes]
  );

  const articleFurnishes = modifiedFurnishes.filter(
    (fur) => fur.articleID === article.id && fur.supplierID !== null
  );

  const totalMax = article.totalToFurnish ?? 0;

  return (
    <ModalContent title={"Fournir"}>
      <div key={article.id} className="mt-4 mb-1 px-4">
        <Base className="block mb-6">
          Fournir {article.name} pour {quote.invoice?.reference}
        </Base>
        <div className="mt-2">
          {(articleFurnishes ?? []).length === 0 && (
            <div>
              <Info>Aucun stock ou fournisseur défini pour l'article</Info>
              <div className="flex items-center mt-4">
                <Button
                  theme="outlined"
                  className="mr-2"
                  onClick={() => addSupplier(article.id)}
                  icon={(props) => <UserIcon {...props} />}
                  data-tooltip="Ajouter un fournisseur"
                >
                  +
                </Button>
                <Button
                  onClick={() => addStock(article.id)}
                  icon={(props) => <CircleStackIcon {...props} />}
                  data-tooltip="Ajouter un stock"
                >
                  +
                </Button>
              </div>
            </div>
          )}
          {(articleFurnishes ?? []).map((fur) => {
            const supplier = (suppliers?.data?.list ?? []).find(
              (supp) => supp.id === fur?.supplierID
            );
            const supplierDetails =
              article.suppliers_details?.[supplier?.id ?? ""] ?? {};

            const stock = (stocks?.data?.list ?? []).find(
              (stock) => stock.id === fur?.stockID
            );

            const furnishText = furnishesTextValues.find(
              (v) => v.ref === fur.ref
            );

            const maxFurnishable =
              (fur.maxAvailable
                ? fur.maxAvailable
                : supplier
                ? totalMax
                : stock?.quantity) ?? 0;

            const totalValueText = (articleFurnishes ?? []).reduce(
              (acc, fur) => {
                const text = furnishesTextValues.find((v) => v.ref === fur.ref);
                return acc + parseInt(text?.value ?? "0");
              },
              0
            );

            return (
              <div className="mb-2">
                {supplier && (
                  <>
                    <Info className="block text-slate-600">
                      {getContactName(supplier)}
                    </Info>
                    {supplierDetails && (
                      <Info>
                        {supplierDetails.price && (
                          <>prix: {formatAmount(supplierDetails.price)} - </>
                        )}
                        {supplierDetails.delivery_quantity && (
                          <>{supplierDetails.delivery_quantity} en stock - </>
                        )}
                        {supplierDetails.delivery_time && (
                          <>livraison {supplierDetails.delivery_time}j</>
                        )}
                      </Info>
                    )}
                  </>
                )}
                {stock && (
                  <Info className="block text-slate-600">
                    Stock {stock?.serial_number && " - " + stock?.serial_number}
                  </Info>
                )}
                <div className="flex w-full items-center justify-between">
                  <Slider
                    key={fur.ref}
                    className={"grow mr-3"}
                    value={[
                      (parseInt(furnishText?.value ?? "0") / maxFurnishable) *
                        100,
                    ]}
                    onValueChange={(value) => {
                      setArticleQuantity(
                        fur,
                        Math.round((value[0] / 100) * maxFurnishable)
                      );
                    }}
                  />
                  <Input
                    value={furnishText?.value ?? ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!_.isNaN(value)) {
                        setArticleQuantity(fur, value);
                      }
                    }}
                    type="number"
                    pattern="\d*"
                    size="md"
                    className={twMerge("grow-0 mr-1")}
                    style={{
                      width: `${totalValueText.toString().length + 5}ch`,
                    }}
                  />
                  <Info className="w-16 whitespace-nowrap">
                    / {maxFurnishable}
                  </Info>
                </div>
              </div>
            );
          })}

          <div className="flex justify-end items-center mt-6 w-full">
            <Button
              theme="outlined"
              className="mr-2"
              onClick={() => addSupplier(article.id)}
              icon={(props) => <UserIcon {...props} />}
              data-tooltip="Ajouter un fournisseur"
            >
              +
            </Button>
            <Button
              onClick={() => addStock(article.id)}
              icon={(props) => <CircleStackIcon {...props} />}
              data-tooltip="Ajouter un stock"
            >
              +
            </Button>
          </div>
        </div>
      </div>
    </ModalContent>
  );
};
