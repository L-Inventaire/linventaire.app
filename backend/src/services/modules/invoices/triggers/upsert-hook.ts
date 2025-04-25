import _ from "lodash";
import Framework from "../../../../platform";
import Invoices, { InvoicesDefinition } from "../entities/invoices";
import { setArticlesTagsToInvoices } from "../services/db";
import { computePricesFromInvoice, numberOrNull } from "../utils";
import Clients, {
  ClientsDefinition,
} from "#src/services/clients/entities/clients";
import Contacts, { ContactsDefinition } from "../../contacts/entities/contacts";
import { getContactName } from "#src/services/utils";
import { getNewInvoicesAndNextDate } from "./recurring-generate-invoice";
import { Context } from "#src/types";
import { expandSearchable } from "#src/services/rest/services/rest";

/** Make sure autocomputed data are autocomputed **/
export const setUpsertHook = () =>
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    test: (_, entity) => !!entity,
    callback: async (ctx, entity, prev) => {
      const updated = _.cloneDeep(entity);
      const db = await Framework.Db.getService();

      // In case of duplication or creation, we need to set some default values
      if (!prev) {
        if (!entity.emit_date || entity.emit_date < new Date()) {
          entity.emit_date = new Date();
        }
        entity.subscription_ends_at = null;
        entity.subscription_started_at = null;
        entity.subscription_next_invoice_date = null;
        entity.next_reminder = null;
        entity.from_subscription = null;
      }

      if (
        entity &&
        entity.subscription_started_at !== prev?.subscription_started_at &&
        entity?.state === "recurring"
      ) {
        const client = await db.selectOne<Clients>(
          ctx,
          ClientsDefinition.name,
          { id: entity.client_id }
        );
        const { recheckAt } = getNewInvoicesAndNextDate(
          updated,
          {},
          client.preferences?.timezone || "Europe/Paris"
        );
        updated.subscription_next_invoice_date = recheckAt;
      }

      if (
        ![
          "draft",
          "sent",
          "purchase_order",
          "recurring",
          "completed",
          "closed",
        ].includes(updated.state)
      ) {
        updated.state = "draft";
      }

      updated.recipients = updated.recipients || [];

      // Fix content lines, make sure they have all required fields and no invisible fields still set after changing type for example
      updated.content = (updated.content || []).map((a) => {
        const canHaveArticle =
          a.type === "product" ||
          a.type === "service" ||
          a.type === "consumable";

        const canHavePrice = canHaveArticle || a.type === "correction";

        a.article = canHaveArticle ? a.article || "" : "";

        a.optional = canHaveArticle ? a.optional || false : false;
        a.optional_checked = a.optional ? a.optional_checked || false : false;

        a.quantity = canHaveArticle ? numberOrNull(a.quantity) || 0 : 0;
        a.quantity_delivered = canHaveArticle
          ? numberOrNull(a.quantity_delivered) || 0
          : 0;
        a.quantity_ready = canHaveArticle
          ? numberOrNull(a.quantity_ready) || 0
          : 0;

        a.subscription = canHaveArticle ? a.subscription || "" : "";
        a.unit_price = canHavePrice ? numberOrNull(a.unit_price) || 0 : 0;
        a.discount = canHaveArticle
          ? a.discount || { value: 0, mode: "amount" }
          : { value: 0, mode: "amount" };

        return a;
      });

      updated.total = computePricesFromInvoice(entity);

      updated.articles = updated.articles || ({} as any);
      updated.articles.all = (entity.content || []).map((a) => a.article);
      updated.articles.accepted = (entity.content || [])
        .filter((a) => a.optional && a.optional_checked)
        .map((a) => a.article);

      if (!_.isEqual(entity?.articles?.all, updated?.articles?.all)) {
        setArticlesTagsToInvoices(ctx, updated);
      }

      updated.has_subscription = (entity.content || []).some(
        (a) => a.subscription
      );

      if (!updated.emit_date) {
        updated.emit_date = new Date();
      }

      if (
        !updated.currency ||
        !updated.language ||
        !updated.payment_information ||
        !updated.format
      ) {
        const client = await db.selectOne<Clients>(
          ctx,
          ClientsDefinition.name,
          { id: entity.client_id }
        );

        if (!updated.currency) {
          updated.currency = client?.preferences.currency || "EUR";
        }

        if (!updated.language) {
          updated.language = client?.preferences.language || "en";
        }

        if (!updated.payment_information) {
          updated.payment_information = client?.payment;
        }

        if (!updated.format) {
          updated.format = {} as any;
        }

        if (!updated.subscription) {
          updated.subscription = client.recurring;
        }
      }

      // Set cached values for partners
      if (
        entity?.client !== prev?.client ||
        entity?.supplier !== prev?.supplier ||
        entity?.contact !== prev?.contact
      ) {
        await setCachePartnerNames(ctx, updated);
      }

      // Set cached values for origin quote id
      if (!_.isEqual(entity?.from_rel_quote, prev?.from_rel_quote)) {
        await setCacheQuoteRef(ctx, updated);
      }

      if (!_.isEqual(entity, updated)) {
        const db = await Framework.Db.getService();

        updated.searchable = expandSearchable(
          Framework.TriggersManager.getEntities()[
            InvoicesDefinition.name
          ].rest.searchable(updated)
        );

        await db.update<Invoices>(
          ctx,
          InvoicesDefinition.name,
          { client_id: entity.client_id, id: entity.id },
          updated
        );
      }
    },
    name: "upsert-hook-invoices",
    priority: 1, // High priority
  });

export const setCachePartnerNames = async (ctx: Context, updated: Invoices) => {
  const db = await Framework.Db.getService();

  updated.cache = updated.cache || ({} as any);
  updated.cache.partner_names = "";

  let partners = [updated.client, updated.supplier, updated.contact];
  if (updated?.from_rel_quote) {
    const quotes = await db.select<Invoices>(ctx, InvoicesDefinition.name, {
      id: updated.from_rel_quote,
      client_id: updated.client_id,
    });
    if (quotes?.length) {
      for (const quote of quotes) {
        partners.push(quote.client, quote.supplier, quote.contact);
      }
    }
  }
  partners = _.uniq(partners.filter(Boolean));

  for (const partner of partners) {
    if (partner) {
      const contact = await db.selectOne<Contacts>(
        ctx,
        ContactsDefinition.name,
        { id: partner, client_id: updated.client_id }
      );
      if (contact) {
        updated.cache.partner_names += getContactName(contact) + " ";
      }
    }
  }
};

export const setCacheQuoteRef = async (ctx: Context, updated: Invoices) => {
  if (!updated.from_rel_quote) {
    updated.cache = updated.cache || ({} as any);
    updated.cache.from_rel_quote_ref = "";
  } else {
    const db = await Framework.Db.getService();
    const quotes = await db.select<Invoices>(ctx, InvoicesDefinition.name, {
      id: updated.from_rel_quote,
      client_id: updated.client_id,
    });

    if (quotes?.length) {
      updated.cache = updated.cache || ({} as any);
      updated.cache.from_rel_quote_ref = quotes
        .map((quote) => quote.reference + " " + quote.alt_reference)
        .join(" ");
    }
  }
};
