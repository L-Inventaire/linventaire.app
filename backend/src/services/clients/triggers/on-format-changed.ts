import _ from "lodash";
import { default as Framework } from "../../../platform";
import Invoices, {
  InvoicesDefinition,
} from "../../modules/invoices/entities/invoices";
import Clients, { ClientsDefinition } from "../entities/clients";
import { getUsers } from "../services/client-users";

/** When invoice is updated, if it is completed, then trigger next step (generate invoice, change state etc) **/
export const setOnFormatChanged = () =>
  Framework.TriggersManager.registerTrigger<Clients>(ClientsDefinition, {
    test: (_ctx, entity, oldEntity) => {
      return !_.isEqual(oldEntity.invoices, entity.invoices);
    },
    callback: async (ctx, entity, oldEntity) => {
      const db = await Framework.Db.getService();

      const clientUsers = await getUsers(ctx, entity.id);

      // Select all Invoices created by client and are in draft state
      const clientInvoices = await db.select<Invoices>(
        { ...ctx, role: "SYSTEM" },
        InvoicesDefinition.name,
        {
          where: `state = 'draft' AND is_deleted = false AND created_by = ANY(ARRAY['${clientUsers
            .map((c) => c.user_id)
            .join("', '")}'])`,
          values: [],
        }
      );

      // When client default format is changed, update the formats (that are empty or are equal to old format) of all client invoice's
      for (const invoice of clientInvoices) {
        const intialFormat = _.cloneDeep(invoice.format);

        const keys = [
          "heading",
          "footer",
          "payment_terms",
          "tva",
          "branding",
          "color",
          "logo",
          "footer_logo",
          "template",
          "attachments",
        ];

        invoice.format = invoice.format || ({} as any);

        for (const key of keys) {
          if (
            _.isEmpty(invoice.format[key]) ||
            _.isEqual(invoice.format[key], oldEntity.invoices[key])
          ) {
            invoice.format[key] = entity.invoices[key];
          }
        }

        if (!_.isEqual(invoice.format, intialFormat)) {
          await db.update(
            ctx,
            InvoicesDefinition.name,
            { id: invoice.id },
            invoice
          );
        }
      }
    },
    name: "on-format-changed",
  });
