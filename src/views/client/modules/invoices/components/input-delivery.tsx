import { Base, Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { FormControllerFuncType } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { AddressInput } from "@components/input-button/address/form";
import { Contacts } from "@features/contacts/types/types";
import { Invoices } from "@features/invoices/types/types";
import { AddressLength, formatAddress } from "@features/utils/format/address";
import { formatTime } from "@features/utils/format/dates";
import { TruckIcon } from "@heroicons/react/20/solid";
import { computeDeliveryDelayDate, isDeliveryLate } from "../utils";

export const InputDelivery = ({
  ctrl,
  invoice,
  readonly,
  contact,
  btnKey,
}: {
  ctrl: FormControllerFuncType<Invoices>;
  invoice: Invoices;
  readonly?: boolean;
  contact?: Contacts | null;
  btnKey?: string;
}) => {
  const getDeliveryType = () => {
    if (invoice.delivery_delay) return "delivery_delay";
    if (invoice.delivery_date) return "delivery_date";
    if (!invoice.delivery_date && !invoice.delivery_delay) return "no_delivery";
  };

  return (
    <>
      <InputButton
        btnKey={btnKey}
        label="Modifier la livraison"
        icon={(p) => <TruckIcon {...p} />}
        content={
          <div className="space-y-2">
            <FormInput
              type="radio"
              placeholder={"Type de livraison"}
              options={[
                { label: "Délai de livraison", value: "delivery_delay" },
                { label: "Date de livraison", value: "delivery_date" },
                { label: "Aucune", value: "no_delivery" },
              ]}
              value={getDeliveryType()}
              onChange={(e) => {
                if (e === "no_delivery") {
                  ctrl("delivery_delay").onChange(undefined);
                  ctrl("delivery_date").onChange(undefined);
                }
                if (e === "delivery_delay") {
                  ctrl("delivery_delay").onChange(30);
                  ctrl("delivery_date").onChange(undefined);
                }
                if (e === "delivery_date") {
                  ctrl("delivery_date").onChange(
                    Date.now() + 1000 * 60 * 60 * 24 * 7
                  );
                  ctrl("delivery_delay").onChange(undefined);
                }
              }}
            />
            {invoice}
            {!!ctrl("delivery_date").value && (
              <FormInput
                type="date"
                label="Date de livraison"
                ctrl={ctrl("delivery_date")}
              />
            )}
            {!!ctrl("delivery_delay").value && (
              <FormInput
                type="number"
                label="Délai de livraison (jours)"
                ctrl={ctrl("delivery_delay")}
              />
            )}

            {!readonly && (
              <FormInput
                placeholder="Ajouter une adresse de livraison"
                type="boolean"
                value={ctrl("delivery_address").value}
                onChange={(e) =>
                  ctrl("delivery_address").onChange(
                    e
                      ? ({
                          address_line_1: contact?.address.address_line_1 || "",
                          address_line_2: contact?.address.address_line_2 || "",
                          region: contact?.address.region || "",
                          country: contact?.address.country || "",
                          zip: contact?.address.zip || "",
                          city: contact?.address.city || "",
                        } as Invoices["delivery_address"])
                      : null
                  )
                }
              />
            )}
            {ctrl("delivery_address").value && (
              <>
                <AddressInput ctrl={ctrl("delivery_address")} />
              </>
            )}
          </div>
        }
        value={
          invoice.delivery_delay || invoice.delivery_address
            ? "always"
            : undefined
        }
      >
        <div className="space-y-0 flex-col flex text-left max-w-56">
          {!!invoice.delivery_date && (
            <Base>
              Livraison le{" "}
              {formatTime(invoice.delivery_date, {
                keepDate: true,
                hideTime: true,
              })}
              {!invoice.delivery_date && <Base>Pas de date de livraison</Base>}
            </Base>
          )}
          {!!invoice.delivery_delay && (
            <Base>
              Livraison dans {invoice.delivery_delay} jours
              {!invoice.delivery_delay && (
                <Base>Pas de délai de livraison</Base>
              )}
            </Base>
          )}
          <Info>
            {formatAddress(
              invoice.delivery_address,
              AddressLength.part1,
              "Aucune adresse de livraison"
            )}
          </Info>
          <Info>
            {formatAddress(invoice.delivery_address, AddressLength.part2, "-")}
          </Info>

          {invoice.type === "quotes" &&
            invoice.purchase_order_date &&
            invoice.state === "signed" && (
              <>
                <Info className={"text-blue-500"}>
                  Signé, livraison avant le :{" "}
                  {formatTime(computeDeliveryDelayDate(invoice).toJSDate(), {
                    keepDate: true,
                    hideTime: true,
                  })}
                </Info>
                {isDeliveryLate(invoice) && (
                  <Info className={"text-red-500"}>
                    La livraison est en retard !
                  </Info>
                )}
              </>
            )}
        </div>
      </InputButton>
    </>
  );
};
