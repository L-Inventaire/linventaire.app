import { InformationCircleIcon } from "@heroicons/react/16/solid";
import { EventLine } from ".";
import { useComment } from "@features/comments/hooks/use-comments";
import { Trans, useTranslation } from "react-i18next";
import { ReactNode } from "react";
import Link from "@atoms/link";
import Env from "@config/environment";

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
          <>
            {metadata.recipients.map(({ email }) => (
              <Link href={"mailto:" + email}>{email}</Link>
            ))}
          </>,
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
          <>
            {signers.map(({ email }) => (
              <Link href={"mailto:" + email}>{email}</Link>
            ))}
          </>,
          <span className={viewers?.length ? "" : "hidden"}>
            {t("timelines.events.quote_sent.content_viewers")}{" "}
            {viewers.map(({ email }) => (
              <Link href={"mailto:" + email}>{email}</Link>
            ))}
          </span>,
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
          { replace: metadata }
        )
      }
    />
  );
};
