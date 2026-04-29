import Framework from "#src/platform/index";
import Clients, {
  ClientsDefinition,
} from "#src/services/clients/entities/clients";
import Contacts, {
  ContactsDefinition,
} from "#src/services/modules/contacts/entities/contacts";
import Invoices, {
  InvoicesDefinition,
} from "#src/services/modules/invoices/entities/invoices";
import { getVatExemptionReason } from "#src/services/modules/invoices/types/maps";
import { Context } from "#src/types";

export const convertVatExemptionsToStandardCodes = async (ctx: Context) => {
  const db = await Framework.Db.getService();

  // Process clients
  let clientItems = [];
  let offset = 0;
  do {
    clientItems = await db.select<Clients>(
      ctx,
      ClientsDefinition.name,
      {},
      {
        offset,
        limit: 1000,
        index: "id",
      }
    );

    for (const entity of clientItems) {
      if (entity.invoices && entity.invoices.tva) {
        const standardCode = getVatExemptionReason(entity.invoices.tva);
        if (standardCode && standardCode !== entity.invoices.tva) {
          await db.update<Clients>(
            ctx,
            ClientsDefinition.name,
            { id: entity.id },
            {
              invoices: {
                ...entity.invoices,
                tva: standardCode,
              },
            },
            { triggers: false }
          );
        }
      }
    }

    offset += clientItems.length;
  } while (clientItems.length > 0);

  // Process contacts
  let contactItems = [];
  offset = 0;
  do {
    contactItems = await db.select<Contacts>(
      ctx,
      ContactsDefinition.name,
      {},
      {
        offset,
        limit: 1000,
        index: "id",
      }
    );

    for (const entity of contactItems) {
      if (entity.invoices && entity.invoices.tva) {
        const standardCode = getVatExemptionReason(entity.invoices.tva);
        if (standardCode && standardCode !== entity.invoices.tva) {
          await db.update<Contacts>(
            ctx,
            ContactsDefinition.name,
            { id: entity.id, client_id: entity.client_id },
            {
              invoices: {
                ...entity.invoices,
                tva: standardCode,
              },
            },
            { triggers: false }
          );
        }
      }
    }

    offset += contactItems.length;
  } while (contactItems.length > 0);

  // Process invoices
  let invoiceItems = [];
  offset = 0;
  do {
    invoiceItems = await db.select<Invoices>(
      ctx,
      InvoicesDefinition.name,
      {},
      {
        offset,
        limit: 1000,
        index: "id",
      }
    );

    for (const entity of invoiceItems) {
      if (entity.format && entity.format.tva) {
        const standardCode = getVatExemptionReason(entity.format.tva);
        if (standardCode && standardCode !== entity.format.tva) {
          await db.update<Invoices>(
            ctx,
            InvoicesDefinition.name,
            { id: entity.id, client_id: entity.client_id },
            {
              format: {
                ...entity.format,
                tva: standardCode,
              },
            },
            { triggers: false }
          );
        }
      }
    }

    offset += invoiceItems.length;
  } while (invoiceItems.length > 0);
};
