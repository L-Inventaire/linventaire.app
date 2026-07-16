import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const update = jest.fn();
const getService = jest.fn(async () => ({ update }));
const createEvent = jest.fn();

jest.mock("#src/platform/index", () => ({
  __esModule: true,
  default: { Db: { getService } },
}));

jest.mock("#src/services/index", () => ({
  __esModule: true,
  default: { Comments: { createEvent } },
}));

import { recordEmailSendResult } from "./email-send-result";

const ctx = { client_id: "cl-1", id: "us-1", role: "USER" } as any;
const invoice = (extra: any = {}) =>
  ({ id: "inv-1", client_id: "cl-1", type: "quotes", ...extra } as any);

describe("recordEmailSendResult", () => {
  beforeEach(() => {
    update.mockReset();
    createEvent.mockReset();
    getService.mockClear();
  });

  test("does nothing when everything was sent and no previous flag", async () => {
    await recordEmailSendResult(ctx, invoice(), ["a@b.com"], []);
    expect(createEvent).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  test("clears a previous flag once the send finally goes through", async () => {
    await recordEmailSendResult(
      ctx,
      invoice({ state_details: { email_status: "failed" } }),
      ["a@b.com"],
      []
    );
    expect(createEvent).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0][3] as any;
    expect(payload.state_details.email_status).toBe("");
    expect(payload.state_details.email_failed_recipients).toEqual([]);
  });

  test("records a TOTAL failure when every recipient was rejected", async () => {
    await recordEmailSendResult(
      ctx,
      invoice(),
      [],
      ["a@b.com", "c@d.com"]
    );

    expect(createEvent).toHaveBeenCalledTimes(1);
    const event = createEvent.mock.calls[0][1] as any;
    expect(event.metadata.event_type).toBe("smtp_failed");
    expect(event.metadata.partial).toBe(false);
    expect(event.metadata.emails).toEqual(["a@b.com", "c@d.com"]);

    const payload = update.mock.calls[0][3] as any;
    expect(payload.state_details.email_status).toBe("failed");
    expect(payload.state_details.email_failed_recipients).toEqual([
      "a@b.com",
      "c@d.com",
    ]);
  });

  test("records a PARTIAL failure when some recipients received it", async () => {
    await recordEmailSendResult(ctx, invoice(), ["a@b.com"], ["c@d.com"]);

    expect(createEvent).toHaveBeenCalledTimes(1);
    const event = createEvent.mock.calls[0][1] as any;
    expect(event.metadata.event_type).toBe("smtp_failed");
    expect(event.metadata.partial).toBe(true);
    expect(event.metadata.emails).toEqual(["c@d.com"]);
    expect(event.metadata.sent_emails).toEqual(["a@b.com"]);

    const payload = update.mock.calls[0][3] as any;
    expect(payload.state_details.email_status).toBe("partial");
  });
});
