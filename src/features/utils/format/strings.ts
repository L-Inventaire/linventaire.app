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

export const formatAmount = (number: number) => {
  return number.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
};

export const formatNumber = (number: number) => {
  return number.toLocaleString("fr-FR");
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

(window as any).getRandomHexColor = getRandomHexColor;
