import { Button } from "@atoms/button/button";
import { PageLoader } from "@components/page-loader";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { getContactName } from "@features/contacts/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { useNavigate, useParams } from "react-router-dom";
import { ContactsDetailsPage } from "../components/contact-details";
import {
  EllipsisHorizontalIcon,
  DocumentDuplicateIcon,
  LinkIcon,
  PrinterIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import {
  ArrowLeftIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/20/solid";

export const ContactsViewPage = ({ readonly }: { readonly?: boolean }) => {
  const { id } = useParams();
  const { contact } = useContact(id || "");
  const navigate = useNavigate();

  if (!contact) return <PageLoader />;

  return (
    <Page
      title={[
        { label: "Contacts", to: getRoute(ROUTES.Contacts) },
        { label: getContactName(contact || {}) },
      ]}
      bar={
        <div className="items-center flex grow space-x-2 px-3">
          <div className="flex items-center space-x-1">
            <Button
              size="xs"
              theme="outlined"
              shortcut={["esc"]}
              icon={(p) => <ArrowLeftIcon {...p} />}
            />
            <Button
              size="xs"
              theme="outlined"
              shortcut={["k"]}
              icon={(p) => <ChevronUpIcon {...p} />}
            />
            <Button
              size="xs"
              theme="outlined"
              shortcut={["j"]}
              icon={(p) => <ChevronDownIcon {...p} />}
            />
          </div>
          <div className="grow" />
          <Button
            size="xs"
            theme="invisible"
            icon={(p) => <DocumentDuplicateIcon {...p} />}
          />
          <Button
            size="xs"
            theme="invisible"
            icon={(p) => <LinkIcon {...p} />}
          />
          <Button
            size="xs"
            theme="invisible"
            icon={(p) => <PrinterIcon {...p} />}
          />
          <Button
            size="xs"
            theme="invisible"
            icon={(p) => <ClockIcon {...p} />}
          />
          <Button
            size="xs"
            theme="invisible"
            icon={(p) => <EllipsisHorizontalIcon {...p} />}
          />
          <Button
            size="xs"
            onClick={async () =>
              navigate(getRoute(ROUTES.ContactsEdit, { id }))
            }
          >
            Modifier
          </Button>
        </div>
      }
    >
      <ContactsDetailsPage readonly={true} id={id || ""} />
    </Page>
  );
};
