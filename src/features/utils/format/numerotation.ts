export const getFormattedNumerotation = (
  format: string,
  counter: number,
  draft?: boolean
) => {
  let n = format.replace(/@YYYY/g, new Date().getFullYear().toString());
  n = n.replace(/@YY/g, new Date().getFullYear().toString().slice(-2));
  n = n.replace(
    /@MM/g,
    (new Date().getMonth() + 1).toString().padStart(2, "0")
  );
  n = n.replace(/@DD/g, new Date().getDate().toString().padStart(2, "0"));
  n = n.replace(/@CCCCCC/g, counter.toString().padStart(6, "0"));
  n = n.replace(/@CCCCC/g, counter.toString().padStart(5, "0"));
  n = n.replace(/@CCCC/g, counter.toString().padStart(4, "0"));
  n = n.replace(/@CCC/g, counter.toString().padStart(3, "0"));
  n = n.replace(/@CC/g, counter.toString().padStart(2, "0"));
  n = n.replace(/@C/g, counter.toString());

  if (draft) n += "-DRAFT";

  return n;
};
