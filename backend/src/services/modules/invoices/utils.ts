import Framework from "#src/platform/index";
import Clients, {
  ClientsDefinition,
} from "#src/services/clients/entities/clients";
import { Context } from "#src/types";
import _ from "lodash";
import sharp from "sharp";
import { Files, FilesDefinition } from "../files/entities/files";
import { download } from "../files/services/files";
import Invoices from "./entities/invoices";

export const getCurrentYear = (timezone: string, date?: Date) => {
  date = new Date(date || Date.now());
  const dateString = Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return dateString.find((p) => p.type === "year")?.value || "1970";
};

export const getNumerotationType = (ctx: Context, invoice: Invoices) => {
  const type: keyof Clients["invoices_counters"][0] =
    invoice?.state === "draft" &&
    (invoice?.type === "invoices" || invoice?.type === "credit_notes")
      ? "drafts"
      : invoice?.type;
  return type;
};

export const getFormattedNumerotationConfiguration = async (
  ctx: Context,
  invoice: Invoices,
  counters?: Clients["invoices_counters"],
  timezone?: string // needed for years numbering related to emit date
) => {
  const type = getNumerotationType(ctx, invoice);

  const db = await Framework.Db.getService();
  let clientCounters = counters;
  if (!clientCounters) {
    const client = await db.selectOne<Clients>(ctx, ClientsDefinition.name, {
      id: invoice.client_id,
    });
    timezone = client?.preferences?.timezone || "Europe/Paris";
    clientCounters = client?.invoices_counters;
  }
  const year = getCurrentYear(timezone, new Date(invoice.emit_date));

  const counter = {
    format: clientCounters?.[year]?.[type]?.format,
    counter: clientCounters?.[year]?.[type]?.counter,
    timezone: timezone || "Europe/Paris",
  };

  return {
    year,
    type,
    counter,
  };
};

export const getFormattedNumerotationByInvoice = async (
  ctx: Context,
  invoice: Invoices,
  counters?: Clients["invoices_counters"],
  timezone?: string, // needed for years numbering related to emit date
  options = {
    force_counter: 0,
  }
) => {
  const { counter } = await getFormattedNumerotationConfiguration(
    ctx,
    invoice,
    counters,
    timezone
  );
  return getFormattedNumerotation(
    counter?.format || "",
    options?.force_counter || counter?.counter || 1,
    counter?.timezone,
    new Date(invoice.emit_date).getTime() || Date.now()
  );
};

export const getFormattedNumerotation = (
  format: string,
  counter: number,
  timezone: string, // needed for years numbering related to emit date
  datets?: number
) => {
  if (format.indexOf("@C") === -1) {
    format = format ? format + "-@C" : "@C";
  }
  const date = new Date(datets || Date.now());
  const dateString = Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = dateString.find((p) => p.type === "year")?.value || "1970";
  const month = dateString.find((p) => p.type === "month")?.value || "01";
  const day = dateString.find((p) => p.type === "day")?.value || "01";

  console.log("get new numerotation", format, counter, year, month, day, date);

  let n = format.replace(/@YYYY/g, year.toString());
  n = n.replace(/@YY/g, year.toString().slice(-2));
  n = n.replace(/@MM/g, month.toString().padStart(2, "0"));
  n = n.replace(/@DD/g, day.toString().padStart(2, "0"));
  n = n.replace(/@CCCCCCCC/g, counter.toString().padStart(8, "0"));
  n = n.replace(/@CCCCCCC/g, counter.toString().padStart(7, "0"));
  n = n.replace(/@CCCCCC/g, counter.toString().padStart(6, "0"));
  n = n.replace(/@CCCCC/g, counter.toString().padStart(5, "0"));
  n = n.replace(/@CCCC/g, counter.toString().padStart(4, "0"));
  n = n.replace(/@CCC/g, counter.toString().padStart(3, "0"));
  n = n.replace(/@CC/g, counter.toString().padStart(2, "0"));
  n = n.replace(/@C/g, counter.toString());

  return n;
};

export const getTvaValue = (tva: string): number => {
  tva = tva || "";
  if (tva.match(/^[0-9.]+.*$/)) {
    return parseFloat(tva.match(/^([0-9.]+).*$/)[1]) / 100;
  }
  return 0;
};

export const computePricesFromInvoice = (
  invoice: Pick<Invoices, "content" | "discount">,
  checkedIndexes?: { [key: number]: boolean }
): Invoices["total"] => {
  let initial = 0;
  let discount = 0;
  let taxes = 0;

  const content = [...invoice.content];
  for (const [index, item] of content.entries()) {
    let value = content[index]?.optional
      ? content[index]?.optional_checked
      : true;

    if (_.has(checkedIndexes, index)) {
      value = ["true", "1", 1, true].includes(
        checkedIndexes?.[index] as unknown as string
      )
        ? true
        : false;
    }

    content[index] = {
      ...item,
      optional_checked: value || false,
    };
  }

  content.forEach((item) => {
    if (!item.optional_checked) return;

    const itemsPrice =
      (parseFloat(item.unit_price as any) || 0) *
      (parseFloat(item.quantity as any) || 0);

    let itemsDiscount = 0;
    if (item.discount?.mode === "percentage") {
      itemsDiscount =
        (itemsPrice + itemsPrice * getTvaValue(item.tva || "")) *
        (parseFloat(item.discount.value as any) / 100);
    } else if (item.discount?.mode === "amount") {
      itemsDiscount = parseFloat(item.discount.value as any);
    }

    initial += itemsPrice;
    discount += itemsDiscount;

    taxes += itemsPrice * getTvaValue(item.tva || "");
  });

  if (invoice.discount?.mode === "percentage") {
    discount +=
      (initial - discount) * (parseFloat(invoice.discount.value as any) / 100);
  } else if (invoice.discount?.mode === "amount") {
    discount += parseFloat(invoice.discount.value as any);
  }
  const total = initial - discount;
  const total_with_taxes = total + taxes;

  return {
    initial: parseFloat(initial.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    taxes: parseFloat(taxes.toFixed(2)),
    total_with_taxes: parseFloat(total_with_taxes.toFixed(2)),
  };
};

export const getTimezoneOffset = (timezone: string) => {
  // Generating the formatted text
  // Setting the timeZoneName to longOffset will convert PDT to GMT-07:00
  const dateText = Intl.DateTimeFormat([], {
    timeZone: timezone,
    timeZoneName: "longOffset",
  }).format(new Date());

  // Scraping the numbers we want from the text
  // The default value '+0' is needed when the timezone is missing the number part. Ex. Africa/Bamako --> GMT
  let timezoneString = dateText.split(" ")[1].slice(3) || "+0";

  // Getting the offset
  let timezoneOffset = parseInt(timezoneString.split(":")[0]) * 60;

  // Checking for a minutes offset and adding if appropriate
  if (timezoneString.includes(":")) {
    timezoneOffset = timezoneOffset + parseInt(timezoneString.split(":")[1]);
  } else if (timezoneOffset === 0) {
    timezoneString = "";
  }

  return {
    offset: timezoneOffset,
    suffix: timezoneString,
    offsetms: timezoneOffset * 60000,
  };
};

export const getTimezoneDay = (date: Date | number, timezone: string) => {
  const offset = getTimezoneOffset(timezone).offset;
  const dateObj = new Date(date);
  dateObj.setMinutes(dateObj.getMinutes() + offset);
  return dateObj.getDay();
};

export const normalizeDate = (
  date: Date,
  timezone: string,
  edge: "to" | "from" = "from"
) => {
  const parts = Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const month = parts.find((p) => p.type === "month")?.value || "01";
  const day = parts.find((p) => p.type === "day")?.value || "01";
  const year = parts.find((p) => p.type === "year")?.value || "1970";

  const edgeVal = edge === "from" ? "00:00:00.000" : "23:59:59.999";

  const str = `${year}-${month}-${day}T${edgeVal}${
    getTimezoneOffset(timezone).suffix
  }`;

  date.setTime(Date.parse(str));
  return new Date(str);
};

export const getInvoiceLogo = async (
  ctx: Context,
  formatLogo: string | string[]
) => {
  const db = await Framework.Db.getService();
  const logo = typeof formatLogo === "string" ? formatLogo : formatLogo?.[0];
  // Retrieve attachments
  const logoEntity = await db.selectOne<Files | null>(
    ctx,
    FilesDefinition.name,
    {
      client_id: ctx.client_id,
      id: (logo || "").split(":").pop(),
    }
  );

  let logoBuffer = logoEntity
    ? await download(
        { ...ctx, client_id: logoEntity.client_id, role: "SYSTEM" },
        logoEntity
      )
    : null;

  if (logoBuffer)
    logoBuffer = await sharp(logoBuffer).toFormat("png").toBuffer();

  return logoBuffer;
};

export const getInvoiceLogoBase64 = async (
  ctx: Context,
  formatLogo: string | string[]
) => {
  function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  const tmp = await getInvoiceLogo(ctx, formatLogo);

  if (!tmp) return "";

  // Then prepend the PNG data URI:
  return "data:image/png;base64," + arrayBufferToBase64(tmp);
};

export const getInvoiceLogoHtml = async (
  ctx: Context,
  formatLogo: string | string[]
) => {
  const logo = await getInvoiceLogoBase64(ctx, formatLogo);
  if (!logo) {
    return "";
  }
  return `<img alt="Logo de l'entreprise" src="${logo}" style="width: auto; max-height: 40px; margin-bottom: 16px;" class="logo" />`;
};

export const numberOrNull = (value: any) => {
  const val = parseFloat(value);
  return _.isNumber(val) && !_.isNaN(val) ? val : null;
};
