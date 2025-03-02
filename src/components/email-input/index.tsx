import { InputWithSuggestions } from "@atoms/input/input-with-suggestion";
import { useClientUsers } from "@features/clients/state/use-client-users";
import { useCurrentClient } from "@features/clients/state/use-clients";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { normalizeString } from "@features/utils/format/strings";
import _ from "lodash";
import { useCallback, useState } from "react";

export const MailInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { client } = useCurrentClient();
  const { users } = useClientUsers(client?.id || "");
  const { contacts: contacts1 } = useContacts({
    query: [{ key: "emails", values: [{ op: "regex", value: query }] }],
  });
  const { contacts: contacts2 } = useContacts({
    query: [{ key: "email", values: [{ op: "regex", value: query }] }],
  });
  const allEmails = _.uniq([
    ...(contacts1?.data?.list || []).reduce(
      (acc, a) => [...acc, ...(a.emails || [])],
      [] as string[]
    ),
    ...(contacts2?.data?.list || []).map((a) => a.email),
  ]).filter(
    (a) =>
      a &&
      query
        .split(" ")
        .every((q) => a.includes(normalizeString(q).toLocaleLowerCase()))
  );

  const setQueryDebounce = useCallback((value: string) => {
    setLoading(true);
    _.debounce((value) => {
      setQuery(value);
      setLoading(false);
    }, 500)(value);
  }, []);

  return (
    <>
      <InputWithSuggestions
        className="w-full"
        autoFocus
        style={{ minWidth: 128 }}
        options={
          query
            ? [
                ...allEmails.map((a) => ({ label: a, value: a })),
                ...users.map((a) => ({
                  label: a.user.email,
                  value: a.user.email,
                })),
              ]
            : []
        }
        loading={loading || contacts1.isFetching || contacts2.isFetching}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setQueryDebounce(e.target.value);
        }}
        size="md"
        placeholder="email@gmail.com, email@linventaire.app"
      />
    </>
  );
};
