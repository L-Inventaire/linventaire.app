import { Input } from "@atoms/input/input-text";
import { Loader } from "@atoms/loader";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { Info, SectionSmall } from "@atoms/text";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Card, Slider } from "@radix-ui/themes";
import _ from "lodash";
import { atom, useRecoilState } from "recoil";
import { useFurnishQuotes } from "../../hooks/use-furnist-quotes";
import { FurnishQuotesFurnish } from "../../types";

export const FursnishQuotesModalAtom = atom<boolean>({
  key: "FursnishQuotesModalAtom",
  default: false,
});

export const FursnishQuotesModal = ({ id }: { id?: string }) => {
  const [open, setOpen] = useRecoilState(FursnishQuotesModalAtom);
  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      {open && (
        <FursnishQuotesModalContent id={id} onClose={() => setOpen(false)} />
      )}
    </Modal>
  );
};

export const FursnishQuotesModalContent = ({
  id,
  onClose,
}: {
  id?: string;
  onClose: () => void;
}) => {
  const quote = useInvoice(id || "");
  const {
    furnishQuotes,
    isLoadingFurnishQuotes,
    grouppedBySuppliers,
    grouppedByStocks,
    grouppedByArticles,
    lockedFurnishes,
    articles,
    suppliers,
    stocks,
    lockedFurnishesRefs,
    setLockedFurnishesRefs,
    stockFurnishes,
    furnishesOverride,
    setFurnishesOverride,
  } = useFurnishQuotes(quote.invoice ? [quote.invoice] : []);

  function setTotalArticleQuantity(
    articleID: string,
    value: number,
    forceValue = false
  ) {
    const articleFurnishes = grouppedByArticles[articleID];

    const max = _.first(articleFurnishes)?.totalToFurnish ?? 0;

    const currentValue = (articleFurnishes ?? []).reduce(
      (acc, fur) => acc + fur.quantity,
      0
    );
    const initialDelta = value - currentValue;
    let delta = initialDelta;

    let counter = 0;
    const modifiedFurnishes: FurnishQuotesFurnish[] = [];

    while (Math.abs(delta) > 0 && counter <= Math.abs(initialDelta)) {
      let furnish: FurnishQuotesFurnish | null = null;
      let furnishes = articleFurnishes;

      furnishes = furnishes.sort((furA, furB) => {
        const locked = lockedFurnishes.map((fur) => fur.ref);
        if (locked.includes(furA.ref) && locked.includes(furA.ref)) return 0;
        if (locked.includes(furA.ref)) return 1;
        if (locked.includes(furB.ref)) return -1;

        if (furA.stockID && furB.stockID) return 0;
        if (furA.stockID) return 1;
        if (furB.stockID) return -1;

        return furA.quantity - furB.quantity;
      });

      if (delta > 0) {
        furnish =
          furnishes.find(
            (fur) =>
              fur.quantity < (fur.maxAvailable ?? 0) &&
              fur.quantity < (fur.totalToFurnish ?? 0)
          ) ?? null;

        if (!furnish && forceValue) furnish = _.first(furnishes) ?? null;

        if (!furnish) break;

        furnish.quantity++;
        delta--;
      }
      if (delta < 0) {
        furnish = furnishes.find((fur) => fur.quantity > 0) ?? null;

        if (!furnish) break;
        furnish.quantity--;
        delta++;
      }

      if (furnish) modifiedFurnishes.push(furnish);

      furnish = null;
      counter++;
    }

    setFurnishesOverride((data) =>
      _.uniqBy(
        [...data, ...modifiedFurnishes].filter(
          Boolean
        ) as FurnishQuotesFurnish[],
        "ref"
      )
    );
  }

  function setArticleQuantity(
    furnish: FurnishQuotesFurnish,
    value: number,
    forceValue = false
  ) {
    const articleFurnishes = grouppedByArticles[furnish.articleID];

    const max = furnish.maxAvailable ?? furnish.totalToFurnish ?? 0;

    const currentValue = furnish.quantity;
    let delta = value - currentValue;

    let counter = 0;
    const modifiedFurnishes: FurnishQuotesFurnish[] = [];

    while (Math.abs(delta) > 0 && counter <= max) {
      let donorFurnish: FurnishQuotesFurnish | null = null;
      let furnishes = articleFurnishes.filter((fur) => fur.ref !== furnish.ref);

      furnishes = furnishes.sort((furA, furB) => {
        const locked = lockedFurnishes.map((fur) => fur.ref);
        if (locked.includes(furA.ref) && locked.includes(furA.ref)) return 0;
        if (locked.includes(furA.ref)) return 1;
        if (locked.includes(furB.ref)) return -1;

        if (furA.stockID && furB.stockID) return 0;
        if (furA.stockID) return -1;
        if (furB.stockID) return 1;

        return furA.quantity - furB.quantity;
      });

      if (delta > 0) {
        donorFurnish = furnishes.find((fur) => fur.quantity > 0) ?? null;

        if (!donorFurnish && !forceValue) break;
        furnish.quantity++;

        if (donorFurnish) donorFurnish.quantity--;
        delta--;
      }
      if (delta < 0) {
        donorFurnish =
          furnishes.find(
            (fur) =>
              fur.quantity < (fur.maxAvailable ?? fur.totalToFurnish ?? 0)
          ) ?? null;

        if (!donorFurnish && !forceValue) break;
        furnish.quantity--;

        if (donorFurnish) donorFurnish.quantity++;
        delta++;
      }

      if (furnish) modifiedFurnishes.push(furnish);
      if (donorFurnish) modifiedFurnishes.push(donorFurnish);

      donorFurnish = null;
      counter++;
    }

    setFurnishesOverride((data) =>
      _.uniqBy(
        [...data, ...modifiedFurnishes].filter(
          Boolean
        ) as FurnishQuotesFurnish[],
        "ref"
      )
    );
    setLockedFurnishesRefs((data) => _.uniq([...data, furnish.ref]));
  }

  if (!furnishQuotes)
    return (
      <Card>
        <Loader />
      </Card>
    );

  return (
    <ModalContent title="Fournir les produits">
      <Info className="block mb-4">Test</Info>
      <SectionSmall className="mb-2">Articles</SectionSmall>
      {articles.data?.list.map((article) => {
        const articleFurnishes = furnishesOverride.filter(
          (fur) => fur.articleID === article.id && fur.supplierID !== null
        );

        const totalMax = _.first(furnishesOverride)?.totalToFurnish ?? 0;

        const totalValue = (articleFurnishes ?? []).reduce(
          (acc, fur) => acc + fur.quantity,
          0
        );

        return (
          <Card key={article.id} className="mb-4">
            <div className="flex justify-between items-center">
              <Info>{article.name}</Info>
              <ChevronDownIcon className="w-3 h-3 ml-1 text-gray-400" />
            </div>
            <div className="flex w-full mt-2 items-center justify-between">
              <Slider
                className={"grow mr-3"}
                value={[(totalValue / totalMax) * 100]}
                onValueChange={(value) => {
                  setTotalArticleQuantity(
                    article.id,
                    Math.round((value[0] / 100) * totalMax)
                  );
                }}
              />
              <Input
                value={totalValue}
                onChange={(e) => {
                  setTotalArticleQuantity(
                    article.id,
                    parseInt(e.target.value ?? "0"),
                    true
                  );
                }}
                type="number"
                pattern="\d*"
                size="md"
                className={"grow-0 mr-1"}
                style={{ width: `${totalValue.toString().length + 5}ch` }}
              />
              <Info className="w-16">/ {totalMax}</Info>
            </div>
            <div className="mt-2">
              {(articleFurnishes ?? []).map((fur) => {
                const supplier = (suppliers?.data?.list ?? []).find(
                  (supp) => supp.id === fur?.supplierID
                );
                const stock = (stocks?.data?.list ?? []).find(
                  (stock) => stock.id === fur?.stockID
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
                      <Info className="block mb-2">
                        {supplier.business_registered_name
                          ? supplier.business_registered_name + " - "
                          : ""}
                        {supplier.person_last_name +
                          " " +
                          supplier.person_first_name}
                      </Info>
                    )}
                    {stock && (
                      <Info className="block mb-2">
                        Stock{" "}
                        {stock?.serial_number && " - " + stock?.serial_number}
                      </Info>
                    )}
                    <div className="flex w-full mt-2 items-center justify-between">
                      <Slider
                        key={fur.ref}
                        className={"grow mr-3"}
                        value={[(fur.quantity / maxFurnishable) * 100]}
                        onValueChange={(value) => {
                          setArticleQuantity(
                            fur,
                            Math.round((value[0] / 100) * maxFurnishable)
                          );
                        }}
                      />
                      <Input
                        value={fur.quantity}
                        onChange={(e) => {
                          setArticleQuantity(
                            fur,
                            parseInt(e.target.value ?? "0"),
                            true
                          );
                        }}
                        type="number"
                        pattern="\d*"
                        size="md"
                        className="grow-0 mr-1"
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
    </ModalContent>
  );
};
