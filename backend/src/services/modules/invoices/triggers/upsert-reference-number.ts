import { defaultCounters } from "#src/services/clients/services/client";
import { expandSearchable } from "#src/services/rest/services/rest";
import Services from "../../..";
import Framework from "../../../../platform";
import InvoicesType, { InvoicesDefinition } from "../entities/invoices";
import {
  getFormattedNumerotationByInvoice,
  getFormattedNumerotationConfiguration,
} from "../utils";

/** Will ensure unicity of references and increment client's counters */
export const setNumetorationTrigger = () =>
  Framework.TriggersManager.registerTrigger<InvoicesType>(InvoicesDefinition, {
    test: (_ctx, newEntity, oldEntity) => {
      return (
        !!newEntity &&
        (!oldEntity ||
          newEntity?.reference?.indexOf("INV") >= 0 ||
          newEntity?.state !== oldEntity?.state ||
          newEntity?.reference !== oldEntity?.reference ||
          newEntity?.emit_date !== oldEntity?.emit_date)
      ); // Created or draft status changed
    },
    callback: async (ctx, entity, oldEntity) => {
      // Get current counters
      const db = await Framework.Db.getService();
      const allCounters = await Services.Clients.getInvoicesCounters(
        ctx,
        entity.client_id,
        entity.emit_date
      );
      const { year, type } = await getFormattedNumerotationConfiguration(
        ctx,
        entity,
        allCounters.counters,
        allCounters.timezone
      );
      if (!allCounters.counters?.[year]) {
        allCounters.counters[year] =
          Object.values(allCounters.counters)[0] || defaultCounters;
      }
      if (
        !allCounters.counters?.[year]?.[type]?.counter ||
        allCounters.counters?.[year]?.[type]?.counter === 0
      ) {
        allCounters.counters[year][type].counter = 0;
      }

      // Get current reference, force a numbering if invalid or missing reference
      let reference = entity.reference;
      if (
        entity?.reference?.indexOf("INV") >= 0 ||
        (oldEntity && entity && entity?.emit_date !== oldEntity?.emit_date) ||
        ((oldEntity?.state === "draft" || entity?.state === "draft") &&
          entity?.state !== oldEntity?.state &&
          (entity?.type === "invoices" || entity?.type === "credit_notes"))
      ) {
        reference = await getFormattedNumerotationByInvoice(
          ctx,
          entity,
          allCounters.counters,
          allCounters.timezone,
          {
            // Draft invoices are the only ones that can't change their reference
            force_counter:
              entity?.state === "draft" &&
              (entity?.type === "invoices" || entity?.type === "credit_notes")
                ? 0
                : entity.reference_preferred_value,
          }
        );
      }

      // Increase counter until unique reference is found
      let exists = true;
      let prevReference = reference;
      let iterations = 0;
      while (exists) {
        const sames = await db.select<InvoicesType>(
          ctx,
          InvoicesDefinition.name,
          {
            reference,
            client_id: entity.client_id,
          },
          { limit: 2 }
        );
        if (reference && sames.every((a) => a.id === entity.id)) {
          exists = false;
          break;
        }

        prevReference = reference;
        reference = await getFormattedNumerotationByInvoice(
          ctx,
          entity,
          allCounters.counters,
          allCounters.timezone
        );
        allCounters.counters[year][type].counter++;

        // After first iteration (where counter may be the same as the one used for iitial reference, we'll check if values change)
        if (reference === prevReference && iterations > 3) {
          throw new Error(
            "Reference don't change ! " + prevReference + " == " + reference
          );
        }

        iterations++;
      }

      // Save new reference
      if (reference !== entity.reference) {
        const searchable = expandSearchable(
          entity.searchable + " " + reference
        );
        await db.update<InvoicesType>(
          ctx,
          InvoicesDefinition.name,
          { client_id: entity.client_id, id: entity.id },
          {
            reference,
            searchable,
            // If no value was defined, we define one
            reference_preferred_value:
              entity.reference_preferred_value ||
              (entity?.state === "draft" &&
              (entity?.type === "invoices" || entity?.type === "credit_notes")
                ? 0
                : allCounters.counters[year][type].counter),
          }
        );
      }

      if (allCounters?.counters?.[year]) {
        await Services.Clients.updateInvoicesCounters(ctx, entity.client_id, {
          ...(allCounters?.counters || {}),
          [year]: {
            ...allCounters.counters[year],
            [type]: allCounters.counters[year][type],
          },
        });
      } else {
        throw new Error("No counters found for year " + year);
      }
    },
    name: "numerotation-invoices",
  });
