import countries from "@assets/countries.json";
import { Address } from "@features/clients/types/clients";
import _ from "lodash";

export enum AddressLength {
  full = "full",
  part1 = "part1",
  part2 = "part2",
}

export function formatAddress(
  address: Address | null | undefined,
  length: AddressLength = AddressLength.full,
  placeholder?: string | null
): string {
  if (!address) return placeholder ?? "";

  if (
    ([AddressLength.full, AddressLength.part1].includes(length) &&
      _.isEmpty(address?.city)) ||
    (length === AddressLength.part2 && _.isEmpty(address?.zip))
  ) {
    return placeholder ?? "";
  }

  const country = (countries ?? []).find(
    (country) => country.code === address?.country
  );
  const firstLine = address?.address_line_1;
  const secondLine = `${address?.zip} ${address?.city?.toLocaleUpperCase()}, ${
    country?.name
  }`;

  if (length === AddressLength.full) {
    return [firstLine, secondLine].filter(Boolean).join(", ");
  }

  if (length === AddressLength.part1) {
    return firstLine;
  }

  if (length === AddressLength.part2) {
    return secondLine;
  }

  return placeholder || "";
}
