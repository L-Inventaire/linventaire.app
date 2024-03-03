import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { InputImage } from "@atoms/input/input-image";
import { Input } from "@atoms/input/input-text";
import { Section } from "@atoms/text";
import { useAuth } from "@features/auth/state/use-auth";
import { CustomersApiClient } from "@features/customers/api-client/api-client";
import { useState } from "react";
import { Page, PageBlock } from "../_layout/page";
import toast from "react-hot-toast";
import Select from "@atoms/select";
import { getServerUri } from "@features/utils/format/strings";

export const AccountPage = () => {
  const { user, getUser } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);

  const [fullName, setFullName] = useState<string>(user?.full_name || "");
  const [imageBase64, setImageBase64] = useState<string | undefined>(
    user?.preferences?.avatar
  );

  return (
    <Page title={[{ label: "Compte" }, { label: "Préférences et profil" }]}>
      <PageBlock>
        <Section>Profil</Section>
        <div className="max-w-lg">
          <InputLabel
            label="Nom complet"
            input={
              <Input
                disabled={loading}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jeff"
              />
            }
          />
          <InputLabel
            className="mt-4"
            label="Image de profil"
            input={
              <InputImage
                shape="circle"
                fallback={fullName}
                value={getServerUri(imageBase64) || ""}
                onChange={(e) => setImageBase64(e)}
              />
            }
          />
          {(fullName !== user?.full_name ||
            getServerUri(imageBase64) !==
              getServerUri(user?.preferences?.avatar)) && (
            <Button
              loading={loading}
              className="mt-4"
              onClick={async () => {
                setLoading(true);
                try {
                  await CustomersApiClient.setPreferences({
                    avatar:
                      getServerUri(imageBase64) !==
                      getServerUri(user?.preferences?.avatar)
                        ? imageBase64
                        : undefined,
                    full_name: fullName,
                  });
                  await getUser();
                  toast.success("Profil mis à jour");
                } catch (e) {
                  console.error(e);
                }
                setLoading(false);
              }}
            >
              Sauvegarder
            </Button>
          )}
        </div>
      </PageBlock>

      <PageBlock>
        <Section>Préférences</Section>
        <div className="max-w-lg">
          <InputLabel
            label="Langue"
            input={
              <Select
                disabled={loading}
                value={user?.preferences?.language}
                onChange={async () => {
                  setLoading(true);
                  try {
                    await CustomersApiClient.setPreferences({
                      language:
                        user?.preferences?.language === "fr" ? "en" : "fr",
                    });
                    await getUser();
                    toast.success("Langue mise à jour");
                  } catch (e) {
                    console.error(e);
                  }
                  setLoading(false);
                }}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </Select>
            }
          />
        </div>
      </PageBlock>
    </Page>
  );
};
