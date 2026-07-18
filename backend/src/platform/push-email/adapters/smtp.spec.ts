import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const sendMail = jest.fn();

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: { createTransport: () => ({ sendMail }) },
}));

// Framework (../..) is only used for the logger here.
jest.mock("../..", () => ({
  __esModule: true,
  default: { LoggerDb: { get: () => ({ info() {}, error() {} }) } },
}));

import PushEMailSmtp from "./smtp";

const smtp = {
  enabled: true,
  from: "me@example.com",
  host: "smtp.example.com",
  port: 587,
  user: "u",
  pass: "p",
  tls: false,
} as any;

const email = {
  to: ["a@b.com"],
  message: { html: "<p>hi</p>", text: "hi", subject: "s" },
  from: "me@example.com",
};

const emailMulti = {
  ...email,
  to: ["a@b.com", "bad@nope.com"],
};

const build = async () => {
  const adapter = new PushEMailSmtp();
  await adapter.init();
  return adapter;
};

describe("PushEMailSmtp.push", () => {
  beforeEach(() => sendMail.mockReset());

  test("reports success when the recipient is accepted", async () => {
    sendMail.mockResolvedValue({
      accepted: ["a@b.com"],
      rejected: [],
      response: "250 OK",
    } as never);
    const onResult = jest.fn();

    const adapter = await build();
    await adapter.push(email, smtp, onResult);

    expect(onResult).toHaveBeenCalledWith({ success: true });
  });

  test("reports a definitive (non-retryable) failure when some recipients are accepted and some rejected", async () => {
    sendMail.mockResolvedValue({
      accepted: ["a@b.com"],
      rejected: ["bad@nope.com"],
      response: "250 OK",
    } as never);
    const onResult = jest.fn();

    const adapter = await build();
    await expect(
      adapter.push(emailMulti, smtp, onResult)
    ).resolves.toBeUndefined();

    expect(onResult).toHaveBeenCalledTimes(1);
    const result = onResult.mock.calls[0][0] as any;
    expect(result.success).toBe(false);
    // Transport works, so no fallback: the failure is not retryable.
    expect(result.retryable).toBeFalsy();
    expect(result.error).toContain("bad@nope.com");
  });

  test("reports a retryable failure (→ fallback) when no recipient is accepted", async () => {
    sendMail.mockResolvedValue({
      accepted: [],
      rejected: ["a@b.com"],
      response: "550 No such user",
    } as never);
    const onResult = jest.fn();

    const adapter = await build();
    // Can't tell a bad mailbox from a misconfigured SMTP → retryable.
    await expect(adapter.push(email, smtp, onResult)).resolves.toBeUndefined();
    const result = onResult.mock.calls[0][0] as any;
    expect(result.success).toBe(false);
    expect(result.retryable).toBe(true);
  });

  test("reports a retryable failure on an envelope/recipient error", async () => {
    sendMail.mockRejectedValue({
      code: "EENVELOPE",
      responseCode: 550,
      rejected: ["a@b.com"],
      message: "Mailbox unavailable",
    } as never);
    const onResult = jest.fn();

    const adapter = await build();
    await expect(adapter.push(email, smtp, onResult)).resolves.toBeUndefined();
    const result = onResult.mock.calls[0][0] as any;
    expect(result.success).toBe(false);
    expect(result.retryable).toBe(true);
  });

  test("reports a retryable failure on a connection/transport error", async () => {
    sendMail.mockRejectedValue({
      code: "ECONNECTION",
      message: "connect ECONNREFUSED",
    } as never);
    const onResult = jest.fn();

    const adapter = await build();
    await expect(adapter.push(email, smtp, onResult)).resolves.toBeUndefined();
    const result = onResult.mock.calls[0][0] as any;
    expect(result.success).toBe(false);
    expect(result.retryable).toBe(true);
  });
});
