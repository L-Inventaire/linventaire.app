/**
 * Map UN/ECE standard codes to internal unit keys (reverse lookup)
 * Used for parsing incoming e-invoices with standard codes
 */
export const standardCodeToUnit: Record<string, string> = {
  // Generic unit
  EA: "unit", // each

  // Time units
  C26: "ms", // millisecond
  SEC: "s", // second
  MIN: "min", // minute
  HUR: "h", // hour
  DAY: "d", // day
  WEE: "w", // week
  MON: "mo", // month
  ANN: "y", // year

  // Length units (metric)
  MMT: "mm", // millimetre
  CMT: "cm", // centimetre
  MTR: "m", // metre
  KMT: "km", // kilometre

  // Length units (imperial)
  INH: "in", // inch
  FOT: "ft", // foot
  YRD: "yd", // yard
  SMI: "mi", // mile (statute mile)

  // Mass units
  MGM: "mg", // milligram
  GRM: "g", // gram
  KGM: "kg", // kilogram
};

/**
 * Map standard VAT codes to internal VAT category keys (reverse lookup)
 * Used for parsing incoming e-invoices with standard VAT codes
 * Format: VAT category code : VAT exemption reason code
 */
export const standardCodeToVatCategory: Record<string, string> = {
  // Territorial scope
  "G:VATEX-EU-G": "Hors UE", // Export outside EU
  "K:VATEX-EU-IC": "En UE", // Intra-community supply
  "O:VATEX-EU-O": "Hors Taxe", // Outside VAT scope

  // Standard rates (S = Standard rate)
  "S:20": "20%", // Standard rate 20%
  "S:10": "10%", // Reduced rate 10%
  "S:8.5": "8.5%", // Reduced rate 8.5%
  "S:5.5": "5.5%", // Lower rate 5.5%
  "S:2.1": "2.1%", // Super-reduced rate 2.1%
};

/**
 * Map standard VAT codes to internal VAT category keys (reverse lookup)
 * Used for parsing incoming e-invoices with standard VAT codes
 * Format: VAT category code : VAT exemption reason code
 */
export const standardCodeToVatValue: Record<string, number> = {
  // Territorial scope
  "G:VATEX-EU-G": 0, // Export outside EU
  "K:VATEX-EU-IC": 0, // Intra-community supply
  "O:VATEX-EU-O": 0, // Outside VAT scope

  // Standard rates (S = Standard rate)
  "S:20": 20, // Standard rate 20%
  "S:10": 10, // Reduced rate 10%
  "S:8.5": 8.5, // Reduced rate 8.5%
  "S:5.5": 5.5, // Lower rate 5.5%
  "S:2.1": 2.1, // Super-reduced rate 2.1%
};

export const vatCategoryCodeToExemptionReason: Record<string, string> = {
  NONE: "(Aucune mention d'exemption TVA)", // No exemption

  // French specific exemptions
  "E:VATEX-FR-FRANCHISE": "TVA non applicable, art. 293 B du CGI",

  // Special schemes (art. 297 A du CGI)
  "E:VATEX-FR-297A-OCCASION":
    "Régime particulier - Biens d'occasion - article 297 A du CGI et directive communautaire 2006/112/CE",
  "E:VATEX-FR-297A-ART":
    "Régime particulier - Objets d'art - article 297 A du CGI et directive communautaire 2006/112/CE",
  "E:VATEX-FR-297A-COLLECTION":
    "Régime particulier - Objets de collection ou d'antiquité - article 297 A du CGI et directive communautaire 2006/112/CE",
  "E:VATEX-FR-297A-VOYAGE":
    "Régime particulier - Agences de voyage - article 297 A du CGI et directive communautaire 2006/112/CE",

  // Article 259 exemptions
  "O:VATEX-FR-CGI259-1": "TVA non applicable – art. 259-1 du CGI.",
  "AE:VATEX-FR-CGI259B":
    "Exonération de TVA en application de l'art. 259B du CGI, TVA due par le preneur",

  // EU directive exemptions
  "E:VATEX-EU-D44":
    "Exonération de TVA, article 44 de la directive 2006/112/CE.",
  "E:VATEX-FR-CGI262TER": "Exonération de TVA, article 262 ter, I du CGI.",
  "E:VATEX-FR-CGI283-2": "Exonération de TVA, article 283-2 du CGI.",
  "E:VATEX-FR-CGI262": "Exonération de TVA, article 262 du CGI",

  // Reverse charge (autoliquidation)
  "AE:VATEX-FR-CGI242":
    "TVA due par le preneur assujetti ; autoliquidation en application de l'article 242 nonies A, I-13° de l'annexe II du CGI.",
  "AE:VATEX-EU-AE":
    "Autoliquidation par le preneur (Art. 283-2 du CGI et Art. 44 de la directive 2008/8)",

  // Article 261-4 exemptions
  "E:VATEX-FR-CGI261-4-1":
    "TVA non applicable selon l'article 261-4-1° du Code Général des impôts",
  "E:VATEX-FR-CGI261-4-4":
    "TVA non applicable selon l'article 261-4-4° du Code Général des impôts",

  // Other exemptions
  "S:VATEX-FR-CGI279I": "Taux de TVA réduit, article 279-i du CGI",
  "E:VATEX-FR-CGI261C": "TVA non applicable, art. 261 C du CGI",
};

export const getVatExemptionReason = (value: string): string | null => {
  if (vatCategoryCodeToExemptionReason[value]) {
    return value;
  }
  return (
    Object.keys(vatCategoryCodeToExemptionReason).find(
      (key) => vatCategoryCodeToExemptionReason[key] === value
    ) || null
  );
};

export const getVatCategory = (value: string): string | null => {
  if (standardCodeToVatCategory[value]) {
    return value;
  }
  return (
    Object.keys(standardCodeToVatCategory).find(
      (key) => standardCodeToVatCategory[key] === value
    ) || null
  );
};

export const getUnitCode = (value: string): string | null => {
  if (standardCodeToUnit[value]) {
    return value;
  }
  return (
    Object.keys(standardCodeToUnit).find(
      (key) => standardCodeToUnit[key] === value
    ) || null
  );
};

export const getUnitLabel = (code: string): string => {
  return standardCodeToUnit[code] || code;
};
