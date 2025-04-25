import { id } from "#src/platform/db/utils";
import { create } from "#src/services/rest/services/rest";
import platform from "../../../../platform";
import Invoices from "../../invoices/entities/invoices";
import {
  SigningSessions,
  SigningSessionsDefinition,
} from "../entities/signing-session";
import { onSigningSessionCancelled } from "../triggers/on-cancelled";
import { onSigningSessionSigned } from "../triggers/on-signed";

export type CreateSigningSessionProps = {
  recipient: { email: string; role: string };
  invoice: Invoices;
};

export const createSigningSession = async (
  ctx,
  { recipient, invoice }: CreateSigningSessionProps
): Promise<SigningSessions> => {
  const signingSession = {
    id: id(),
    invoice_id: invoice.id,
    external_id: null,
    invoice_snapshot: invoice,
    recipient_email: recipient.email,
    recipient_role: recipient.role,
    state: "created",
    document_url: null,
    signing_url: null,
  };

  const createdSigningSession = await create<SigningSessions>(
    ctx,
    SigningSessionsDefinition.name,
    signingSession
  );

  return createdSigningSession as unknown as SigningSessions;
};

export const updateSigningSession = async (ctx, session: SigningSessions) => {
  const driver = await platform.Db.getService();

  const previousSession = await driver.selectOne<SigningSessions>(
    { ...ctx, role: "SYSTEM" },
    SigningSessionsDefinition.name,
    { id: session.id },
    {}
  );

  await driver.update<SigningSessions>(
    { ...ctx, role: "SYSTEM" },
    SigningSessionsDefinition.name,
    { id: session.id },
    session,
    { triggers: true }
  );

  const updatedSession = await driver.selectOne<SigningSessions>(
    { ...ctx, role: "SYSTEM" },
    SigningSessionsDefinition.name,
    { id: session.id },
    {}
  );

  if (
    updatedSession.state === "cancelled" &&
    previousSession.state !== "cancelled"
  ) {
    await onSigningSessionCancelled(ctx, updatedSession);
  }

  if (updatedSession.state === "signed" && previousSession.state !== "signed") {
    await onSigningSessionSigned(ctx, updatedSession);
  }

  return updatedSession;
};
