import crypto from "crypto";
import _ from "lodash";
import { SigningSessions } from "../entities/signing-session";

/**
 * How long the email link token of an expired signing session still unlocks the
 * latest session of the same recipient (from the sending of the expired one).
 */
export const ACCESS_TOKEN_CARRY_OVER_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

/**
 * Constant-time comparison of the access token carried in the email link
 * against the one stored on the signing session.
 */
export const isValidAccessToken = (
  stored?: string,
  provided?: string
): boolean => {
  if (!stored || !provided || typeof provided !== "string") return false;
  const storedBuffer = Buffer.from(stored);
  const providedBuffer = Buffer.from(provided);
  if (storedBuffer.length !== providedBuffer.length) return false;
  return crypto.timingSafeEqual(storedBuffer, providedBuffer);
};

export type LatestSigningSession = {
  id: string | null;
  state?: string;
  token?: string;
};

/**
 * From an expired signing session, finds the up-to-date one among the sessions
 * of the same document: the signed one if any, else the latest one sent to the
 * same recipient. When the email link token of the expired session is provided,
 * the token of the latest session is returned too, so the recipient can sign
 * without the email code (same mailbox, so same proof).
 */
export const findLatestSigningSession = (
  signingSession: SigningSessions,
  documentSessions: SigningSessions[],
  providedToken?: string,
  now = Date.now()
): LatestSigningSession => {
  if (!signingSession.expired || signingSession.links_revoked) {
    return { id: null };
  }

  const sessions = documentSessions.filter(
    (sess) =>
      !sess.expired &&
      !sess.is_deleted &&
      sess.client_id === signingSession.client_id &&
      sess.invoice_id === signingSession.invoice_id
  );

  const signed = sessions.find((sess) => sess.state === "signed");
  if (signed) {
    return { id: signed.id, state: signed.state };
  }

  // Only the recipient's own session: another recipient's one may have
  // another role (signer instead of viewer). The signer one first, as the
  // reminders add newer viewer sessions.
  const latest = _.first(
    _.orderBy(
      sessions.filter(
        (sess) =>
          sess.recipient_email?.toLocaleLowerCase() ===
          signingSession.recipient_email?.toLocaleLowerCase()
      ),
      [
        (sess) => sess.recipient_role === "signer",
        (sess) => Number(sess.created_at),
      ],
      ["desc", "desc"]
    )
  );
  if (!latest) {
    return { id: null };
  }

  const canCarryOverToken =
    isValidAccessToken(signingSession.access_token, providedToken) &&
    now - Number(signingSession.created_at) <=
      ACCESS_TOKEN_CARRY_OVER_MAX_AGE &&
    ["created", "viewed", "sent"].includes(latest.state);

  return {
    id: latest.id,
    state: latest.state,
    token: canCarryOverToken ? latest.access_token || undefined : undefined,
  };
};
