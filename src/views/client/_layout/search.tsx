import { InputDecorationIcon } from "@atoms/input/input-decoration-icon";
import { Input } from "@atoms/input/input-text";
import { Section } from "@atoms/text";
import { debounce } from "@features/utils/debounce";
import { Transition } from "@headlessui/react";
import { SearchIcon } from "@heroicons/react/outline";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type SearchResult = {}; //TODO

export const Search = () => {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const requestId = useRef<number>(0);
  const [, setLoading] = useState(false);
  const [, setResult] = useState<{ data: SearchResult[]; total: number }>({
    data: [],
    total: 0,
  });

  useEffect(() => {
    if (query) {
      setLoading(true);
      requestId.current++;
      const id = requestId.current;
      debounce(
        async () => {
          //TODO
          setResult({
            data: [],
            total: 0,
          });
          if (id === requestId.current) {
            setLoading(false);
          }
        },
        { key: "search" }
      );
    }
  }, [query]);

  return (
    <div className="md:relative z-10 w-full">
      <InputDecorationIcon
        className="max-w-md w-full relative z-20"
        prefix={SearchIcon}
        input={({ className }) => (
          <Input
            size="md"
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            onChange={(e) => setQuery(e.target.value)}
            inputClassName={"!rounded-full text-black " + className}
            placeholder={t("header.search.placeholder")}
            shortcut={["shift+k", "ctrl+k"]}
          />
        )}
      />
      <Transition
        show={focused}
        style={{ height: 1000000, width: 1000000, left: -500000, top: -500000 }}
        className="fixed bg-black bg-opacity-50 w-full h-full z-10"
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 "
        enterTo="transform opacity-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100"
        leaveTo="transform opacity-0 "
      />
      <Transition
        show={focused}
        className="absolute top-12 md:top-full left-0 bottom-0 md:bottom-auto bg-white dark:bg-wood-990 p-4 text-left w-full md:w-auto overflow-auto shadow-xl md:rounded-lg sm:w-full z-20"
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 -translate-y-6"
        enterTo="transform opacity-100 translate-y-0"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 translate-y-0"
        leaveTo="transform opacity-0 -translate-y-6"
      >
        <Section>{t("header.search.title")}</Section>
        TODO
      </Transition>
    </div>
  );
};
