import { Alert } from "@atoms/alert";
import { Input } from "@atoms/input/input-text";
import { DelayedLoader } from "@atoms/loader";
import { Base, BaseSmall, Info, Section, SectionSmall } from "@atoms/text";
import { generateQueryFromMap } from "@components/search-bar/utils/utils";
import { useFurnishQuotes } from "@features/invoices/hooks/use-furnish-quotes";
import { useInvoice, useInvoices } from "@features/invoices/hooks/use-invoices";
import { debounce } from "@features/utils/debounce";
import { formatAmount } from "@features/utils/format/strings";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Card, Slider } from "@radix-ui/themes";
import { prettyContactName } from "@views/client/modules/contacts/utils";
import _, { max } from "lodash";
import { useCallback } from "react";
import { twMerge } from "tailwind-merge";
import { FurnishQuotesFurnish } from "../../types";
import { useStockItems } from "@features/stock/hooks/use-stock-items";
import { useNavigate } from "react-router-dom";
import { getRoute, ROUTES } from "@features/routes";
import { Button } from "@atoms/button/button";
import { useEditFromCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { Contacts } from "@features/contacts/types/types";
import { Articles } from "@features/articles/types/types";
import { StockItems } from "@features/stock/types/types";
import { CircleStackIcon, UserIcon } from "@heroicons/react/16/solid";

export const FursnishQuotesDetails = ({ id }: { id?: string }) => {
  const quote = useInvoice(id || "");
  const edit = useEditFromCtrlK();

  const {
    furnishQuotes,
    grouppedByArticles,
    articles,
    suppliers,
    stocks,
    actions,
    modifiedFurnishes,
    setFurnishesOverride,
    furnishesTextValues,
    setFurnishesTextValues,
  } = useFurnishQuotes(quote.invoice ? [quote.invoice] : []);

  const { invoices: existantSupplierQuotes } = useInvoices({
    query: [
      ...generateQueryFromMap({
        from_rel_quote: [id ?? "_"],
        type: "supplier_quotes",
      }),
    ],
  });

  const { stock_items: reservedStocks } = useStockItems({
    query: [
      ...generateQueryFromMap({
        for_rel_quote: id ?? "_",
      }),
    ],
  });

  const navigate = useNavigate();

  const addSupplier = (articleID: string) => {
    edit<Articles>("articles", articleID);
  };
  const addStock = (articleID: string) => {
    edit<StockItems>("stock_items", "", {
      article: articleID,
    });
  };

  // function setTotalArticleQuantity(
  //   articleID: string,
  //   value: number,
  //   forceValue = false
  // ) {
  //   const articleFurnishes = grouppedByArticles[articleID];

  //   const currentValue = (articleFurnishes ?? []).reduce(
  //     (acc, fur) => acc + fur.quantity,
  //     0
  //   );
  //   const initialDelta = value - currentValue;
  //   let delta = initialDelta;

  //   let counter = 0;
  //   const alteredFurnishes: FurnishQuotesFurnish[] = [];

  //   while (Math.abs(delta) > 0 && counter <= Math.abs(initialDelta)) {
  //     let furnish: FurnishQuotesFurnish | null = null;
  //     let furnishes = articleFurnishes;

  //     furnishes = furnishes
  //       .sort((furA, furB) => {
  //         const locked = modifiedFurnishes.map((fur) => fur.ref);
  //         if (locked.includes(furA.ref) && locked.includes(furA.ref)) return 0;
  //         if (locked.includes(furA.ref)) return 1;
  //         if (locked.includes(furB.ref)) return -1;

  //         if (furA.stockID && furB.stockID) return 0;
  //         if (furA.stockID) return 1;
  //         if (furB.stockID) return -1;

  //         return furA.quantity - furB.quantity;
  //       })
  //       .filter((fur) => !lockedFurnishesRefs.includes(fur.ref));

  //     if (delta > 0) {
  //       furnish =
  //         furnishes.find(
  //           (fur) =>
  //             fur.quantity < (fur.maxAvailable ?? 0) &&
  //             fur.quantity < (fur.totalToFurnish ?? 0)
  //         ) ?? null;

  //       if (!furnish && forceValue) furnish = _.first(furnishes) ?? null;

  //       if (!furnish) break;

  //       furnish.quantity++;
  //       delta--;
  //     }
  //     if (delta < 0) {
  //       furnish = furnishes.find((fur) => fur.quantity > 0) ?? null;

  //       if (!furnish) break;
  //       furnish.quantity--;
  //       delta++;
  //     }

  //     if (furnish) alteredFurnishes.push(furnish);

  //     furnish = null;
  //     counter++;
  //   }

  //   setFurnishesOverride((data) =>
  //     _.uniqBy(
  //       [...data, ...alteredFurnishes].filter(
  //         Boolean
  //       ) as FurnishQuotesFurnish[],
  //       "ref"
  //     )
  //   );
  // }

  // function setArticleQuantity(
  //   furnish: FurnishQuotesFurnish,
  //   value: number,
  //   forceValue = false
  // ) {
  //   const articleFurnishes = grouppedByArticles[furnish.articleID];

  //   const max = furnish.maxAvailable ?? furnish.totalToFurnish ?? 0;

  //   const currentValue = furnish.quantity;
  //   let delta = value - currentValue;

  //   let counter = 0;
  //   const modifiedFurnishes: FurnishQuotesFurnish[] = [];

  //   while (Math.abs(delta) > 0 && counter <= max) {
  //     let donorFurnish: FurnishQuotesFurnish | null = null;
  //     let furnishes = articleFurnishes.filter((fur) => fur.ref !== furnish.ref);

  //     furnishes = furnishes
  //       .sort((furA, furB) => {
  //         const locked = modifiedFurnishes.map((fur) => fur.ref);
  //         if (locked.includes(furA.ref) && locked.includes(furA.ref)) return 0;
  //         if (locked.includes(furA.ref)) return 1;
  //         if (locked.includes(furB.ref)) return -1;

  //         if (furA.stockID && furB.stockID) return 0;
  //         if (furA.stockID) return -1;
  //         if (furB.stockID) return 1;

  //         return furA.quantity - furB.quantity;
  //       })
  //       .filter((fur) => !lockedFurnishesRefs.includes(fur.ref));

  //     if (delta > 0) {
  //       donorFurnish = furnishes.find((fur) => fur.quantity > 0) ?? null;

  //       if (!donorFurnish && !forceValue) break;
  //       furnish.quantity++;

  //       if (donorFurnish) donorFurnish.quantity--;
  //       delta--;
  //     }
  //     if (delta < 0) {
  //       donorFurnish =
  //         furnishes.find(
  //           (fur) =>
  //             fur.quantity < (fur.maxAvailable ?? fur.totalToFurnish ?? 0)
  //         ) ?? null;

  //       if (!donorFurnish && !forceValue) break;
  //       furnish.quantity--;

  //       if (donorFurnish) donorFurnish.quantity++;
  //       delta++;
  //     }

  //     if (furnish) modifiedFurnishes.push(furnish);
  //     if (donorFurnish) modifiedFurnishes.push(donorFurnish);

  //     donorFurnish = null;
  //     counter++;
  //   }

  //   setFurnishesOverride((data) =>
  //     _.uniqBy(
  //       [...data, ...modifiedFurnishes].filter(
  //         Boolean
  //       ) as FurnishQuotesFurnish[],
  //       "ref"
  //     )
  //   );
  //   setModifiedFurnishesRefs((data) => _.uniq([...data, furnish.ref]));
  //   if (forceValue)
  //     setLockedFurnishesRefs((data) => _.uniq([...data, furnish.ref]));
  // }

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

  if (!modifiedFurnishes)
    return (
      <Card>
        <DelayedLoader />
      </Card>
    );

  return (
    <div className="p-6">
      <Info className="block mb-4">
        Définissez les articles que vous souhaitez retirer du stock ou de
        commander chez vos fournisseurs
      </Info>
      {articles.some((article) => {
        if (!grouppedByArticles[article.id]) return false;

        return (
          (grouppedByArticles[article.id] ?? []).reduce((acc, fur) => {
            return acc + fur.quantity;
          }, 0) >
          (_.first(grouppedByArticles[article.id] ?? [])?.totalToFurnish ?? 0)
        );
      }) && (
        <Alert
          title="Vous allez fournir des articles en trop"
          theme="warning"
          icon="CheckCircleIcon"
          className="mb-6 max-w-max p-3 pr-5"
        >
          {articles.map((article) => {
            const quantity = (grouppedByArticles[article.id] ?? []).reduce(
              (acc, fur) => {
                return acc + fur.quantity;
              },
              0
            );
            const max =
              _.first(grouppedByArticles[article.id] ?? [])?.totalToFurnish ??
              0;

            if (quantity > max)
              return (
                <Info className="text-white">
                  {article.name} - {quantity - max} articles en trop
                </Info>
              );
            return <></>;
          })}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {!articles.some((article) => {
          const articleFurnishes = modifiedFurnishes.filter(
            (fur) => fur.articleID === article.id
          );
          const totalMax = _.first(articleFurnishes)?.totalToFurnish ?? 0;
          return totalMax > 0;
        }) && (
          <div>
            <Section className="mb-6">Reste à fournir</Section>
            <Info>
              Impossible de fournir. Vérifiez vos stocks et vos fournisseurs
            </Info>
            {articles.map((article) => {
              return (
                <div
                  className="flex mt-4 justify-between items-center"
                  key={article.id}
                >
                  <Base>{article.name}</Base>
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
              );
            })}
          </div>
        )}

        {articles.some((article) => {
          const articleFurnishes = modifiedFurnishes.filter(
            (fur) => fur.articleID === article.id
          );
          const totalMax = _.first(articleFurnishes)?.totalToFurnish ?? 0;
          return totalMax > 0;
        }) && (
          <div>
            <Section className="mb-6">Reste à fournir</Section>
            <div className="w-full grid lg:grid-cols-2 gap-3">
              {articles.map((article) => {
                const articleFurnishes = modifiedFurnishes.filter(
                  (fur) => fur.articleID === article.id
                );
                const totalValue = (articleFurnishes ?? []).reduce(
                  (acc, fur) => acc + fur.quantity,
                  0
                );

                return (
                  <Card key={article.id} className="mb-4 flex justify-between">
                    <BaseSmall>{article.name}</BaseSmall>
                    <BaseSmall
                      className={twMerge(
                        (article.totalToFurnish ?? 0) - totalValue > 0 &&
                          "text-red-500",
                        "whitespace-nowrap"
                      )}
                    >
                      {max([(article.totalToFurnish ?? 0) - totalValue, 0])} /{" "}
                      {article.totalToFurnish ?? 0}
                    </BaseSmall>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
        <div>
          <Section className="mb-6">Commandé</Section>
          <div className="w-full grid lg:grid-cols-2 gap-3">
            {articles.map((article) => {
              const articleOrders = (
                existantSupplierQuotes.data?.list ?? []
              ).filter((quote) =>
                (quote.content ?? []).some(
                  (line) => line.article === article.id
                )
              );
              const quantity = articleOrders.reduce(
                (acc, order) =>
                  acc +
                  (order.content ?? [])
                    .filter((line) => line.article === article.id)
                    .reduce((acc, line) => acc + (line.quantity ?? 0), 0),
                0
              );

              return (
                <Card key={article.id} className="mb-4 flex justify-between">
                  <BaseSmall>{article.name}</BaseSmall>
                  <BaseSmall>{quantity}</BaseSmall>
                </Card>
              );
            })}
          </div>
          <Section className="mb-6">Réservé en stock</Section>
          <div className="w-full grid lg:grid-cols-2 gap-3">
            {articles.map((article) => {
              const articleStocks = (reservedStocks.data?.list ?? []).filter(
                (stock) => stock.article === article.id
              );
              const quantity = articleStocks.reduce(
                (acc, stock) => acc + stock.quantity,
                0
              );

              return (
                <Card key={article.id} className="mb-4 flex justify-between">
                  <BaseSmall>{article.name}</BaseSmall>
                  <BaseSmall>{quantity}</BaseSmall>
                </Card>
              );
            })}
          </div>
        </div>

        {!articles.some((article) => {
          if (!grouppedByArticles[article.id]) return false;
          const totalMax =
            _.first(grouppedByArticles[article.id])?.totalToFurnish ?? 0;
          return totalMax > 0;
        }) && (
          <div className="flex flex-col items-start">
            <Section className="mb-6">Articles à fournir</Section>
            <Info>
              Impossible de fournir. Vérifiez vos stocks et vos fournisseurs
            </Info>
            {articles.map((article) => {
              return (
                <div
                  className="flex w-full mt-4 justify-between items-center"
                  key={article.id}
                >
                  <Base>{article.name}</Base>
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
              );
            })}
          </div>
        )}

        {articles.some((article) => {
          if (!grouppedByArticles[article.id]) return false;
          const totalMax =
            _.first(grouppedByArticles[article.id])?.totalToFurnish ?? 0;
          return totalMax > 0;
        }) && (
          <div>
            <Section className="mb-6">Articles à fournir</Section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
              {articles.map((article) => {
                const articleFurnishes = modifiedFurnishes.filter(
                  (fur) =>
                    fur.articleID === article.id && fur.supplierID !== null
                );

                const totalMax = article.totalToFurnish ?? 0;

                return (
                  <Card key={article.id} className="mb-4 px-4">
                    <div className="flex justify-between items-center mb-4">
                      <Info className="text-slate-900">{article.name}</Info>
                      <ChevronDownIcon className="w-3 h-3 ml-1 text-gray-400" />
                    </div>
                    <div className="mt-2">
                      {(articleFurnishes ?? []).length === 0 && (
                        <div>
                          <Info>
                            Aucun stock ou fournisseur défini pour l'article
                          </Info>
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
                            const text = furnishesTextValues.find(
                              (v) => v.ref === fur.ref
                            );
                            return acc + parseInt(text?.value ?? "0");
                          },
                          0
                        );

                        return (
                          <div className="mb-2">
                            {supplier && (
                              <>
                                <Info className="block text-slate-600">
                                  {supplier.business_registered_name
                                    ? supplier.business_registered_name + " - "
                                    : ""}
                                  {supplier.person_last_name +
                                    " " +
                                    supplier.person_first_name}
                                </Info>
                                {supplierDetails && (
                                  <Info>
                                    {supplierDetails.price && (
                                      <>
                                        prix:{" "}
                                        {formatAmount(supplierDetails.price)} -{" "}
                                      </>
                                    )}
                                    {supplierDetails.delivery_quantity && (
                                      <>
                                        {supplierDetails.delivery_quantity} en
                                        stock -{" "}
                                      </>
                                    )}
                                    {supplierDetails.delivery_time && (
                                      <>
                                        livraison{" "}
                                        {supplierDetails.delivery_time}j
                                      </>
                                    )}
                                  </Info>
                                )}
                              </>
                            )}
                            {stock && (
                              <Info className="block text-slate-600">
                                Stock{" "}
                                {stock?.serial_number &&
                                  " - " + stock?.serial_number}
                              </Info>
                            )}
                            <div className="flex w-full items-center justify-between">
                              <Slider
                                key={fur.ref}
                                className={"grow mr-3"}
                                value={[
                                  (parseInt(furnishText?.value ?? "0") /
                                    maxFurnishable) *
                                    100,
                                ]}
                                onValueChange={(value) => {
                                  setArticleQuantity(
                                    fur,
                                    Math.round(
                                      (value[0] / 100) * maxFurnishable
                                    )
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
                                  width: `${
                                    totalValueText.toString().length + 5
                                  }ch`,
                                }}
                              />
                              <Info className="w-16 whitespace-nowrap">
                                / {maxFurnishable}
                              </Info>
                            </div>

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
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <Section className="mb-6">Commandes à créer</Section>
          {(actions ?? [])
            .filter((action) => action.action === "order-items")
            .filter(
              (action) =>
                (action.content ?? []).reduce(
                  (acc, line) => acc + (line?.quantity ?? 0),
                  0
                ) > 0
            ).length === 0 && <Info>Aucune commande à créer</Info>}

          {(actions ?? [])
            .filter((action) => action.action === "order-items")
            .filter(
              (action) =>
                (action.content ?? []).reduce(
                  (acc, line) => acc + (line?.quantity ?? 0),
                  0
                ) > 0
            )
            .map((action, index) => {
              return (
                <Card className="mb-4">
                  <SectionSmall className="mb-4">
                    Commande @{index + 1} -{" "}
                    {action?.supplier && prettyContactName(action?.supplier)}
                  </SectionSmall>

                  {(action.content ?? []).map((line) => {
                    const article = articles.find(
                      (art) => art.id === line.article
                    );
                    return (
                      <div className="grid grid-cols-4">
                        <BaseSmall>Article</BaseSmall>
                        <BaseSmall>Quantité / lot</BaseSmall>
                        <BaseSmall>Prix unitaire</BaseSmall>
                        <BaseSmall>Description</BaseSmall>

                        <Info>{article?.name}</Info>
                        <Info>
                          {line.quantity} {line.unit}
                        </Info>
                        <Info>{formatAmount(line.unit_price ?? 0)}</Info>
                        <Info>{line.description}</Info>
                      </div>
                    );
                  })}
                </Card>
              );
            })}

          <Section className="mt-6 mb-6">Commandes existantes</Section>
          {(existantSupplierQuotes?.data?.list ?? [])?.map((quote) => (
            <>
              <Card
                className="mb-4 cursor-pointer"
                onClick={() => {
                  navigate(getRoute(ROUTES.InvoicesView, { id: quote.id }));
                }}
              >
                <SectionSmall className="mb-4">{quote.reference}</SectionSmall>
                {(quote.content ?? []).map((line) => {
                  const article = articles.find(
                    (art) => art.id === line.article
                  );
                  return (
                    <div className="grid grid-cols-4">
                      <BaseSmall>Article</BaseSmall>
                      <BaseSmall>Quantité / lot</BaseSmall>
                      <BaseSmall>Prix unitaire</BaseSmall>
                      <BaseSmall>Description</BaseSmall>

                      <Info>{article?.name}</Info>
                      <Info>
                        {line.quantity} {line.unit}
                      </Info>
                      <Info>{formatAmount(line.unit_price ?? 0)}</Info>
                      <Info>{line.description}</Info>
                    </div>
                  );
                })}
              </Card>
            </>
          ))}
        </div>
      </div>
    </div>
  );
};
