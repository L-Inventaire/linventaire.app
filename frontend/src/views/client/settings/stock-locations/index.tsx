import { Button } from "@atoms/button/button";
import { ButtonConfirm } from "@atoms/button/confirm";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { useFormController } from "@components/form/formcontext";
import { useHasAccess } from "@features/access";
import { StockLocationsColumns } from "@features/stock/configuration";
import { useStockLocations } from "@features/stock/hooks/use-stock-locations";
import { StockLocations } from "@features/stock/types/types";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Table } from "@molecules/table";
import { Heading } from "@radix-ui/themes";
import _ from "lodash";
import { useState } from "react";
import { Page } from "../../_layout/page";

export const StockLocationsPage = () => {
  const { stock_locations, remove, upsert } = useStockLocations();
  const [edit, setEdit] = useState<Partial<StockLocations> | null>(null);
  const { ctrl } = useFormController(edit || {}, setEdit);
  const hasAccess = useHasAccess();

  return (
    <Page title={[{ label: "Paramètres" }, { label: "Lieux de stockage" }]}>
      <div className="w-full max-w-4xl mx-auto mt-6">
        {hasAccess("STOCK_MANAGE") && (
          <Button
            size="md"
            className="float-right"
            onClick={() =>
              setEdit({
                parent: "",
                type: "shelf",
                name: "",
              })
            }
            shortcut={["shift+a"]}
          >
            Ajouter
          </Button>
        )}
        <Modal open={!!edit} onClose={() => setEdit(null)}>
          {!!edit && (
            <ModalContent
              title={
                edit?.id
                  ? "Modifier un lieu de stockage"
                  : "Ajouter un lieu de stockage"
              }
            >
              <div className="space-y-4">
                {!!stock_locations.data?.list?.length && (
                  <FormInput
                    label="Parent"
                    ctrl={ctrl("parent")}
                    type="select"
                    placeholder="Aucun parent"
                    options={[
                      {
                        value: "",
                        label: "Aucun parent",
                      },
                      ...(stock_locations.data?.list.map((l) => ({
                        value: l.id,
                        label: l.name,
                      })) || []),
                    ]}
                  />
                )}
                <FormInput
                  label="Type"
                  ctrl={ctrl("type")}
                  type="select"
                  options={[
                    {
                      value: "warehouse",
                      label: "Entrepôt",
                    },
                    {
                      value: "shelf",
                      label: "Étagère",
                    },
                  ]}
                />
                <FormInput label="Name" ctrl={ctrl("name")} autoFocus />
                <Button
                  disabled={!ctrl("name").value || !ctrl("type").value}
                  shortcut={["enter"]}
                  onClick={async () => {
                    await upsert.mutate(edit || {});
                    setEdit(null);
                  }}
                >
                  Enregistrer
                </Button>
              </div>
            </ModalContent>
          )}
        </Modal>

        <Heading size="6">Lieux de stockage</Heading>
        <Info>
          Les lieux de stockage permettent de mieux préciser l'emplacement des
          produits dans votre entrepôt.
        </Info>

        <Table
          border
          className="mt-4"
          data={_.sortBy(stock_locations.data?.list || [], "name")}
          columns={[
            ...StockLocationsColumns,
            {
              hidden: !hasAccess("STOCK_MANAGE"),
              title: "Actions",
              thClassName: "w-1 whitespace-nowrap",
              render: (stockLocation) => {
                return (
                  <div className="text-right space-x-2 whitespace-nowrap flex items-center">
                    <Button
                      theme="outlined"
                      size="md"
                      onClick={() => setEdit(stockLocation)}
                      icon={(p) => <PencilIcon {...p} />}
                    />
                    <ButtonConfirm
                      theme="danger"
                      size="md"
                      onClick={() => remove.mutate(stockLocation.id)}
                      icon={(p) => <TrashIcon {...p} />}
                    />
                  </div>
                );
              },
            },
          ]}
        />
      </div>
    </Page>
  );
};
