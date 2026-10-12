import { describe, expect, test } from "@jest/globals";
import {
  ACCESS_TOKEN_CARRY_OVER_MAX_AGE,
  findLatestSigningSession,
} from "./latest";

const NOW = 1_800_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

const session = (extra: any = {}) =>
  ({
    id: "ss-new",
    client_id: "cl-1",
    invoice_id: "inv-1",
    recipient_email: "jeff@example.com",
    recipient_role: "signer",
    state: "created",
    expired: false,
    is_deleted: false,
    access_token: "new-token",
    created_at: NOW - DAY,
    ...extra,
  } as any);

const oldSession = (extra: any = {}) =>
  session({
    id: "ss-old",
    expired: true,
    access_token: "old-token",
    created_at: NOW - 2 * DAY,
    ...extra,
  });

describe("findLatestSigningSession", () => {
  test("nothing for a session which is not expired", () => {
    expect(
      findLatestSigningSession(oldSession({ expired: false }), [session()])
    ).toEqual({ id: null });
  });

  test("nothing when the previous links were revoked", () => {
    expect(
      findLatestSigningSession(
        oldSession({ links_revoked: true }),
        [session()],
        "old-token",
        NOW
      )
    ).toEqual({ id: null });
  });

  test("latest session of the same recipient, without token", () => {
    expect(
      findLatestSigningSession(oldSession(), [
        oldSession(),
        session({ id: "ss-1", created_at: NOW - 3 * DAY }),
        session({ id: "ss-2", recipient_email: "JEFF@example.com" }),
      ])
    ).toEqual({ id: "ss-2", state: "created", token: undefined });
  });

  test("the signer session before a newer viewer one (reminders)", () => {
    expect(
      findLatestSigningSession(oldSession(), [
        session({ id: "ss-signer", created_at: NOW - 3 * DAY }),
        session({ id: "ss-reminder", recipient_role: "viewer" }),
      ]).id
    ).toEqual("ss-signer");
  });

  test("carries the token over with the email link token", () => {
    expect(
      findLatestSigningSession(oldSession(), [session()], "old-token", NOW)
    ).toEqual({ id: "ss-new", state: "created", token: "new-token" });
  });

  test("no token with a wrong email link token", () => {
    expect(
      findLatestSigningSession(oldSession(), [session()], "new-token", NOW)
        .token
    ).toBeUndefined();
  });

  test("no token when the expired link is too old", () => {
    expect(
      findLatestSigningSession(
        oldSession({
          created_at: NOW - ACCESS_TOKEN_CARRY_OVER_MAX_AGE - 1,
        }),
        [session()],
        "old-token",
        NOW
      )
    ).toEqual({ id: "ss-new", state: "created", token: undefined });
  });

  test("no token when the latest session was refused", () => {
    expect(
      findLatestSigningSession(
        oldSession(),
        [session({ state: "cancelled" })],
        "old-token",
        NOW
      )
    ).toEqual({ id: "ss-new", state: "cancelled", token: undefined });
  });

  test("never the session of another recipient", () => {
    expect(
      findLatestSigningSession(
        oldSession(),
        [session({ recipient_email: "other@example.com" })],
        "old-token",
        NOW
      )
    ).toEqual({ id: null });
  });

  test("never a session of another document or company", () => {
    expect(
      findLatestSigningSession(
        oldSession(),
        [session({ invoice_id: "inv-2" }), session({ client_id: "cl-2" })],
        "old-token",
        NOW
      )
    ).toEqual({ id: null });
  });

  test("the signed session first, whoever signed, without token", () => {
    expect(
      findLatestSigningSession(
        oldSession(),
        [
          session(),
          session({
            id: "ss-signed",
            recipient_email: "other@example.com",
            state: "signed",
          }),
        ],
        "old-token",
        NOW
      )
    ).toEqual({ id: "ss-signed", state: "signed" });
  });
});
