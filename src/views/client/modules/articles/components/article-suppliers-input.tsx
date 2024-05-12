import { Button } from "@atoms/button/button";
import { Info, SectionSmall } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { RestDocumentsInput } from "@components/rest-documents-input";
import { Table } from "@components/table";
import { Articles } from "@features/articles/types/types";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { getContactName } from "@features/contacts/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { formatAmount, formatNumber } from "@features/utils/format/strings";
import { EyeIcon, TrashIcon } from "@heroicons/react/outline";
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
        values: value[0].map((id) => ({ op: "equals", value: id })),
      },
    ],
    key: "suppliers_" + id,
    limit: value[0].length,
  });

  useEffect(() => {
    refresh();
  }, [id]);

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
        {(!!suppliers.data?.list?.length || !readonly) && (
          <div className="space-y-4 mt-2">
            {!readonly &&
              (suppliers?.data?.list || []).map((contact) => (
                <div className="rounded border p-4" key={contact.id}>
                  <Button
                    icon={(p) => <TrashIcon {...p} />}
                    size="sm"
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
                      value={value[1][contact.id]?.delivery_time || 1}
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
              <div className="mt-2">
                <RestDocumentsInput
                  table="articles"
                  column="suppliers"
                  theme="primary"
                  label="+ Ajouter un fournisseur"
                  placeholder="Rechercher un fournisseur..."
                  max={1}
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
                        },
                      });
                    }
                  }}
                />
              </div>
            )}

            {!!suppliers?.data?.list?.length && readonly && (
              <>
                <Table
                  data={suppliers.data?.list || []}
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
                            size="sm"
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
