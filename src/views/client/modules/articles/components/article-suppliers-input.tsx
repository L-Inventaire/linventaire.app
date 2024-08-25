import { Button } from "@atoms/button/button";
import { Info, SectionSmall } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { RestDocumentsInput } from "@components/input-rest";
import { Table } from "@molecules/table";
import { Articles } from "@features/articles/types/types";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { Contacts, getContactName } from "@features/contacts/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { formatAmount, formatNumber } from "@features/utils/format/strings";
import { EyeIcon, TrashIcon } from "@heroicons/react/24/outline";
import { PageColumns } from "@views/client/_layout/page";
import _ from "lodash";
import { useEffect } from "react";

export const ArticleSuppliersInput = ({
  id,
  readonly,
  value,
  onChange,
}: {
  id: string;
  readonly?: boolean;
  value: [string[], Articles["suppliers_details"]]; // suppliers, suppliers_details
  onChange: (
    suppliers: string[],
    details: Articles["suppliers_details"]
  ) => void;
}) => {
  const { contacts: suppliers, refresh } = useContacts({
    query: [
      {
        key: "id",
        values: value[0]
          .filter((a) => a !== "custom")
          .map((id) => ({ op: "equals", value: id })),
      },
    ],
    key: "suppliers_" + id,
    limit: value[0].filter((a) => a !== "custom").length,
  });

  useEffect(() => {
    refresh();
  }, [id]);

  const suppliersList = [
    ...(suppliers?.data?.list || []),
    ...(value[0].includes("custom")
      ? [
          {
            id: "custom",
            business_name: "Aucun fournisseur",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div>
        {readonly && value[0].length === 0 && (
          <Info>Aucun fournisseur n'est associé à cet article.</Info>
        )}
        {!readonly && (
          <Info>
            Indiquez les fournisseurs associés à cet article, leurs prix,
            références et autres informations.
          </Info>
        )}
        {(!!suppliersList?.length || !readonly) && (
          <div className="space-y-4 mt-2">
            {!readonly &&
              (suppliersList || []).map((contact) => (
                <div
                  className="rounded border dark:border-slate-700 p-4"
                  key={contact.id}
                >
                  <Button
                    icon={(p) => <TrashIcon {...p} />}
                    size="md"
                    theme="danger"
                    className="float-right"
                    onClick={() => {
                      const details = { ...value[1] };
                      delete details[contact.id];
                      onChange(
                        value[0].filter((id) => id !== contact.id),
                        details
                      );
                    }}
                  />
                  <SectionSmall>{getContactName(contact)}</SectionSmall>
                  <PageColumns>
                    <FormInput
                      label="Référence"
                      type="text"
                      value={value[1][contact.id]?.reference || ""}
                      onChange={(reference: string) => {
                        onChange(value[0], {
                          ...value[1],
                          [contact.id]: {
                            ...(value[1][contact.id] || {}),
                            reference,
                          },
                        });
                      }}
                      placeholder="Référence fournisseur"
                    />
                    <FormInput
                      label="Prix"
                      type="formatted"
                      format="price"
                      value={value[1][contact.id]?.price || ""}
                      onChange={(price: string) => {
                        onChange(value[0], {
                          ...value[1],
                          [contact.id]: {
                            ...(value[1][contact.id] || {}),
                            price: parseFloat(price),
                          },
                        });
                      }}
                      placeholder="Prix"
                    />
                    <FormInput
                      label="Quantité"
                      type="number"
                      value={value[1][contact.id]?.delivery_quantity || 1}
                      onChange={(delivery_quantity: string) => {
                        onChange(value[0], {
                          ...value[1],
                          [contact.id]: {
                            ...(value[1][contact.id] || {}),
                            delivery_quantity: parseFloat(delivery_quantity),
                          },
                        });
                      }}
                      placeholder="1"
                    />
                    <FormInput
                      label="Délai de livraison (jours)"
                      type="number"
                      min={0}
                      max={500}
                      value={value[1][contact.id]?.delivery_time ?? 1}
                      onChange={(delivery_time: string) => {
                        onChange(value[0], {
                          ...value[1],
                          [contact.id]: {
                            ...(value[1][contact.id] || {}),
                            delivery_time: parseFloat(delivery_time),
                          },
                        });
                      }}
                      placeholder="1"
                    />
                  </PageColumns>
                </div>
              ))}
            {!readonly && (
              <div className="mt-2 flex flex-col space-y-2">
                <RestDocumentsInput
                  entity="contacts"
                  size="xl"
                  filter={{ is_supplier: true } as Partial<Contacts>}
                  label="+ Ajouter un fournisseur"
                  placeholder="Rechercher un fournisseur..."
                  value={""}
                  onChange={(supplier) => {
                    if (supplier && typeof supplier === "string") {
                      onChange(_.uniq([...value[0], supplier]), {
                        ...value[1],
                        [supplier]: {
                          reference: "",
                          price: 0,
                          delivery_time: 0,
                          delivery_quantity: 0,
                          ...((value[1][supplier] || {}) as any),
                        },
                      });
                    }
                  }}
                />
                <Button
                  theme="outlined"
                  size="md"
                  onClick={() => {
                    onChange(_.uniq([...value[0], "custom"]), {
                      ...value[1],
                      custom: {
                        reference: "",
                        price: 0,
                        delivery_time: 0,
                        delivery_quantity: 0,
                      },
                    });
                  }}
                >
                  Ajouter un coût sans fournisseur
                </Button>
              </div>
            )}

            {!!suppliersList?.length && readonly && (
              <>
                <Table
                  data={suppliersList || []}
                  columns={[
                    {
                      title: "Fournisseur",
                      render: (contact) => <>{getContactName(contact)}</>,
                    },
                    {
                      title: "Référence",
                      render: (contact) => (
                        <>{value[1][contact.id]?.reference}</>
                      ),
                    },
                    {
                      title: "Prix",
                      thClassName: "w-24",
                      render: (contact) => (
                        <>{formatAmount(value[1][contact.id]?.price)}</>
                      ),
                    },
                    {
                      title: "Quantité",
                      thClassName: "w-24",
                      render: (contact) => (
                        <>
                          {formatNumber(
                            value[1][contact.id]?.delivery_quantity
                          )}
                        </>
                      ),
                    },
                    {
                      title: "Délai",
                      thClassName: "w-24",
                      render: (contact) => (
                        <>{value[1][contact.id]?.delivery_time} jours</>
                      ),
                    },
                    {
                      cellClassName: "flex justify-end",
                      render: (contact) => (
                        <>
                          <Button
                            icon={(p) => <EyeIcon {...p} />}
                            size="md"
                            to={getRoute(ROUTES.ContactsView, {
                              id: contact.id,
                            })}
                            data-tooltip="Voir le fournisseur"
                          />
                        </>
                      ),
                    },
                  ]}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
