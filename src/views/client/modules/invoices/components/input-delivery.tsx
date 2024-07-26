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
  return (
    <>
      <InputButton
        btnKey={btnKey}
        label="Modifier la livraison"
        icon={(p) => <TruckIcon {...p} />}
        content={
          <div className="space-y-2">
            {!ctrl("delivery_date").value && !readonly && (
              <FormInput
                placeholder="Ajouter une date de livraison"
                type="boolean"
                value={ctrl("delivery_date").value}
                onChange={(e) =>
                  ctrl("delivery_date").onChange(
                    e ? Date.now() + 1000 * 60 * 60 * 24 * 7 : 0
                  )
                }
              />
            )}

            {!!ctrl("delivery_date").value && (
              <FormInput
                type="date"
                label="Date de livraison"
                ctrl={ctrl("delivery_date")}
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
          invoice.delivery_date || invoice.delivery_address
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
        </div>
      </InputButton>
    </>
  );
};
