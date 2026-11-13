/** ISO 3166-1 alpha-2 codes proposed in the address forms (assets/countries.json) */
export const COUNTRY_CODES: readonly string[] = [
  "AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT",
  "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BA", "BW", "BV",
  "BR", "IO", "BN", "BG", "BF", "BI", "KH", "CM", "CA", "CV", "KY", "CF", "TD", "CL", "CN",
  "CX", "CC", "CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CY", "CZ", "DK", "DJ",
  "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "ET", "FK", "FO", "FJ", "FI", "FR", "GF",
  "PF", "TF", "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG",
  "GN", "GW", "GY", "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE",
  "IM", "IL", "IT", "JM", "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA",
  "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MK", "MG", "MW", "MY", "MV", "ML",
  "MT", "MH", "MQ", "MR", "MU", "YT", "MX", "FM", "MD", "MC", "MN", "MS", "MA", "MZ", "MM",
  "NA", "NR", "NP", "NL", "AN", "NC", "NZ", "NI", "NE", "NG", "NU", "NF", "MP", "NO", "OM",
  "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR", "QA", "RE", "RO",
  "RU", "RW", "SH", "KN", "LC", "PM", "VC", "WS", "SM", "ST", "SA", "SN", "CS", "SC", "SL",
  "SG", "SK", "SI", "SB", "SO", "ZA", "GS", "ES", "LK", "SD", "SR", "SJ", "SZ", "SE", "CH",
  "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK", "TO", "TT", "TN", "TR", "TM", "TC", "TV",
  "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU", "VE", "VN", "VG", "VI", "WF", "EH",
  "YE", "ZM", "ZW",
];

const COUNTRY_CODES_SET = new Set(COUNTRY_CODES);

/**
 * Country of an address as an ISO 3166-1 alpha-2 code, only when it is
 * recognized for sure:
 * - "" when there is no country (an address without country is in France),
 * - the code for a known code ("FR", "be") or the legacy locale-like format
 *   where both parts are the same known code ("FR-FR", "BE-BE"),
 * - null for anything else ("France", "Allemagne", "FR-BE", "1"...): the
 *   country is unknown, it must never be guessed (a French customer taken for
 *   a foreign one would never get its e-invoice).
 */
export const parseCountryCode = (country?: string | null): string | null => {
  const value = (country || "").trim().toUpperCase();
  if (!value) return "";
  if (COUNTRY_CODES_SET.has(value)) return value;
  const legacy = value.match(/^([A-Z]{2})-([A-Z]{2})$/);
  if (legacy && legacy[1] === legacy[2] && COUNTRY_CODES_SET.has(legacy[1])) {
    return legacy[1];
  }
  return null;
};

/** Message of the error for a country that is not recognized */
export const unknownCountryError = (country?: string | null) =>
  `Pays non reconnu dans l'adresse (« ${(country || "").trim()} ») : corrigez le pays de l'adresse.`;
