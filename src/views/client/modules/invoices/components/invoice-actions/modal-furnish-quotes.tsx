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
    lockedFurnishes,
    articles,
    suppliers,
    stocks,
    setLockedFurnishesRefs,
    stockFurnishes,
    furnishesOverride,
    setFurnishesOverride,
  } = useFurnishQuotes(quote.invoice ? [quote.invoice] : []);

  function setSupplierQuantity(supplierID: string, value: number) {
    const supplierFurnishes = grouppedBySuppliers[supplierID];
    const otherSuppliersFurnishes = furnishesOverride.filter(
      (fur) => fur.supplierID !== supplierID
    );
    const supplierArticles = (supplierFurnishes ?? []).map(
      (fur) => fur.articleID
    );

    const max =
      (furnishesOverride ?? []).reduce(
        (acc, fur) => acc + fur.totalToFurnish,
        0
      ) -
      stockFurnishes
        .filter((stockFur) => supplierArticles.includes(stockFur.articleID))
        .reduce((acc, fur) => acc + fur.quantity, 0);
    if (value > max) return;

    const currentValue = (supplierFurnishes ?? []).reduce(
      (acc, fur) => acc + fur.quantity,
      0
    );
    let delta = value - currentValue;

    let counter = 0;
    const modifiedFurnishes: FurnishQuotesFurnish[] = [];

    while (Math.abs(delta) > 0 && counter <= max) {
      let furnisher: FurnishQuotesFurnish | null = null;
      let donorFurnisher: FurnishQuotesFurnish | null = null;
      if (delta > 0) {
        furnisher =
          supplierFurnishes.find((fur) => fur.quantity < fur.totalToFurnish) ??
          null;
        donorFurnisher =
          otherSuppliersFurnishes.find(
            (otherFur) =>
              otherFur.articleID === furnisher?.articleID &&
              otherFur.quantity > 0
          ) ?? null;

        if (!furnisher) break;
        if (!donorFurnisher) break;
        furnisher.quantity++;
        donorFurnisher.quantity--;
        delta--;
      }
      if (delta < 0) {
        furnisher = supplierFurnishes.find((fur) => fur.quantity > 0) ?? null;
        donorFurnisher =
          otherSuppliersFurnishes.find(
            (donorFur) =>
              donorFur.articleID === furnisher?.articleID &&
              donorFur.quantity < furnisher.totalToFurnish
          ) ?? null;

        if (!furnisher) break;
        if (!donorFurnisher) break;
        furnisher.quantity--;
        donorFurnisher.quantity++;
        delta++;
      }

      if (furnisher) modifiedFurnishes.push(furnisher);
      if (donorFurnisher) modifiedFurnishes.push(donorFurnisher);

      furnisher = null;
      donorFurnisher = null;
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

  if (!furnishQuotes)
    return (
      <Card>
        <Loader />
      </Card>
    );

  return (
    <ModalContent title="Fournir les produits">
      <Info className="block mb-4">Test</Info>
      <SectionSmall className="mb-2">Fournisseurs</SectionSmall>
      {(suppliers?.data?.list ?? []).map((supplier) => {
        const supplierFurnishes = grouppedBySuppliers[supplier.id];
        const supplierArticles = (supplierFurnishes ?? []).map(
          (fur) => fur.articleID
        );

        const max =
          (supplierFurnishes ?? []).reduce(
            (acc, fur) => acc + fur.totalToFurnish,
            0
          ) -
          stockFurnishes
            .filter((stockFur) => supplierArticles.includes(stockFur.articleID))
            .reduce((acc, fur) => acc + fur.quantity, 0);
        const value = (supplierFurnishes ?? []).reduce(
          (acc, fur) => acc + fur.quantity,
          0
        );

        return (
          <Card key={supplier.id} className="mb-4">
            <div className="flex justify-between items-center">
              <Info>
                {supplier.business_registered_name
                  ? supplier.business_registered_name + " - "
                  : ""}
                {supplier.person_last_name + " " + supplier.person_first_name}
              </Info>
              <ChevronDownIcon className="w-3 h-3 ml-1 text-gray-400" />
            </div>
            <div className="flex w-full mt-2 items-center justify-between">
              <Slider
                className={"grow mr-3"}
                value={[(value / max) * 100]}
                onValueChange={(value) => {
                  setSupplierQuantity(
                    supplier.id,
                    Math.round((value[0] / 100) * max)
                  );
                }}
              />
              <Input
                value={value}
                onChange={(e) => {
                  setSupplierQuantity(
                    supplier.id,
                    parseInt(e.target.value ?? "0")
                  );
                }}
                max={max}
                type="number"
                pattern="\d*"
                size="md"
                className="grow-0 w-16 mr-1"
              />
              <Info className="w-16">/ {max}</Info>
            </div>
            <div className="mt-2">
              {(supplierFurnishes ?? []).map((fur) => {
                return (
                  <div className="mb-2">
                    <Info className="block mb-2">
                      {
                        (articles?.data?.list ?? []).find(
                          (art) => art.id === fur.articleID
                        )?.name
                      }
                    </Info>
                    <Slider
                      key={fur.ref}
                      className={"grow mr-3"}
                      value={[(fur.quantity / max) * 100]}
                      onValueChange={(value) => {
                        setSupplierQuantity(
                          supplier.id,
                          Math.round((value[0] / 100) * max)
                        );
                      }}
                    />
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
