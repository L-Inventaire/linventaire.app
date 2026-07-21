import { InformationCircleIcon } from "@heroicons/react/16/solid";
import { EventLine } from ".";
import { useComment } from "@features/comments/hooks/use-comments";
import { Trans, useTranslation } from "react-i18next";
import { ReactNode } from "react";
import Link from "@atoms/link";
import Env from "@config/environment";
import { useRest } from "@features/utils/rest/hooks/use-rest";
import { Invoices } from "@features/invoices/types/types";
import {
  RecipientStatusDot,
  recipientDeliveryStatus,
} from "@features/invoices/components/email-status-icon";

/**
 * Renders the recipient email list of a "sent" timeline event, each followed by
 * a small coloured dot echoing that recipient's delivery status (blue sent /
 * green received / red failed). The status is read from the parent invoice's
 * state_details. We fetch with `limit: 1` so the query key matches the detail
 * page's own load and this reads straight from the React Query cache (no extra
 * request, no invalidation of the open document).
 */
const RecipientsWithStatus = ({
  invoiceId,
  recipients,
}: {
  invoiceId: string;
  recipients: { email: string }[];
}) => {
  const { items } = useRest<Invoices>("invoices", { id: invoiceId, limit: 1 });
  const invoice = items.data?.list?.[0];
  return (
    <>
      {recipients.map(({ email }, index) => (
        <span key={email}>
          {index > 0 ? ", " : ""}
          <RecipientStatusDot
            status={recipientDeliveryStatus(email, invoice?.state_details)}
          />
          <Link href={"mailto:" + email}>{email}</Link>
        </span>
      ))}
    </>
  );
};

export const Event = ({ id }: { id: string }) => {
  const { comment } = useComment(id);
  const { t } = useTranslation();

  if (!comment) return <></>;

  let message: string | ReactNode | null = null;
  const metadata = comment.metadata;

  if (metadata?.event_type === "invoice_sent") {
    message = (
      <Trans
        t={t}
        i18nKey="timelines.events.invoice_sent.content"
        components={[
          <RecipientsWithStatus
            invoiceId={comment.item_id}
            recipients={metadata.recipients}
          />,
        ]}
      />
    );
  }

  if (metadata?.event_type === "quote_sent") {
    const signers = metadata.recipients.filter((a) => a.role === "signer");
    const viewers = metadata.recipients.filter((a) => a.role === "viewer");
    message = (
      <Trans
        t={t}
        i18nKey="timelines.events.quote_sent.content"
        components={[
          <RecipientsWithStatus
            invoiceId={comment.item_id}
            recipients={signers}
          />,
          <span className={viewers?.length ? "" : "hidden"}>
            {t("timelines.events.quote_sent.content_viewers")}{" "}
            <RecipientsWithStatus
              invoiceId={comment.item_id}
              recipients={viewers}
            />
          </span>,
        ]}
      />
    );
  }

  if (metadata?.event_type === "smtp_failed") {
    const failed = metadata.emails || [];
    message = (
      <Trans
        t={t}
        i18nKey={
          metadata.partial
            ? "timelines.events.smtp_failed.content_partial"
            : "timelines.events.smtp_failed.content"
        }
        components={[
          <>
            {failed.map((email, index) => (
              <span key={email}>
                {index > 0 ? ", " : ""}
                <Link href={"mailto:" + email}>{email}</Link>
              </span>
            ))}
          </>,
        ]}
      />
    );
  }

  if (metadata?.event_type === "quote_signed") {
    message = (
      <Trans
        t={t}
        values={metadata}
        i18nKey="timelines.events.quote_signed.content"
        components={[
          <b></b>,
          <Link href={"mailto:" + metadata.email}>{metadata.email}</Link>,
          <Link
            color="blue"
            target="_blank"
            href={`${Env.server.replace(/\/$/, "")}/api/signing-sessions/v1/${
              metadata.session_id
            }/download`}
          ></Link>,
        ]}
      />
    );
  }

  return (
    <EventLine
      comment={{
        id: comment.id,
        created_by: comment.updated_by || comment.created_by,
        created_at: comment.created_at,
      }}
      name={false}
      icon={(p) => <InformationCircleIcon className={p.className} />}
      message={
        message ||
        t(
          [
            "timelines.events." + comment.metadata?.event_type + "content",
            "timelines.events." + comment.metadata?.event_type,
            comment.content,
          ],
          { replace: metadata },
        )
      }
    />
  );
};
