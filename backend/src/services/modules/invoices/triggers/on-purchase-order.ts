import Services from "#src/services/index";
import Clients, {
  ClientsDefinition,
} from "#src/services/clients/entities/clients";
import platform, { default as Framework } from "../../../../platform";
import Contacts, { ContactsDefinition } from "../../contacts/entities/contacts";
import { generateEmailMessageToRecipient } from "../../signing-sessions/services/utils";
import Invoices, { InvoicesDefinition, Recipient } from "../entities/invoices";
import { generatePdf } from "../services/generate-pdf";

/**
 * This trigger sends an email to the recipients of the quote when the quote is in the state "purchase_order"
 * The email contains the PDF of the quote
 * It will also set the completion date of the quote so we now when it was sent and when it'll be late
 */
export const setOnPurchaseOrderTrigger = () =>
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    test: (_ctx, entity, oldEntity) => {
      return (
        entity &&
        // Only client quotes automatically send an email when accepted
        ["quotes"].includes(entity.type) &&
        ["purchase_order"].includes(entity.state) &&
        oldEntity.state === "sent"
      );
    },
    callback: async (ctx, entity) => {
      const db = await Framework.Db.getService();
      const initialState = entity.state;

      // Only send email if a signing session was sent earlier
      const shouldSendEmails =
        await Services.SignatureSessions.hasSigningSessions(ctx, entity.id);

      if (shouldSendEmails) {
        const recipients: Recipient[] = (entity.recipients || []).filter(
          (r) => !!r.email
        );

        if (recipients.length > 0) {
          // TODO: change me to use a boolean or something
          // Check we did not already send the accepted email looking at the history
          try {
            const history = await Services.Rest.searchHistory<Invoices>(
              ctx,
              InvoicesDefinition.name,
              entity.id,
              50,
              0
            );
            if (history.list.some((a) => a.state === "purchase_order")) {
              throw new Error("Already sent purchase order email");
            }
          } catch (e) {
            // We won't send it
            return console.error(e);
          }
        }

        for (const recipient of recipients) {
          // Send email to recipient
          const { message, subject, htmlLogo } =
            await generateEmailMessageToRecipient(
              ctx,
              "purchase_order",
              entity,
              recipient
            );

          const { name, pdf: tmpPdf } = await generatePdf(
            { ...ctx, client_id: entity?.client_id },
            entity
          );
          let pdf = tmpPdf;

          // If there is signing sessions we can use the signed document directly
          try {
            const signedDocument =
              await Services.SignatureSessions.downloadSignedDocument(
                ctx,
                entity.id
              );
            pdf = signedDocument;
          } catch (err) {
            console.warn("No signed document available, using original PDF");
          }

          const client = await db.selectOne<Clients>(
            ctx,
            ClientsDefinition.name,
            { id: entity.client_id }
          );

          await platform.PushEMail.push(
            ctx,
            recipient.email,
            message,
            {
              from: client?.company?.name || client?.company?.legal_name,
              subject: subject,
              attachments: [{ filename: name, content: pdf }],
              logo: htmlLogo,
            },
            client.smtp
          );
        }
      }

      if (entity.state === "purchase_order") {
        // Set completion date
        entity.wait_for_completion_since = new Date();
      }

      if (initialState !== entity.state) {
        await db.update(
          ctx,
          InvoicesDefinition.name,
          { client_id: entity.client_id, id: entity.id },
          entity
        );
      }
    },
    name: "on-purchase_order-invoices",
  });
