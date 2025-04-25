import Framework from "#src/platform/index";
import _ from "lodash";
import ServiceTimes, { ServiceTimesDefinition } from "../entities/service-time";
import ServiceItems, { ServiceItemsDefinition } from "../entities/service-item";
import Articles, { ArticlesDefinition } from "../../articles/entities/articles";
import { convertUnit, supportedUnits } from "../utils";

export const setTimeToFillServiceTrigger = () => {
  Framework.TriggersManager.registerTrigger<ServiceTimes>(
    ServiceTimesDefinition,
    {
      test: (_ctx, newEntity, oldEntity) => {
        return newEntity?.quantity !== oldEntity?.quantity;
      },
      callback: async (ctx, entity, oldEntity) => {
        const db = await Framework.Db.getService();
        const serviceIds = _.uniq(
          [entity?.service, oldEntity?.service].filter(Boolean)
        );

        for (const serviceId of serviceIds) {
          const service = await db.selectOne<ServiceItems>(
            ctx,
            ServiceItemsDefinition.name,
            { id: serviceId },
            { include_deleted: true }
          );
          if (!service) {
            continue;
          }

          const article = await db.selectOne<Articles>(
            ctx,
            ArticlesDefinition.name,
            { id: service.article },
            { include_deleted: true }
          );
          const allTimes = await db.select<ServiceTimes>(
            ctx,
            ServiceTimesDefinition.name,
            {
              service: serviceId,
            },
            { limit: 100 }
          );

          const defaultUnit =
            article?.unit ||
            allTimes?.find((a) => supportedUnits?.time?.includes(a.unit))?.unit;

          const totalQuantity = allTimes.reduce(
            (acc, time) =>
              acc + toSameUnit(time.quantity, time.unit, defaultUnit), // TODO automatically convert to the same unit first
            0
          );

          await db.update<ServiceItems>(
            ctx,
            ServiceItemsDefinition.name,
            { id: serviceId },
            { quantity_spent: totalQuantity }
          );
        }
      },
    }
  );
};

const toSameUnit = (quantity: number, unit: string, defaultUnit = "unit") => {
  return convertUnit(quantity, unit, defaultUnit);
};
