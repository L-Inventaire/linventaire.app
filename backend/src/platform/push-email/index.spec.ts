import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { EmailSendResult } from "./api";

jest.mock("./build-email", () => ({
  __esModule: true,
  buildHTML: async () => ({ html: "<b>x</b>", text: "x" }),
}));

jest.mock("@sentry/node", () => ({
  __esModule: true,
  captureException: () => {},
}));

const cfg: Record<string, string> = {
  "server.domain": "app.example.com", // no "demo" → no whitelisting
  "email.from_name": "L'inventaire",
  "email.from": "no-reply@example.com",
};
jest.mock("config", () => ({
  __esModule: true,
  default: { get: (k: string) => cfg[k], has: () => false },
}));

// Framework/platform (both are the default export of "..") — only I18n + logger.
jest.mock("..", () => ({
  __esModule: true,
  default: {
    I18n: { getLanguage: () => "fr", t: () => "" },
    LoggerDb: { get: () => ({ info() {}, error() {} }) },
  },
}));

import PushEMail from "./index";

const ctx = {} as any;
const smtpOpts = { enabled: true } as any;

// Build a PushEMail with injected fake adapters (skip init()).
const buildWith = (
  smtpBehaviour: EmailSendResult | undefined,
  defaultBehaviour: EmailSendResult = { success: true }
) => {
  const smtpPush = jest.fn(
    async (_body: any, _smtp: any, onResult?: (r: EmailSendResult) => void) => {
      if (smtpBehaviour) onResult?.(smtpBehaviour);
    }
  );
  const defaultPush = jest.fn(
    async (_body: any, _smtp: any, onResult?: (r: EmailSendResult) => void) => {
      onResult?.(defaultBehaviour);
    }
  );

  const pe = new PushEMail();
  (pe as any).logger = { info() {}, error() {} };
  (pe as any).smtpService = { push: smtpPush };
  (pe as any).service = { push: defaultPush };

  return { pe, smtpPush, defaultPush };
};

describe("PushEMail.push fallback policy", () => {
  beforeEach(() => jest.clearAllMocks());

  test("custom SMTP succeeds → no fallback, success forwarded", async () => {
    const { pe, defaultPush } = buildWith({ success: true });
    const onResult = jest.fn();

    const ret = await pe.push(ctx, "a@b.com", "m", {}, smtpOpts, onResult);

    expect(ret).toBe(true);
    expect(defaultPush).not.toHaveBeenCalled();
    expect(onResult).toHaveBeenCalledWith({ success: true });
  });

  test("SMTP rejects a recipient (not retryable) → no fallback, failure forwarded", async () => {
    const { pe, defaultPush } = buildWith({
      success: false,
      error: "rejected: bad@x.com",
    });
    const onResult = jest.fn();

    const ret = await pe.push(ctx, "a@b.com", "m", {}, smtpOpts, onResult);

    expect(ret).toBe(false);
    expect(defaultPush).not.toHaveBeenCalled();
    expect(onResult).toHaveBeenCalledWith({
      success: false,
      error: "rejected: bad@x.com",
    });
  });

  test("SMTP unusable (retryable) → falls back to default adapter", async () => {
    const { pe, smtpPush, defaultPush } = buildWith(
      { success: false, retryable: true, error: "ECONNECTION" },
      { success: true }
    );
    const onResult = jest.fn();

    const ret = await pe.push(ctx, "a@b.com", "m", {}, smtpOpts, onResult);

    expect(smtpPush).toHaveBeenCalledTimes(1);
    expect(defaultPush).toHaveBeenCalledTimes(1);
    expect(ret).toBe(true);
    // The forwarded result comes from the fallback adapter, not the SMTP one.
    expect(onResult).toHaveBeenLastCalledWith({ success: true });
  });

  test("no custom SMTP → default adapter is used directly", async () => {
    const { pe, smtpPush, defaultPush } = buildWith(undefined, {
      success: true,
    });
    const onResult = jest.fn();

    const ret = await pe.push(ctx, "a@b.com", "m", {}, undefined, onResult);

    expect(smtpPush).not.toHaveBeenCalled();
    expect(defaultPush).toHaveBeenCalledTimes(1);
    expect(ret).toBe(true);
    expect(onResult).toHaveBeenCalledWith({ success: true });
  });
});
