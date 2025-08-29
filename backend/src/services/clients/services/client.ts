import Services from "#src/services/index";
import AccountingAccounts, {
  AccountingAccountsDefinition,
} from "#src/services/modules/accounting/entities/accounts";
import Articles, {
  ArticlesDefinition,
} from "#src/services/modules/articles/entities/articles";
import _ from "lodash";
import { default as Framework, default as platform } from "../../../platform";
import { id } from "../../../platform/db/utils";
import { Context, NotFoundError } from "../../../types";
import Clients, {
  ClientsDefinition,
  InvoiceFormat,
  Payment,
} from "../entities/clients";
import { checkRoles, checkRolesOrThrow, getClients } from "./client-roles";
import { setUser } from "./client-users";

export const getClient = async (ctx: Context, id: string) => {
  if (!(await checkRoles(ctx, id, []))) throw NotFoundError("Client not found");

  const driver = await platform.Db.getService();
  const client = await driver.selectOne<Clients>(
    ctx,
    ClientsDefinition.name,
    {
      id: id,
    },
    {}
  );

  // Payment information is only available to users with ACCOUNTING related role
  if (
    !(await checkRoles(ctx, id, ["ACCOUNTING_READ"])) &&
    !(await checkRoles(ctx, id, ["INVOICES_READ"])) &&
    !(await checkRoles(ctx, id, ["QUOTES_READ"])) &&
    !(await checkRoles(ctx, id, ["SUPPLIER_INVOICES_READ"])) &&
    !(await checkRoles(ctx, id, ["SUPPLIER_QUOTES_READ"]))
  ) {
    delete client.invoices;
    delete client.payment;
  }

  // Here will go every sensitive information that should be hidden from the non managers
  if (!(await checkRoles(ctx, id, ["CLIENT_MANAGE"]))) {
    delete client.smtp;
  }

  client.invoices_counters = getInvoiceCounters(client.invoices_counters);

  return client;
};

export const getInvoiceCounters = (
  counters: Clients["invoices_counters"],
  date?: Date | string | number
) => {
  let existing = counters || {};
  const now = date || Date.now();

  // Retro compatibility (to remove after 06-2025)
  if (
    (existing as unknown as Clients["invoices_counters"][0]).invoices &&
    !existing[new Date().getFullYear().toString()]
  ) {
    existing = {
      [new Date(now).getFullYear().toString()]:
        existing as unknown as Clients["invoices_counters"][0],
      [(new Date(now).getFullYear() - 1).toString()]:
        existing as unknown as Clients["invoices_counters"][0],
    };

    // Remove all non-year entries
    for (const year of Object.keys(existing)) {
      if (!year.match(/^\d{4}$/)) {
        delete existing[year];
      } else {
        existing[year] = _.pick(
          existing[year],
          "invoices",
          "quotes",
          "credit_notes",
          "supplier_invoices",
          "supplier_credit_notes",
          "supplier_quotes",
          "drafts"
        );
      }
    }
  }
  // Remove any non-year keys (also to remove after 06-2025)
  existing = _.omitBy(existing, (_, key) => !key.match(/[0-9]{4}/));

  const yearsToCreate = [
    new Date(now).getFullYear().toString(),
    new Date(new Date(now).getTime() + 24 * 60 * 60 * 1000)
      .getFullYear()
      .toString(),
  ];
  // In case we are the 31st of December, we need to create the next year counter too for timezone issues
  for (const year of yearsToCreate) {
    if (!existing[year]) {
      existing[year] =
        Object.keys(existing).length === 0
          ? // Set a default format
            defaultCounters
          : // Copy the previous year formats
            _.mapValues(
              existing[_.last(_.sortBy(Object.keys(existing), (a) => a))],
              (v) => ({
                ...v,
                counter: 1,
              })
            );
    }
  }

  return existing;
};

export const defaultCounters = {
  invoices: {
    format: "F-@YYYY-@C",
    counter: 1,
  },
  quotes: {
    format: "D-@YYYY-@C",
    counter: 1,
  },
  credit_notes: {
    format: "AV-@YYYY-@C",
    counter: 1,
  },
  supplier_invoices: {
    format: "FF-@YYYY-@C",
    counter: 1,
  },
  supplier_credit_notes: {
    format: "AVF-@YYYY-@C",
    counter: 1,
  },
  supplier_quotes: {
    format: "C@C",
    counter: 1,
  },
  drafts: {
    format: "Draft-@C",
    counter: 1,
  },
};

export const createClient = async (ctx: Context, body: Partial<Clients>) => {
  const db = await platform.Db.getService();
  return await db.transaction(ctx, async (ctx) => {
    const clientId = id();
    await db.insert<Clients>(ctx, ClientsDefinition.name, {
      preferences: {
        language: "en",
      },
      payment: {} as Payment,
      invoices: {
        branding: true,
      } as InvoiceFormat,
      service_items: {
        default_article: "",
      },
      smtp: {} as any,
      invoices_counters: getInvoiceCounters({}),
      recurring: {} as Clients["recurring"],
      address: {
        address_line_1: "",
        address_line_2: "",
        region: "",
        country: "",
        zip: "",
        city: "",
      },
      company: {
        name: "",
        legal_name: "",
        registration_number: "",
        tax_number: "",
      },
      ...body,

      id: clientId,
      created_at: Date.now(),
      configuration: {
        plan: "",
      },
    });

    const client = await getClient({ ...ctx, role: "SYSTEM" }, clientId);

    if (!client) throw NotFoundError("Client not created");

    await setUser({ ...ctx, role: "SYSTEM" }, client.id, ctx.id, {
      list: ["CLIENT_MANAGE"],
    });

    const new_article_id = id();

    await db.insert<Partial<Articles>>(ctx, ArticlesDefinition.name, {
      id: new_article_id,
      client_id: client.id,
      name: Framework.I18n.t(ctx, "articles.default_service_items"),
      unit: "h",
      type: "service",
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: ctx.id,
    });

    await Services.Rest.create<Partial<AccountingAccounts>>(
      ctx,
      AccountingAccountsDefinition.name,
      {
        client_id: ctx.client_id,
        type: "internal",
        standard_identifier: "512",
        standard: "pcg",
        name: "Banque par défaut",
        notes: "",
      }
    );

    await db.update<Clients>(
      ctx,
      ClientsDefinition.name,
      { id: client.id },
      { service_items: { default_article: new_article_id } }
    );

    return (await getClients(ctx)).find((c) => c.client_id === client.id);
  });
};

export const updateClient = async (
  ctx: Context,
  clientId: string,
  body: Partial<Clients>
) => {
  await checkRolesOrThrow(ctx, clientId, ["CLIENT_MANAGE"]);

  if (typeof body.preferences?.logo === "string") {
    await setLogo(ctx, clientId, body.preferences.logo);
  }

  const db = await platform.Db.getService();
  return await db.transaction(ctx, async (ctx) => {
    const client = await db.selectOne<Clients>(
      ctx,
      ClientsDefinition.name,
      { id: clientId },
      {}
    );

    client.invoices_counters = Object.assign(client.invoices_counters || {}, {
      ...(client.invoices_counters || ({} as any)),
      ...body.invoices_counters,
    });

    client.invoices = Object.assign(client.invoices || {}, {
      ...(client.invoices || ({} as any)),
      ...body.invoices,
    });

    client.recurring = Object.assign(client.recurring || {}, {
      ...(client.recurring || ({} as any)),
      ...body.recurring,
    });

    client.payment = Object.assign(client.payment || {}, {
      ...(client.payment || ({} as any)),
      ...body.payment,
    });

    client.smtp = Object.assign(client.smtp || {}, {
      ...(client.smtp || ({} as any)),
      ...body.smtp,
    });

    client.preferences = Object.assign(client.preferences, {
      ...client.preferences,
      ..._.pick(
        body.preferences,
        "language",
        "currency",
        "timezone",
        "email_footer"
      ),
    });

    client.service_items = Object.assign(client.service_items || {}, {
      ...(client.service_items || ({} as any)),
      ...body.service_items,
    });

    client.address = Object.assign(client.address, {
      ...client.address,
      ..._.pick(
        body.address,
        "address_line_1",
        "address_line_2",
        "region",
        "country",
        "zip",
        "city"
      ),
    });

    client.company = Object.assign(client.company, {
      ...client.company,
      ..._.pick(
        body.company,
        "name",
        "legal_name",
        "registration_number",
        "tax_number"
      ),
    });

    await db.update<Clients>(
      ctx,
      ClientsDefinition.name,
      { id: clientId },
      {
        preferences: client.preferences,
        address: client.address,
        company: client.company,
        payment: client.payment,
        invoices: client.invoices,
        invoices_counters: client.invoices_counters,
        service_items: client.service_items,
        smtp: client.smtp,
        recurring: client.recurring,
      }
    );

    return client;
  });
};

export const setLogo = async (
  ctx: Context,
  id: string,
  logo: string
): Promise<void> => {
  const db = await platform.Db.getService();
  await db.transaction(ctx, async (ctx) => {
    const client = await db.selectOne<Clients>(
      ctx,
      ClientsDefinition.name,
      { id },
      {}
    );

    if (logo && logo.length > 0 && logo.indexOf("/api/") === -1) {
      //Upload logo and store url to preferences
      //      const base64Data = Buffer.from(logo.split(",").pop(), "base64");
      await platform.S3.upload(
        `/logos/${client.id}.png`,
        Buffer.from(logo.split(",").pop(), "base64")
      );
      logo = `/api/clients/v1/clients/${client.id}/logo?t=${Date.now()}`;
    }

    client.preferences = Object.assign(client.preferences, { logo });

    await db.update<Clients>(
      ctx,
      ClientsDefinition.name,
      { id },
      { preferences: client.preferences }
    );

    return client.preferences;
  });
};

export const getLogo = async (_ctx: Context, clientId: string) => {
  clientId = clientId.replace(/[/]/g, "");
  const content = await platform.S3.download(`/logos/${clientId}.png`);
  const base64 = Buffer.from(content).toString("base64");
  return Buffer.from(base64.split(",").pop(), "base64");
};
