import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { InputImage } from "@atoms/input/input-image";
import { Input } from "@atoms/input/input-text";
import Link from "@atoms/link";
import { Loader } from "@atoms/loader";
import { Base, Info, SectionSmall, Title } from "@atoms/text";
import { AddressInput } from "@components/address-input";
import { Table } from "@components/table";
import { DidCreateCompanyOrSignupAtom } from "@features/clients/state/store";
import { useClients } from "@features/clients/state/use-clients";
import { Clients } from "@features/clients/types/clients";
import { ROUTES } from "@features/routes";
import { validateEmail } from "@features/utils/format/strings";
import { useControlledEffect } from "@features/utils/hooks/use-controlled-effect";
import { MailIcon } from "@heroicons/react/outline";
import _ from "lodash";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";

export const NewClientForm = (props: { onClose: () => void }) => {
  const { create, inviteUser } = useClients();
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
      await Promise.all(
        invitations.map((i) => inviteUser(client.client_id, i))
      );
      setAfterSignUpOrNewCompany(true);
      navigate(ROUTES.Home);
    } catch (e) {
      setStep(0);
      console.log(e);
      toast.error("Error creating company");
    }
  };

  return (
    <>
      <Title>
        {step === 0
          ? "Create your new company"
          : `Almost ready to work with ${companyName}`}
      </Title>
      {step < 3 && (
        <Info className="block">
          <Link
            onClick={() => {
              if (step === 0) {
                props.onClose();
              } else {
                setStep(step - 1);
              }
            }}
          >
            Go back
          </Link>
        </Info>
      )}
      <div className="mt-4">
        {step === 0 && (
          <>
            <SectionSmall className="block mb-2 mt-4">Identity</SectionSmall>

            <InputLabel
              input={
                <Input
                  placeholder="Books"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              }
              label="Company name"
            />

            <InputLabel
              label={"Logo"}
              className="mt-4"
              input={
                <InputImage
                  shape="circle"
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
              Legal information
            </SectionSmall>

            <Info className="block mb-4">
              Enters your legal information now so we can setup your company for
              your invoices, taxes and more.
            </Info>

            <InputLabel
              label="Legal Name"
              input={
                <Input
                  placeholder="BOOKS INC."
                  value={companyLegalName}
                  onChange={(e) => setCompanyLegalName(e.target.value)}
                />
              }
            />

            <InputLabel
              label="Registration Number"
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
              label="Tax Number"
              className="mt-4"
              input={
                <Input
                  placeholder="0X000145"
                  value={companyTaxNumber}
                  onChange={(e) => setCompanyTaxNumber(e.target.value)}
                />
              }
            />

            <InputLabel
              label="Address"
              className="mt-4"
              input={<AddressInput onChange={(a) => setAddress(a)} />}
            />
          </>
        )}

        {step === 2 && (
          <>
            <SectionSmall className="block mt-4 mb-1">
              Collaborators
            </SectionSmall>

            <Info className="block mb-4">
              Invite your collaborators to join your company. They will be able
              to create invoices, manage stock and more.
            </Info>

            <div className="flex flex-row">
              <Input
                size="lg"
                className="rounded-r-none"
                placeholder="john@books.com or paste a list of emails"
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
                size="lg"
                className="rounded-l-none"
                shortcut={["enter"]}
                disabled={!validateEmail(newInvitationEmail)}
                icon={(p) => <MailIcon {...p} />}
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
                useResponsiveMode={false}
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
                          size="sm"
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
            <Loader color="text-wood-500" />
          </div>
        )}

        {step < 3 && (
          <Button
            disabled={!companyName && step === 0}
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
