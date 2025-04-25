import Framework from "../../../platform";
import { Context } from "../../../types";
import Events, { EventsDefinition } from "../entities/events";

export const getEvents = async (
  ctx: Context,
  query: {
    from: number;
    to: number;
    offset: number;
    limit: number;
  }
) => {
  const db = await Framework.Db.getService();

  return await db.select<Events>(
    ctx,
    EventsDefinition.name,
    {
      where: `client_id = ? AND created_at >= ? AND created_at <= ?`,
      values: [ctx.client_id, query.from, query.to],
    },
    {
      limit: query.limit,
      offset: query.offset,
    }
  );
};
