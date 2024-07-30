import Env from "@config/environment";

export const validateEmail = (email: string) => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};

export const validatePassword = (password: string) => {
  const defaultRegex = new RegExp(
    "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})"
  );
  return defaultRegex.test(password);
};

export const stringToColor = (str: string, saturation = 70, lightness = 50) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  return `hsl(${hash % 360}, ${saturation}%, ${lightness}%)`;
};

export const ellipsis = (str: string, length: number) => {
  return str.length > length ? str.substring(0, length) + "..." : str;
};

export const formatIBAN = (iban: string) => {
  return (
    iban &&
    iban
      .toLocaleUpperCase()
      .replace(/[^A-Z0-9]/gm, "")
      .replace(/([A-Z0-9]{4})/g, "$1 ")
      .replace(/ $/gm, "")
  );
};

export const formatAmount = (number: number, currency = "EUR") => {
  return (parseFloat(number as any) || 0).toLocaleString("fr-FR", {
    style: "currency",
    currency,
  });
};

export const formatNumber = (number: number) => {
  return (number || 0).toLocaleString("fr-FR");
};

export const applySearchFilter = (search: string, item: string) => {
  search = search || "";
  item = item || "";

  //item = search // monkey patch
  const normalizedSearch = search
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase(); // Normalize and convert to lowercase for case-insensitive comparison

  const normalizedItem = item
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase(); // Normalize and convert to lowercase for case-insensitive comparison

  const searchWords = normalizedSearch.split(/\s+/); // Split search string into words
  return searchWords.every((word) => normalizedItem.includes(word));
};

export const normalizeString = (str: string) => {
  return str
    .normalize("NFD") // Décompose les lettres en leurs composants diacritiques de base
    .replace(/[\u0300-\u036f]/g, "") // Supprime les diacritiques
    .toLowerCase(); // Convertit la chaîne en minuscules
};

export const normalizeStringToKey = (str: string) => {
  return normalizeString(str).replace(/ +/gm, "_");
};

export const buildSearchURL = (params: any): string => {
  const urlParams = new URLSearchParams(params as any).toString();
  return urlParams;
};

export const getEmailsFromString = (str: string) => {
  return (
    (str || "").match(
      /[^<>()[\]\\.,;:\s@"]+@([^<>()[\]\\.,;:\s@"]+\.)+[a-zA-Z0-9]+/g
    ) || []
  );
};

export const getServerUri = (src?: string) => {
  if (!src) return null;
  if (src.startsWith("http") || src.startsWith("data:image")) return src;
  return Env.server.replace(/\/$/, "") + src;
};

export const getRandomHexColor = () => {
  return (
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
      .replace(/../g, (x) =>
        Math.floor(parseInt(x, 16) * 0.8)
          .toString(16)
          .padStart(2, "0")
      )
  );
};

export function bytesFormat(bytes: number, si = true, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }

  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + " " + units[u];
}

export function centerEllipsis(str: string) {
  const length = 20;
  if (str.length > length) {
    return (
      str.substr(0, length - 12) +
      "..." +
      str.substr(str.length - 7, str.length)
    );
  }
  return str;
}

export const getTextFromHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};
