import { Button } from "@atoms/button/button";
import { Address } from "@features/clients/types/clients";
import { Contacts } from "@features/contacts/types/types";
import { Invoices } from "@features/invoices/types/types";
import { formatAddress } from "@features/utils/format/address";
import { Callout, Text } from "@radix-ui/themes";
import { useState } from "react";
import { getBestDeliveryAddress } from "./input-delivery";

const ADDRESS_KEYS: (keyof Address)[] = [
  "address_line_1",
  "address_line_2",
  "zip",
  "city",
  "region",
  "country",
];

// updated_at is a BIGINT (ms), it can be received as a number or a string
const toTimestamp = (value: unknown) => {
  const asNumber = Number(value);
  if (Number.isFinite(asNumber)) return asNumber;
  return new Date(value as string).getTime() || 0;
};

const isEmptyAddress = (address?: Partial<Address> | null) =>
  !ADDRESS_KEYS.some((key) => (address?.[key] || "").trim());

const isSameAddress = (
  a?: Partial<Address> | null,
  b?: Partial<Address> | null,
) =>
  ADDRESS_KEYS.every(
    (key) =>
      (a?.[key] || "").trim().toLocaleLowerCase() ===
      (b?.[key] || "").trim().toLocaleLowerCase(),
  );

/**
 * The delivery address is copied from the client (or contact) when the
 * document is created, so it is not updated when the client file changes.
 * Returns the address of the client file if it changed after the last update
 * of the draft and is different from the one in the document.
 */
export const getOutdatedDeliveryAddress = (
  invoice: Invoices,
  client?: Contacts | null,
  contact?: Contacts | null,
): Address | null => {
  if (invoice.state !== "draft" || !invoice.id || !client) return null;
  if (isEmptyAddress(invoice.delivery_address)) return null;

  const partnerUpdatedAt = Math.max(
    toTimestamp(client.updated_at),
    toTimestamp(contact?.updated_at),
  );
  if (partnerUpdatedAt <= toTimestamp(invoice.updated_at)) return null;

  const clientAddress = getBestDeliveryAddress(client, contact || undefined);
  if (isEmptyAddress(clientAddress)) return null;
  if (isSameAddress(clientAddress, invoice.delivery_address)) return null;

  return clientAddress;
};

export const OutdatedClientCallout = ({
  invoice,
  client,
  contact,
  onUpdate,
}: {
  invoice: Invoices;
  client?: Contacts | null;
  contact?: Contacts | null;
  onUpdate: (changes: Partial<Invoices>) => Promise<unknown> | void;
}) => {
  const [dismissed, setDismissed] = useState(false);
  const deliveryAddress = getOutdatedDeliveryAddress(invoice, client, contact);

  if (dismissed || !deliveryAddress) return null;

  return (
    <Callout.Root color="orange" className="mb-4">
      <Callout.Text>
        La fiche client a été modifiée après ce brouillon, son{" "}
        <Text weight="bold">adresse de livraison</Text> est différente de celle
        du document.
      </Callout.Text>
      <div className="text-sm space-y-1">
        <div>
          <Text color="gray">Document : </Text>
          <Text className="line-through opacity-75">
            {formatAddress(invoice.delivery_address) ||
              invoice.delivery_address?.address_line_1}
          </Text>
        </div>
        <div>
          <Text color="gray">Fiche client : </Text>
          <Text weight="medium">
            {formatAddress(deliveryAddress) || deliveryAddress.address_line_1}
          </Text>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={async () => {
            await onUpdate({ delivery_address: deliveryAddress });
          }}
        >
          Mettre à jour l'adresse de livraison
        </Button>
        <Button size="sm" theme="invisible" onClick={() => setDismissed(true)}>
          Ignorer
        </Button>
      </div>
    </Callout.Root>
  );
};
