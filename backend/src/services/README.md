This contains all the business services.

A business service is specific to the application. They must expose a single index.ts that will rarely be used by other business services (the lesser calls between business services the better the architecture is).

The index.ts must initialise:

- The routes
- The amqp subscribers (queues consumers)
- Cron jobs, Event bus, websocket subscribers, etc...

A business service usually have this structure:

```
index.ts  --- //Exposes the functions used by outside
types.ts  --- //DTOs for all this feature group, could be a folder to split in json.ts, dto.ts etc
routes.ts --- //The routes (directly call one or multiple ./services/***.ts)
entities/ --- //All the database entities (accessed only by the services)
services/ --- //The business logic
```
