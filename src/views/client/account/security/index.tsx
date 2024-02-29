import { Section } from "@atoms/text";
import { Page } from "../../_layout/page";

export const SecurityPage = () => {
  return (
    <Page title={[{ label: "Compte" }, { label: "Sécurité" }]}>
      <Section>Securité du compte</Section>
    </Page>
  );
};
