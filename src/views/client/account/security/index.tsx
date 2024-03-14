import { Info, Section } from "@atoms/text";
import { useCustomerMfa } from "@features/customers/state/hooks";
import { useEffect } from "react";
import { Page, PageBlock } from "../../_layout/page";
import { SecurityApp } from "./components/app";
import { SecurityEmail } from "./components/email";
import { SecurityPassword } from "./components/password";

export const SecurityPage = () => {
  const { getMfas, mfas } = useCustomerMfa();

  useEffect(() => {
    getMfas();
  }, []);

  const getMfa = (type: string) => mfas.find((a) => a.type === type);

  return (
    <Page title={[{ label: "Compte" }, { label: "Sécurité" }]}>
      <PageBlock>
        <Section>Email</Section>
        <Info>
          Votre email est toujours utilisable pour récupérer l'accès à votre
          compte, sauf en cas d'activation d'un second facteur
          d'authentification.
        </Info>
        <div className="mt-4">
          <SecurityEmail mfa={getMfa("email")} />
        </div>
      </PageBlock>
      <PageBlock>
        <Section>Mot de passe</Section>
        <Info>
          Vous pouvez configurer un mot de passe afin de vous connecter plus
          rapidement. Vous pouvez toujours récupérer votre compte via l'envoi
          d'un code par email.
        </Info>
        <div className="mt-4">
          <SecurityPassword mfa={getMfa("password")} />
        </div>
      </PageBlock>
      <PageBlock>
        <Section>Authentification à deux facteurs (2FA)</Section>
        <Info>
          Pour sécuriser votre compte, vous pouvez activer l'authentification à
          deux facteurs.
        </Info>
        <div className="mt-4">
          <SecurityApp mfa={getMfa("app")} />
        </div>
      </PageBlock>
    </Page>
  );
};
