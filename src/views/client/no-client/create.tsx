import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { InputImage } from "@atoms/input/input-image";
import { Input } from "@atoms/input/input-text";
import Link from "@atoms/link";
import { Loader } from "@atoms/loader";
import { Base, Info, SectionSmall, Title } from "@atoms/text";
import { AddressInput } from "@components/input-button/address/form";
import { Table } from "@molecules/table";
import { DidCreateCompanyOrSignupAtom } from "@features/clients/state/store";
import { useClients } from "@features/clients/state/use-clients";
import { Clients } from "@features/clients/types/clients";
import { ROUTES, getRoute } from "@features/routes";
import { validateEmail } from "@features/utils/format/strings";
import { useControlledEffect } from "@features/utils/hooks/use-controlled-effect";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import _ from "lodash";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";

export const NewClientForm = (props: { onClose?: () => void }) => {
  const { create, inviteUsers } = useClients();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const setAfterSignUpOrNewCompany = useSetRecoilState(
    DidCreateCompanyOrSignupAtom
  );

  const [companyName, setCompanyName] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [companyLegalName, setCompanyLegalName] = useState("");
  const [companyRegistrationNumber, setCompanyRegistrationNumber] =
    useState("");
  const [companyTaxNumber, setCompanyTaxNumber] = useState("");
  const [address, setAddress] = useState<Partial<Clients["address"]>>({});
  const [newInvitationEmail, setNewInvitationEmail] = useState<string>("");
  const [invitations, setInvitations] = useState<string[]>([]);

  useControlledEffect(() => {
    if (!companyLegalName && step === 1) {
      setCompanyLegalName(companyName);
    }
  }, [companyName, step, setCompanyLegalName]);

  const createCompany = async () => {
    try {
      const client = await create({
        company: {
          name: companyName,
          legal_name: companyLegalName,
          registration_number: companyRegistrationNumber,
          tax_number: companyTaxNumber,
        },
        preferences: {
          logo: imageBase64 || undefined,
        },
        address: {
          address_line_1: address.address_line_1 || "",
          address_line_2: address.address_line_2 || "",
          zip: address.zip || "",
          city: address.city || "",
          country: address.country || "",
          region: address.region || "",
        },
      });
      if (!client.client_id) throw new Error("No client id");
      await inviteUsers(client.client_id, invitations);
      setAfterSignUpOrNewCompany(true);
      navigate(
        getRoute(ROUTES.Home, {
          client: client.client_id,
        })
      );
    } catch (e) {
      setStep(0);
      console.info(e);
      toast.error("Error creating company");
    }
  };

  return (
    <>
      <Title>
        {step === 0
          ? "Créez votre entreprise"
          : `${companyName} est presque prêt`}
      </Title>
      {step < 3 && props.onClose && (
        <Info className="block">
          <Link
            onClick={() => {
              if (step === 0) {
                props.onClose?.();
              } else {
                setStep(step - 1);
              }
            }}
          >
            Retour
          </Link>
        </Info>
      )}
      <div className="mt-4">
        {step === 0 && (
          <>
            <SectionSmall className="block mb-2 mt-4">Identité</SectionSmall>

            <InputLabel
              input={
                <Input
                  placeholder="Books"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              }
              label="Nom de l'entreprise"
            />

            <InputLabel
              label={"Logo"}
              className="mt-4"
              input={
                <InputImage
                  fallback={companyName}
                  onChange={(b64) => setImageBase64(b64)}
                />
              }
            />
          </>
        )}
        {step === 1 && (
          <>
            <SectionSmall className="block mt-4 mb-1">
              Informations légales
            </SectionSmall>

            <Info className="block mb-4">
              Ces informations seront utilisées pour générer vos factures et
              devis.
            </Info>

            <InputLabel
              label="Nom légal"
              input={
                <Input
                  placeholder="BOOKS INC."
                  value={companyLegalName}
                  onChange={(e) => setCompanyLegalName(e.target.value)}
                />
              }
            />

            <InputLabel
              label="SIRET"
              className="mt-4"
              input={
                <Input
                  placeholder="0X000145"
                  value={companyRegistrationNumber}
                  onChange={(e) => setCompanyRegistrationNumber(e.target.value)}
                />
              }
            />

            <InputLabel
              label="Numéro de TVA (optionnel)"
              className="mt-4"
              input={
                <Input
                  placeholder="0X000145"
                  value={companyTaxNumber}
                  onChange={(e) => setCompanyTaxNumber(e.target.value)}
                />
              }
            />

            <div className="mt-4" />
            <AddressInput onChange={(a) => setAddress(a)} value={address} />
          </>
        )}

        {step === 2 && (
          <>
            <SectionSmall className="block mt-4 mb-1">
              Collaborateurs
            </SectionSmall>

            <Info className="block mb-4">
              Invitez vos collaborateurs à rejoindre votre entreprise.
            </Info>

            <div className="flex flex-row">
              <Input
                size="md"
                className="rounded-r-none"
                placeholder="john@books.com ou copiez/collez une liste d'emails"
                type="email"
                value={newInvitationEmail}
                onChange={(e) => {
                  if ((e.nativeEvent as any).inputType === "insertFromPaste") {
                    // Find all emails in the string
                    const emails = e.target.value
                      .toLocaleLowerCase()
                      .match(
                        /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g
                      );
                    // Remove duplicates using lodash
                    setInvitations(
                      emails
                        ? _.uniq([
                            ...emails.map((e) => e.trim()),
                            ...invitations,
                          ])
                        : invitations
                    );
                    if (emails?.length) return;
                  }
                  setNewInvitationEmail(e.target.value);
                }}
              />
              <Button
                size="md"
                className="rounded-l-none"
                shortcut={["enter"]}
                disabled={!validateEmail(newInvitationEmail)}
                icon={(p) => <EnvelopeIcon {...p} />}
                onClick={(e) => {
                  e.preventDefault();
                  setNewInvitationEmail("");
                  if (!newInvitationEmail.trim().toLocaleLowerCase()) return;
                  setInvitations([
                    newInvitationEmail.trim().toLocaleLowerCase(),
                    ...invitations,
                  ]);
                }}
              >
                Invite
              </Button>
            </div>

            {invitations.length > 0 && (
              <Table
                className="mt-4"
                showPagination={false}
                data={invitations}
                loading={false}
                columns={[
                  {
                    render: (i) => (
                      <div className="flex flex-row items-center">
                        <div className="grow">
                          <Base className="block">{i}</Base>
                        </div>
                      </div>
                    ),
                  },
                  {
                    cellClassName: "justify-end",
                    render: (i) => (
                      <>
                        <Button
                          theme="danger"
                          size="md"
                          onClick={() => {
                            setInvitations(invitations.filter((e) => e !== i));
                          }}
                        >
                          Remove
                        </Button>
                      </>
                    ),
                  },
                ]}
              />
            )}
          </>
        )}
        {step === 3 && (
          <div className="w-full h-32 flex items-center justify-center">
            <Loader color="text-slate-500" />
          </div>
        )}

        {step < 3 && (
          <Button
            disabled={
              (!companyName && step === 0) ||
              (!(
                address.address_line_1 &&
                address.zip &&
                address.city &&
                address.country &&
                address.region &&
                companyLegalName &&
                companyRegistrationNumber
              ) &&
                step === 1)
            }
            loading={step > 2}
            className="mt-8"
            onClick={() => {
              if (step === 2) {
                createCompany();
              }
              setStep(step + 1);
            }}
          >
            {step === 0 || (step === 2 && invitations.length > 0) || step === 1
              ? "Continue"
              : "Skip"}
          </Button>
        )}
      </div>
    </>
  );
};
