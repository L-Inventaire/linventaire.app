import { Info } from "@atoms/text";
import { RestDocumentProps, RestDocumentsInput } from "@components/input-rest";
import { Contacts, getContactName } from "@features/contacts/types/types";
import { BuildingOfficeIcon, UserIcon } from "@heroicons/react/16/solid";
import { IconButton, Skeleton } from "@radix-ui/themes";

export const ContactRestDocument = (
  props: Omit<RestDocumentProps<Contacts>, "entity">
) => {
  const size = props.size || "lg";
  return (
    <RestDocumentsInput
      key={JSON.stringify(props.value)}
      {...(props as RestDocumentProps<Contacts>)}
      entity="contacts"
      render={(contact) => <RenderContactCard contact={contact} size={size} />}
      renderEmpty={
        props.value?.length
          ? () => (
              <div className="whitespace-normal min-w-32 animate-pulse opacity-75 space-y-1 py-2">
                <div className="line-clamp-1 text-ellipsis items-center flex space-x-2">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="w-20 h-3 rounded-md" />
                </div>
                {size === "lg" && <Skeleton className="w-32 h-3 rounded-md" />}
                {(size === "md" || size === "lg") && (
                  <Skeleton className="w-20 h-3 rounded-md" />
                )}
              </div>
            )
          : undefined
      }
    />
  );
};

const RenderContactCard = ({
  contact,
  size,
}: {
  contact: Contacts;
  size: RestDocumentProps<any>["size"];
}) => {
  return (
    <div className="whitespace-normal min-w-32">
      <div className="line-clamp-1 text-ellipsis items-center flex space-x-1">
        <IconButton
          size="1"
          variant="ghost"
          data-tooltip={contact.type === "person" ? "Personne" : "Entreprise"}
        >
          {contact.type === "person" ? (
            <UserIcon className="w-4 h-4" />
          ) : (
            <BuildingOfficeIcon className="w-4 h-4" />
          )}
        </IconButton>
        <span className="line-clamp-1 text-ellipsis">
          {getContactName(contact)}
        </span>
      </div>
      {size === "lg" && (
        <div className="line-clamp-1 text-ellipsis items-center flex space-x-1">
          <Info className="line-clamp-1 text-ellipsis">
            {contact.address?.city || "-"}
          </Info>
        </div>
      )}
      {(size === "md" || size === "lg") && (
        <div className="line-clamp-1 text-ellipsis items-center flex space-x-1">
          <Info className="line-clamp-1 text-ellipsis">
            {contact.email || contact.phone || "-"}
          </Info>
        </div>
      )}
    </div>
  );
};
