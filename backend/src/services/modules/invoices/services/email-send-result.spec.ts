import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const update = jest.fn();
const selectOne = jest.fn();
const getService = jest.fn(async () => ({ update, selectOne }));
const createEvent = jest.fn();

jest.mock("#src/platform/index", () => ({
  __esModule: true,
  default: { Db: { getService }, LoggerDb: { get: () => ({ error: jest.fn() }) } },
}));

jest.mock("#src/services/index", () => ({
  __esModule: true,
  default: { Comments: { createEvent } },
}));

import {
  markEmailReceived,
  markEmailSent,
  recordEmailSendResult,
  scheduleEmailSendResultCheck,
} from "./email-send-result";

const ctx = { client_id: "cl-1", id: "us-1", role: "USER" } as any;
const invoice = (extra: any = {}) =>
  ({ id: "inv-1", client_id: "cl-1", type: "quotes", ...extra } as any);

describe("recordEmailSendResult", () => {
  beforeEach(() => {
    update.mockReset();
    selectOne.mockReset();
    createEvent.mockReset();
    getService.mockClear();
  });

  test("does nothing when everything was sent", async () => {
    await recordEmailSendResult(ctx, invoice(), ["a@b.com"], []);
    expect(createEvent).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  test("does nothing on success even if a previous flag exists (handled elsewhere)", async () => {
    await recordEmailSendResult(
      ctx,
      invoice({ state_details: { email_status: "failed" } }),
      ["a@b.com"],
      []
    );
    expect(createEvent).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
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

describe("scheduleEmailSendResultCheck", () => {
  beforeEach(() => {
    update.mockReset();
    createEvent.mockReset();
    getService.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("after the delay, flags the recipients the transport rejected", async () => {
    const recipients = [{ email: "a@b.com" }, { email: "c@d.com" }];
    const deliveries = {
      "a@b.com": { success: true },
      "c@d.com": { success: false, error: "nope" },
    };

    scheduleEmailSendResultCheck(ctx, invoice(), recipients, deliveries, 1000);

    // Nothing happens before the delay elapses.
    expect(createEvent).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1000);

    expect(createEvent).toHaveBeenCalledTimes(1);
    const event = createEvent.mock.calls[0][1] as any;
    expect(event.metadata.event_type).toBe("smtp_failed");
    expect(event.metadata.partial).toBe(true);
    expect(event.metadata.emails).toEqual(["c@d.com"]);
    expect(event.metadata.sent_emails).toEqual(["a@b.com"]);
  });

  test("treats recipients with no reported result as sent", async () => {
    const recipients = [{ email: "a@b.com" }];
    // The transport never reported back by the deadline.
    const deliveries = {};

    scheduleEmailSendResultCheck(ctx, invoice(), recipients, deliveries, 1000);
    await jest.advanceTimersByTimeAsync(1000);

    expect(createEvent).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});

describe("markEmailSent", () => {
  beforeEach(() => {
    update.mockReset();
    getService.mockClear();
  });

  test("flags the document as 'sent'", async () => {
    await markEmailSent(ctx, invoice());
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0][3] as any;
    expect(payload.state_details.email_status).toBe("sent");
  });

  test("never downgrades a 'received' confirmation", async () => {
    await markEmailSent(ctx, invoice({ state_details: { email_status: "received" } }));
    expect(update).not.toHaveBeenCalled();
  });
});

describe("markEmailReceived", () => {
  beforeEach(() => {
    update.mockReset();
    selectOne.mockReset();
    getService.mockClear();
  });

  test.each([[""], ["sent"]])(
    "flags 'received' when current status is %p",
    async (current) => {
      selectOne.mockResolvedValue(
        invoice({ state_details: { email_status: current } }) as never
      );
      await markEmailReceived(ctx, "inv-1");
      expect(update).toHaveBeenCalledTimes(1);
      const payload = update.mock.calls[0][3] as any;
      expect(payload.state_details.email_status).toBe("received");
    }
  );

  test.each([["failed"], ["partial"], ["received"]])(
    "does not override a %p status (no recipient given)",
    async (current) => {
      selectOne.mockResolvedValue(
        invoice({ state_details: { email_status: current } }) as never
      );
      await markEmailReceived(ctx, "inv-1");
      expect(update).not.toHaveBeenCalled();
    }
  );

  test("does nothing when the document is not found", async () => {
    selectOne.mockResolvedValue(null as never);
    await markEmailReceived(ctx, "missing");
    expect(update).not.toHaveBeenCalled();
  });

  test("records a specific recipient as delivery-confirmed", async () => {
    selectOne.mockResolvedValue(
      invoice({ state_details: { email_status: "sent" } }) as never
    );
    await markEmailReceived(ctx, "inv-1", "a@b.com");
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0][3] as any;
    expect(payload.state_details.email_status).toBe("received");
    expect(payload.state_details.email_received_recipients).toEqual(["a@b.com"]);
  });

  test("adds a recipient without dropping the ones already confirmed", async () => {
    selectOne.mockResolvedValue(
      invoice({
        state_details: {
          email_status: "received",
          email_received_recipients: ["a@b.com"],
        },
      }) as never
    );
    await markEmailReceived(ctx, "inv-1", "c@d.com");
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0][3] as any;
    expect(payload.state_details.email_received_recipients).toEqual([
      "a@b.com",
      "c@d.com",
    ]);
  });

  test("records a recipient without downgrading a partial failure", async () => {
    selectOne.mockResolvedValue(
      invoice({
        state_details: {
          email_status: "partial",
          email_failed_recipients: ["x@y.com"],
        },
      }) as never
    );
    await markEmailReceived(ctx, "inv-1", "a@b.com");
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0][3] as any;
    // Failure stays actionable...
    expect(payload.state_details.email_status).toBe("partial");
    expect(payload.state_details.email_failed_recipients).toEqual(["x@y.com"]);
    // ...but the confirmed recipient is still recorded.
    expect(payload.state_details.email_received_recipients).toEqual(["a@b.com"]);
  });

  test("does not write when the recipient is already recorded", async () => {
    selectOne.mockResolvedValue(
      invoice({
        state_details: {
          email_status: "received",
          email_received_recipients: ["a@b.com"],
        },
      }) as never
    );
    await markEmailReceived(ctx, "inv-1", "a@b.com");
    expect(update).not.toHaveBeenCalled();
  });
});
