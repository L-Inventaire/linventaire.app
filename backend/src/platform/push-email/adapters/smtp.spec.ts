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

  test("reports failure (without throwing) when sendMail resolves with a rejected recipient", async () => {
    sendMail.mockResolvedValue({
      accepted: [],
      rejected: ["a@b.com"],
      response: "550 No such user",
    } as never);
    const onResult = jest.fn();

    const adapter = await build();
    await expect(adapter.push(email, smtp, onResult)).resolves.toBeUndefined();

    expect(onResult).toHaveBeenCalledTimes(1);
    const result = onResult.mock.calls[0][0] as any;
    expect(result.success).toBe(false);
    expect(result.error).toContain("a@b.com");
  });

  test("reports failure (without rethrowing) when the send throws an envelope rejection", async () => {
    sendMail.mockRejectedValue({
      code: "EENVELOPE",
      responseCode: 550,
      rejected: ["a@b.com"],
      message: "Mailbox unavailable",
    } as never);
    const onResult = jest.fn();

    const adapter = await build();
    // Must NOT rethrow: a bad mailbox won't be fixed by the fallback provider.
    await expect(adapter.push(email, smtp, onResult)).resolves.toBeUndefined();

    const result = onResult.mock.calls[0][0] as any;
    expect(result.success).toBe(false);
  });

  test("rethrows a connection/transport error so the caller can fall back", async () => {
    sendMail.mockRejectedValue({
      code: "ECONNECTION",
      message: "connect ECONNREFUSED",
    } as never);
    const onResult = jest.fn();

    const adapter = await build();
    await expect(adapter.push(email, smtp, onResult)).rejects.toMatchObject({
      code: "ECONNECTION",
    });

    // No definitive failure reported: the fallback adapter will report instead.
    expect(onResult).not.toHaveBeenCalled();
  });
});
