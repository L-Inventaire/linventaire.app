export const currencyOptions = [
  {
    label: "EUR (Euro)",
    value: "EUR",
  },
  {
    label: "USD (Dollar américain)",
    value: "USD",
  },
];

export const languageOptions = [
  {
    label: "Français",
    value: "fr",
  },
  {
    label: "English",
    value: "en",
  },
];

export const paymentOptions = [
  {
    label: "Virement",
    value: "bank_transfer",
  },
  {
    label: "Chèque",
    value: "check",
  },
  {
    label: "Espèces",
    value: "cash",
  },
  {
    label: "Prélèvement",
    value: "direct_debit",
  },
];

export const paymentDelayOptions = [
  {
    label: "Classique",
    value: "direct",
  },
  {
    label: "Délai de X jours, puis fin de mois",
    value: "month_end_delay_first",
  },
  {
    label: "Fin de mois, puis délai de X jours",
    value: "month_end_delay_last",
  },
  {
    label: "Date spécifique",
    value: "date",
  },
];
