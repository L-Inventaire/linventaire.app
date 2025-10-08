import { Info } from "@atoms/text";
import { Page } from "../../_layout/page";
import { useNotificationsPreferences } from "@features/notifications/hooks/use-notifications-preferences";
import { Heading } from "@radix-ui/themes";
import SelectMultiple from "@atoms/input/input-select-multiple";

export const AccountNotificationsPage = () => {
  const { update, ...preferences } = useNotificationsPreferences();

  if (!preferences) return <></>;

  return (
    <Page title={[{ label: "Compte" }, { label: "Notifications" }]}>
      <div className="w-full max-w-4xl mx-auto mt-6">
        <Heading size="6">Notifications</Heading>
        <Info>Ces modifications concernent l'entreprise courante.</Info>
        <div className="space-y-2 mt-4">
          <Heading size={"2"}>Toujours me notifier pour ces évènements</Heading>
          <SelectMultiple
            options={[
              {
                label: "Devis signé",
                value: "quote_signed",
              },
              {
                label: "Devis refusé",
                value: "quote_refused",
              },
              {
                label: "Commentaire ajouté",
                value: "commented",
              },
            ]}
            value={preferences?.data?.always_notified || []}
            onChange={(e) => update({ always_notified: e })}
          />
        </div>
      </div>
    </Page>
  );
};
