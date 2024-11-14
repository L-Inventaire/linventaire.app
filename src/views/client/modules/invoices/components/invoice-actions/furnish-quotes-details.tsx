import { Alert } from "@atoms/alert";
import { Input } from "@atoms/input/input-text";
import { Loader } from "@atoms/loader";
import { BaseSmall, Info, Section, SectionSmall } from "@atoms/text";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { debounce } from "@features/utils/debounce";
import { formatAmount } from "@features/utils/format/strings";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Card, Slider } from "@radix-ui/themes";
import _, { max } from "lodash";
import { useCallback } from "react";
import { twMerge } from "tailwind-merge";
import { useFurnishQuotes } from "../../hooks/use-furnist-quotes";
import { FurnishQuotesFurnish } from "../../types";

export const FursnishQuotesDetails = ({ id }: { id?: string }) => {
  const quote = useInvoice(id || "");
  const {
    furnishQuotes,
    grouppedByArticles,
    articles,
    suppliers,
    stocks,
    actions,
    furnishesOverride,
    modifiedFurnishes,
    setFurnishesOverride,
    furnishesTextValues,
    setFurnishesTextValues,
  } = useFurnishQuotes(quote.invoice ? [quote.invoice] : []);

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
        <Loader />
      </Card>
    );

  return (
    <div className="p-6">
      <Info className="block mb-4">
        Définissez les articles que vous souhaitez retirer du stock ou de
        commander chez vos fournisseurs
      </Info>
      {(articles?.data?.list ?? []).some((article) => {
        if (!grouppedByArticles[article.id]) return false;

        return (
          grouppedByArticles[article.id].reduce((acc, fur) => {
            const value = parseInt(
              furnishesTextValues.find((v) => v.ref === fur.ref)?.value ?? "0"
            );

            return acc + value;
          }, 0) > (_.first(modifiedFurnishes)?.totalToFurnish ?? 0)
        );
      }) && (
        <Alert
          title="Vous allez fournir des articles en trop"
          theme="warning"
          icon="CheckCircleIcon"
          className="mb-6 max-w-max p-3 pr-5"
        >
          {(articles?.data?.list ?? []).map((article) => {
            const quantity = grouppedByArticles[article.id].reduce(
              (acc, fur) => {
                const value = parseInt(
                  furnishesTextValues.find((v) => v.ref === fur.ref)?.value ??
                    "0"
                );
                return acc + value;
              },
              0
            );
            const max = _.first(modifiedFurnishes)?.totalToFurnish ?? 0;

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
        <div>
          <Section className="mb-6">Articles à fournir</Section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
            {articles.data?.list.map((article) => {
              const articleFurnishes = modifiedFurnishes.filter(
                (fur) => fur.articleID === article.id && fur.supplierID !== null
              );

              const totalMax = _.first(modifiedFurnishes)?.totalToFurnish ?? 0;

              const totalValue = (articleFurnishes ?? []).reduce(
                (acc, fur) => acc + fur.quantity,
                0
              );

              return (
                <Card key={article.id} className="mb-4 px-4">
                  <div className="flex justify-between items-center mb-4">
                    <Info className="text-slate-900">{article.name}</Info>
                    <ChevronDownIcon className="w-3 h-3 ml-1 text-gray-400" />
                  </div>
                  <div className="mt-2">
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
                          ? supplier
                            ? totalMax
                            : stock?.quantity
                          : 0) ?? 0;

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
                                      livraison {supplierDetails.delivery_time}j
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
                                  Math.round((value[0] / 100) * maxFurnishable)
                                );
                              }}
                            />
                            <Input
                              value={furnishText?.value ?? ""}
                              onChange={(e) => {
                                setFurnishesTextValues((data) =>
                                  data.map((f) =>
                                    f.ref === fur.ref
                                      ? { ref: fur.ref, value: e.target.value }
                                      : f
                                  )
                                );

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
                                width: `${totalValue.toString().length + 5}ch`,
                              }}
                            />
                            <Info className="w-16">/ {maxFurnishable}</Info>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>

          <Section className="mb-6">Reste à fournir</Section>
          <div className="w-full grid lg:grid-cols-2 gap-3">
            {(articles.data?.list ?? []).map((article) => {
              const articleFurnishes = modifiedFurnishes.filter(
                (fur) => fur.articleID === article.id
              );
              const totalValue = (articleFurnishes ?? []).reduce(
                (acc, fur) => acc + fur.quantity,
                0
              );
              const totalMax = _.first(modifiedFurnishes)?.totalToFurnish ?? 0;

              return (
                <Card key={article.id} className="mb-4 flex justify-between">
                  <BaseSmall>{article.name}</BaseSmall>
                  <BaseSmall
                    className={twMerge(
                      totalMax - totalValue > 0 && "text-red-500"
                    )}
                  >
                    {max([totalMax - totalValue, 0])} / {totalMax}
                  </BaseSmall>
                </Card>
              );
            })}
          </div>
        </div>
        <div>
          <Section className="mb-6">Commandes</Section>
          {(actions ?? [])
            .filter((action) => action.action === "order-items")
            .map((action, index) => {
              return (
                <Card className="mb-4">
                  <SectionSmall className="mb-4">
                    Commande @{index + 1}
                  </SectionSmall>

                  {(action.content ?? []).map((line) => {
                    const article = (articles?.data?.list ?? []).find(
                      (art) => art.id === line.article
                    );
                    return (
                      <div className="grid grid-cols-4">
                        <BaseSmall>Article</BaseSmall>
                        <BaseSmall>Quantité</BaseSmall>
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
        </div>
      </div>
    </div>
  );
};
